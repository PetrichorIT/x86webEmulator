import { App } from './App';
import * as x86 from './x86';
import { DOMApp } from './dom/DOMApp';
import { Lib } from './lib/lib';

let app = new App(x86);

Lib.loadDefaultLibs(app);
Lib.loadLocalLibs(app);

let domApp = new DOMApp(app);
