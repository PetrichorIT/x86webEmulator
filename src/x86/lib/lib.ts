import { App } from '../../App';
import fib from './fib';
import { string, stringEntryPoints } from './string';

export function includeLibs(app: App) {
	try {
		app.loadLib('fib', fib);
		app.loadLib('string', string, stringEntryPoints);
	} catch (e) {
		console.error(e);
	}
}
