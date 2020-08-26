import { App } from './App';
import * as x86 from './x86';
import Register32 from './models/Register32';
import { DOMRegister } from './dom/DOMRegister';
import { DOMFlag } from './dom/DOMFlag';
import DOMMemory from './dom/DOMMemory';

let app = new App(x86);

for (const regName in app.registers) {
	let dom = new DOMRegister(app, regName);
}

for (const flgName in app.flags) {
	let dom = new DOMFlag(app, flgName);
}

let d = new DOMMemory(app);

setInterval(() => console.log(app), 5000);
