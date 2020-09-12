import { App } from './App';
import * as x86 from './x86';
import { DOMApp } from './dom/DOMApp';
import fib from './x86/lib/fib';
import { string, stringEntryPoints } from './x86/lib/string';

let app = new App(x86);

app.loadLib('fib', fib, [ 'fib', 'clrMem' ]);
app.loadLib('string', string, stringEntryPoints);

let domApp = new DOMApp(app);
