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

	private compileButton: HTMLButtonElement;
	private runButton: HTMLButtonElement;
	private stepButton: HTMLButtonElement;

	private running: boolean;

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

		_firstBuild = false;
	}

	private onCompile() {
		let p = new Parser().parse(this.editor.getDoc().getValue());
		this.app.runProgram(p);
	}

	private async onRun() {
		if (this.running) return;
		this.running = true;

		try {
			while (this.app.instructionCycle()) await new Promise((r) => setTimeout(r, 100));
		} catch (e) {
			throw e;
		} finally {
			this.running = false;
		}
	}

	private onStep() {
		this.app.instructionCycle();
	}
}
