import { App } from './App';
import * as x86 from './x86';
import { DOMApp } from './dom/DOMApp';
import fib from './x86/lib/fib';

let app = new App(x86);

app.loadLib('fib', fib);

let domApp = new DOMApp(app);
