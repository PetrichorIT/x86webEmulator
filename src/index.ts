import { App } from './App';
import * as x86 from './x86';
import { DOMApp } from './dom/DOMApp';

let app = new App(x86);
let domApp = new DOMApp(app);
