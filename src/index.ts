import { App } from './App';
import * as x86 from './x86';
import { DOMRegister } from './dom/DOMRegister';
import { DOMFlag } from './dom/DOMFlag';
import DOMMemory from './dom/DOMMemory';
import Parser from './parsers';

import { initSyntax } from './parsers/syntax';
import * as CodeMirror from 'codemirror';

let app = new App(x86);

for (const regName in app.registers) {
	let dom = new DOMRegister(app, regName);
}

for (const flgName in app.flags) {
	let dom = new DOMFlag(app, flgName);
}
let d = new DOMMemory(app);

const textField = document.getElementById('editor') as HTMLTextAreaElement;
const compileDOM = document.getElementById('compile');
const stepDOM = document.getElementById('step');
const runDOM = document.getElementById('run');

compileDOM.addEventListener('click', () => {
	let p = new Parser().parse(editor.getDoc().getValue());
	app.runProgram(p);
});

stepDOM.addEventListener('click', () => {
	app.instructionCycle();
});

let running: boolean = false;
runDOM.addEventListener('click', () => {
	if (running) return;

	while (true) {
		app.instructionCycle();
	}
});

initSyntax();
let editor = CodeMirror.fromTextArea(textField, {
	mode: 'x86',
	theme: 'material-darker',
	lineNumbers: true,
	indentUnit: 4,
	lineNumberFormatter: (i) => '0x' + i.toString(16)
});

(global as any).CodeMirror = CodeMirror;
