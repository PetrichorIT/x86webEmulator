import * as CodeMirror from 'codemirror';

import { App } from '../App';
import DOMRegister from './DOMRegister';
import DOMMemory from './DOMMemory';
import DOMFlag from './DOMFlag';
import { initSyntax } from '../parsers/syntax';
import SemiPersistentStorage from './common';
import { CompilerError } from '../parsers/const';
import { Lib } from '../lib/lib';
import { DOMSettings } from './DOMSettings';
import { DOMLibaryController } from './DOMLibaryController';

let _firstBuild: boolean = true;

export class DOMApp {
	public app: App;
	private registers: { [key: string]: DOMRegister };
	private flags: { [key: string]: DOMFlag };
	private memory: DOMMemory;

	public editor: CodeMirror.EditorFromTextArea;
	private debugBox: HTMLDivElement;

	private compileButton: HTMLButtonElement;
	private pauseButton: HTMLButtonElement;
	private stepButton: HTMLButtonElement;
	private runButton: HTMLButtonElement;

	private fileInputButton: HTMLInputElement;
	private fileDownloadButton: HTMLButtonElement;

	private running: boolean;
	private preferredFilename = 'code.txt';
	
	speedUpLibaryCode: boolean = true;

	/**
	 * Creates a DOMApp object that links the given application to the DOM
	 */
	constructor(app: App) {
		this.app = app;
		this.registers = {};
		this.flags = {};
		this.running = false;

		Lib.loadDefaultLibs(this.app);
		Lib.loadLocalLibs(this.app);

		this.buildDebug();
		this.build();
	}

	/**
	 * Links the console functions to the debug component
	 */
	private buildDebug() {
		(console as any)._info = console.info;
		console.info = (message?: string, ...optionalParams: any[]): void => {
			this.debug(message, 'info');
			(console as any)._info(message, ...optionalParams);
		};

		(console as any)._error = console.error;
		console.error = (message?: string, ...optionalParams: any[]): void => {
			this.debug(message || '', 'error');
			(console as any)._error(message, ...optionalParams);
		};
	}

	/**
	 * Prints debug output to the debug component in the DOM
	 */
	private debug(message: string, type?: 'error' | 'info') {
		type = type || 'info';
		const art = document.createElement('article');
		art.classList.add(type);
		art.innerHTML =
			`<i class="fas ${type === 'error'
				? 'fa-exclamation-circle'
				: 'fa-info-circle'}" style="padding-right: 10px;"></i>` + message;
		this.debugBox.appendChild(art);

		setTimeout(() => art.remove(), type === 'error' ? 30000 : 10000);
	}

	/**
	 * Links & Creates the DOM Components at first init(_:)
	 */
	private build() {
		for (const regName in this.app.registers) {
			this.registers[regName] = new DOMRegister(this.app, regName);
		}
		for (const flgName in this.app.flags) {
			this.flags[flgName] = new DOMFlag(this.app, flgName);
		}
		if (!this.memory) this.memory = new DOMMemory(this.app);

		if (_firstBuild) initSyntax();

		new DOMSettings(this.app, this);
		new DOMLibaryController(this);

		this.buildDropdowns()

		const textArea = document.getElementById('editor') as HTMLTextAreaElement;
		this.editor = CodeMirror.fromTextArea(textArea, {
			mode: 'x86',
			theme: 'material-darker',
			lineNumbers: true,
			indentUnit: 4,
			lineNumberFormatter: (i) => '0x' + i.toString(16)
		});

		this.editor.getDoc().setValue(SemiPersistentStorage.getData('_editor_snapshot') || '');
		this.editor.on('inputRead', () => this.onEditorChange());

		this.compileButton = document.getElementById('compile') as HTMLButtonElement;
		this.compileButton.addEventListener('click', () => this.onCompile());

		this.pauseButton = document.getElementById('pause') as HTMLButtonElement;
		this.pauseButton.addEventListener('click', () => this.onPause());

		this.stepButton = document.getElementById('step') as HTMLButtonElement;
		this.stepButton.addEventListener('click', () => this.onStep());

		this.runButton = document.getElementById('run') as HTMLButtonElement;
		this.runButton.addEventListener('click', async () => await this.onRun());

		this.fileInputButton = document.getElementById('fileInput') as HTMLInputElement;
		this.fileInputButton.addEventListener('change', () => this.onFileInput());

		this.fileDownloadButton = document.getElementById('downloadButton') as HTMLButtonElement;
		this.fileDownloadButton.addEventListener('click', () => this.onDownload());

		this.debugBox = document.getElementById('debug-box') as HTMLDivElement;

		this.app.subscribe(() => this.onInstructionCycle());

		_firstBuild = false;
	}

