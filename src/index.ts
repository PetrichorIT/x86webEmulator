import { App } from './App';
import * as x86 from './x86';
import { DOMApp } from './dom/DOMApp';
/**
 * Initialize application using all avaiable commands
 * and present said application using a DOMApp
 */
new DOMApp(new App(x86));
