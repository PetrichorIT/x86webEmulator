import { App } from './App';
import * as x86 from './x86';
import { DOMApp } from './dom/DOMApp';
import { includeLibs } from './x86/lib/lib';

let app = new App(x86);
includeLibs(app);

let domApp = new DOMApp(app);
