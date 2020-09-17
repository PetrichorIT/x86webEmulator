import { App } from './App';
import * as x86 from './x86';
import { DOMApp } from './dom/DOMApp';

new DOMApp(new App(x86));
