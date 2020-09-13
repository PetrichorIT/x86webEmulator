import { App } from '../App';
import * as x86 from '../x86/index';
import { Lib } from './lib';

describe('@Test Lib load test', () => {
	let app: App;

	it('App.init(_:)', () => {
		expect(() => (app = new App(x86))).not.toThrow();
	});

	it('Load default libs', () => {
		expect(() => Lib.loadDefaultLibs(app)).not.toThrow();
	});

	it('Test default lib  "fib"', () => {
		expect(() => app.parse('#include "fib"')).not.toThrow();
	});

	it('Test default lib "string"', () => {
		expect(() => app.parse('#include "string"')).not.toThrow();
	});
});