	/**
	 * Handles Dropdowns
	 */
	private buildDropdowns() {		
		document.querySelectorAll(".dropdown").forEach((node) => {
			const id = node.id;
			if (!id) return;

			const storageID = "dropdown:" + id

			let extened = SemiPersistentStorage.getData(storageID) !== "true";
			let header = document.getElementById(id + ":header");
			let body = document.getElementById(id + ":body");

			let title = header.innerHTML;
			let width = body.offsetHeight;

			if (header && body) 
				header.addEventListener("click", () => {
					body.style.paddingTop = extened ? "0px" : "15px";
					body.style.paddingBottom = extened ? "0px" : "5px";
					body.style.height = extened ? "0px" : (width + "px");
					header.innerHTML = extened ? "►" + title : "▼" + title
					extened = !extened;

					SemiPersistentStorage.setData(storageID, extened ? "true" : "false");
				})

				header.click();
		})
	}

	/**
	 * Handels debug / editor updates after the end of an instrcution cycle
	 */
	private onInstructionCycle() {
		let nextInstrIdx = this.app.memory.readUInt32LE(this.app.registers.eip._32);
		this.editor.getDoc().getAllMarks().forEach((m) => m.clear());
		if (nextInstrIdx >= this.app.instructions.length || nextInstrIdx === 0) return;
		let line = this.app.instructions[nextInstrIdx].lineNumber;
		this.editor.markText({ line, ch: 0 }, { line, ch: 255 }, { css: 'background-color: rgba(17, 165, 175, 0.5);' });
	}

	/**
	 * Remove markings if editor is changed
	 */
	private onEditorChange() {
		this.editor.getDoc().getAllMarks().forEach((m) => m.clear());
	}

	/**
	 * Handles actions if the compile button is pressed
	 */
	private onCompile() {
		this.editor.getDoc().getAllMarks().forEach((m) => m.clear());

		const tsmp = new Date().getMilliseconds() & 0xff;
		console.info(`Parsing new snapshot $${tsmp}`);

		try {
			let p = this.app.parser.parse(this.editor.getDoc().getValue());
			console.log(p)
			console.info(`Parsed snapshot $${tsmp} - Got ${p.length} instructions`);

			this.app.runProgram(p);

			SemiPersistentStorage.setData('_editor_snapshot', this.editor.getDoc().getValue());
			console.info(`Done ... Snapshot $${tsmp} with EIP 0x${this.app.registers.eip._32.toString(16)}`);
		} catch (e) {
			if (e.line !== undefined && e.position !== undefined) {
				let err = e as CompilerError;
				this.editor.markText(
					{ line: err.line, ch: err.position.from },
					{ line: err.line, ch: err.position.to || 255 },
					{ css: 'background-color: rgba(200, 50, 30, 0.5);' }
				);

				console.error(e.message);
			} else {
				throw e;
			}
		}
	}

	/**
	 * Handles actions if the run button is pressed
	 */
	private async onRun() {
		if (this.running) return;
		this.running = true;

		console.info(`Starting run loop at EIP 0x${this.app.registers.eip._32.toString(16)}`);

		try {
			while (this.running && this.app.instructionCycle()) {
				if (!this.app.isInLibMode || !this.speedUpLibaryCode) await new Promise((r) => setTimeout(r, this.app.instructionDelay));
			}
			if (this.running) {
				console.info(`Ended run loop at EIP 0x${this.app.registers.eip._32.toString(16)}`);
			}
		} catch (e) {
			if (e.message === 'NOP') {
				if (this.running) {
					console.info(`Ended run loop at EIP 0x${this.app.registers.eip._32.toString(16)}`);
				}
			} else {
				console.error(`Runtime error: ${e}`);
			}
		} finally {
			this.running = false;
		}
	}

	private onPause() {
		console.info(`Paused run loop at EIP 0x${this.app.registers.eip._32.toString(16)}`);
		this.running = false;
	}

	/**
	 * Handles actions if the step button is pressed
	 */
	private onStep() {
		console.info(`Stepping to instruction at EIP 0x${this.app.registers.eip._32.toString(16)}`);
		this.app.instructionCycle();
	}

	/**
	 * Reads and intergrates a given file as code input for the editor.
	 */
	private onFileInput() {
		const file = this.fileInputButton.files[0];

		const fr = new FileReader();
		fr.onloadend = (e) => {
			console.info(`Loaded Snapshot from file Client:${file.name}`);
			const content = fr.result;
			this.editor.getDoc().setValue(content as string);
		};

		fr.onerror = (e) => {
			console.error(`Failed to load Snapshot from Client: ${fr.error}`);
		};
		this.preferredFilename = file.name;
		fr.readAsText(file);
	}

	/**
	 * Exports the current content of the editor as textfile, to be downloaded by the user.
	 */
	private onDownload() {
		const prefix = `; x86 Assembler Export\n; Exported from ${location.origin}\n\n`;
		let text = this.editor.getDoc().getValue();
		if (!text.startsWith(prefix)) text = prefix + text;

		const url = URL.createObjectURL(new Blob([ text ], { type: 'octet/stream' }));
		const a = document.createElement('a');
		a.href = url;
		a.download = this.preferredFilename;
		a.click();
		URL.revokeObjectURL(url);
	}
}
