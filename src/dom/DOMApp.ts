import * as CodeMirror from 'codemirror';

import { App } from '../App';
import DOMRegister from './DOMRegister';
import DOMMemory from './DOMMemory';
import DOMFlag from './DOMFlag';
import { initSyntax } from '../parsers/syntax';
import Parser from '../parsers';

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

	private debug(message: string, type?: string) {
		type = type || 'info';
		const art = document.createElement('article');
		art.classList.add(type);
		art.innerHTML = message;
		this.debugBox.appendChild(art);

		setTimeout(() => art.remove(), type === 'error' ? 30000 : 10000);
	}

	private onInstructionCycle() {
		let nextInstrIdx = this.app.memory.readUInt32LE(this.app.registers.eip._32);
		this.editor.getDoc().getAllMarks().forEach((m) => m.clear());
		if (nextInstrIdx >= this.app.instructions.length) return;
		let line = this.app.instructions[nextInstrIdx].lineNumber;
		this.editor.markText({ line, ch: 0 }, { line, ch: 255 }, { css: 'background-color: rgba(17, 165, 175, 0.5);' });
	}

	private onCompile() {
		const tsmp = new Date().getTime();

		this.debug(`Parsing new Snapshot $${tsmp}`);
		let p = new Parser().parse(this.editor.getDoc().getValue());
		this.debug(`Parsed Snapshot $${tsmp} - Got ${p.length} instructions`);

		this.debug(`Writing new Snapshot $${tsmp}`);
		this.app.runProgram(p);

		this.debug(`Done ... Snapshot $${tsmp} with EIP 0x${this.app.registers.eip._32.toString(16)}`);
	}

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

	private onStep() {
		this.debug(`Stepping to instruction at EIP 0x${this.app.registers.eip._32.toString(16)}`);
		this.app.instructionCycle();
	}

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
