import { App } from './App';
import * as x86 from './x86';
import Register32 from './models/Register32';
import { DOMRegister } from './dom/DOMRegister';
import { DOMFlag } from './dom/DOMFlag';

let app = new App(x86);

for (const regName in app.registers) {
	let dom = new DOMRegister(app, regName);
}

for (const flgName in app.flags) {
	let dom = new DOMFlag(app, flgName);
}

setInterval(() => console.log(app), 5000);
