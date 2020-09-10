import * as CodeMirror from 'codemirror';

import { App } from '../App';
import DOMRegister from './DOMRegister';
import DOMMemory from './DOMMemory';
import DOMFlag from './DOMFlag';
import { initSyntax } from '../parsers/syntax';
import Parser from '../parsers/parser';
import PersistentStorage from './common';

let _firstBuild: boolean = true;

export class DOMApp {
	private app: App;
	private registers: { [key: string]: DOMRegister };
	private flags: { [key: string]: DOMFlag };
	private memory: DOMMemory;
	private editor: CodeMirror.EditorFromTextArea;
	private debugBox: HTMLDivElement;

	private compileButton: HTMLButtonElement;
	private runButton: HTMLButtonElement;
	private stepButton: HTMLButtonElement;

	private fileInputButton: HTMLInputElement;
	private fileDownloadButton: HTMLButtonElement;

	private running: boolean;
	private preferredFilename = 'code.txt';

	constructor(app: App) {
		this.app = app;
		this.registers = {};
		this.flags = {};
		this.running = false;

		this.build();
	}

	/**
	 * Intiatial setup of the DOMApp Controller
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
		const textArea = document.getElementById('editor') as HTMLTextAreaElement;
		this.editor = CodeMirror.fromTextArea(textArea, {
			mode: 'x86',
			theme: 'material-darker',
			lineNumbers: true,
			indentUnit: 4,
			lineNumberFormatter: (i) => '0x' + i.toString(16)
		});

		this.editor.getDoc().setValue(PersistentStorage.getData('_editor_snapshot') || '');

		this.compileButton = document.getElementById('compile') as HTMLButtonElement;
		this.compileButton.addEventListener('click', () => this.onCompile());

		this.runButton = document.getElementById('run') as HTMLButtonElement;
		this.runButton.addEventListener('click', async () => await this.onRun());

		this.stepButton = document.getElementById('step') as HTMLButtonElement;
		this.stepButton.addEventListener('click', () => this.onStep());

		this.fileInputButton = document.getElementById('fileInput') as HTMLInputElement;
		this.fileInputButton.addEventListener('change', () => this.onFileInput());

		this.fileDownloadButton = document.getElementById('downloadButton') as HTMLButtonElement;
		this.fileDownloadButton.addEventListener('click', () => this.onDownload());

		this.debugBox = document.getElementById('debug-box') as HTMLDivElement;

		this.app.subscribe(() => this.onInstructionCycle());

		_firstBuild = false;
	}

	/**
	 * Prints debug output to the debug component in the DOM
	 * @param message Message to be send
	 * @param type Message type 
	 */
	private debug(message: string, type?: 'error' | 'info') {
		type = type || 'info';
		const art = document.createElement('article');
		art.classList.add(type);
		art.innerHTML = message;
		this.debugBox.appendChild(art);

		setTimeout(() => art.remove(), type === 'error' ? 30000 : 10000);
	}

	/**
	 * Handels debug / editor updates after the end of an instrcution cycle
	 */
	private onInstructionCycle() {
		let nextInstrIdx = this.app.memory.readUInt32LE(this.app.registers.eip._32);
		this.editor.getDoc().getAllMarks().forEach((m) => m.clear());
		if (nextInstrIdx >= this.app.instructions.length || nextInstrIdx === 0) return;
		console.log(this.app.instructions, nextInstrIdx);
		let line = this.app.instructions[nextInstrIdx].lineNumber;
		this.editor.markText({ line, ch: 0 }, { line, ch: 255 }, { css: 'background-color: rgba(17, 165, 175, 0.5);' });
	}

	/**
	 * Handles actions if the compile button is pressed
	 */
	private onCompile() {
		const tsmp = new Date().getTime();
		this.debug(`Parsing new Snapshot $${tsmp}`);

		try {
			let p = new Parser().parse(this.editor.getDoc().getValue(), this.app);
			this.debug(`Parsed Snapshot $${tsmp} - Got ${p.length} instructions`);

			this.debug(`Writing new Snapshot $${tsmp}`);
			this.app.runProgram(p);

			PersistentStorage.setData('_editor_snapshot', this.editor.getDoc().getValue());
			this.debug(`Done ... Snapshot $${tsmp} with EIP 0x${this.app.registers.eip._32.toString(16)}`);
		} catch (e) {
			if (e.message.startsWith('C')) {
				// Compil error
				this.debug(e, 'error');
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

		this.debug(`Starting run loop at EIP 0x${this.app.registers.eip._32.toString(16)}`);

		try {
			while (this.app.instructionCycle()) await new Promise((r) => setTimeout(r, 100));
		} catch (e) {
			if (e.message === 'NOP') {
				// FINE
			} else {
				this.debug(`Runtime error: ${e}`, 'error');
			}
		} finally {
			this.debug(`Ended run loop at EIP 0x${this.app.registers.eip._32.toString(16)}`);
			this.running = false;
		}
	}

	/**
	 * Handles actions if the step button is pressed
	 */
	private onStep() {
		this.debug(`Stepping to instruction at EIP 0x${this.app.registers.eip._32.toString(16)}`);
		this.app.instructionCycle();
	}

	/**
	 * Reads and intergrates a given file as code input for the editor.
	 */
	private onFileInput() {
		const file = this.fileInputButton.files[0];

		const fr = new FileReader();
		fr.onloadend = (e) => {
			this.debug(`Loaded Snapshot from file Client:${file.name}`);
			const content = fr.result;
			this.editor.getDoc().setValue(content as string);
		};

		fr.onerror = (e) => {
			this.debug(`Failed to load Snapshot from Client: ${fr.error}`);
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
