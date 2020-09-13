import { App } from '../../App';
import * as x86 from '../index';
import fib from './fib';
import { string, stringEntryPoints } from './string';

describe('@Test Lib load test', () => {
	let app: App;

	it('App.init(_:)', () => {
		expect(() => (app = new App(x86))).not.toThrow();
	});

	// FIB
	it('Load lib "fib"', () => {
		expect(() => app.loadLib('fib', fib)).not.toThrow();
	});

	it('Test lib "fib"', () => {
		expect(() => app.parse('#include "fib"')).not.toThrow();
	});

	// STRING
	it('Load lib "string"', () => {
		expect(() => app.loadLib('string', string, stringEntryPoints)).not.toThrow();
	});

	it('Test lib "string"', () => {
		expect(() => app.parse('#include "string"')).not.toThrow();
	});
});
