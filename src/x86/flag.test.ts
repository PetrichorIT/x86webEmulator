import * as flag from './flag';
import { App } from '../App';

describe('@Test STC / CLC, CMC', () => {
	let app: App;

	it('app.init(_:)', () => {
		expect(() => (app = new App(flag))).not.toThrow();
	});

	it('STC', () => {
		expect(() => flag.stc(app, [])).not.toThrow();
		expect(app.flags.CF).toEqual(true);
	});

	it('CLC', () => {
		expect(() => flag.clc(app, [])).not.toThrow();
		expect(app.flags.CF).toEqual(false);
	});

	it('CMC', () => {
		app.flags.CF = false;
		expect(() => flag.cmc(app, [])).not.toThrow();
		expect(app.flags.CF).toEqual(true);
		expect(() => flag.cmc(app, [])).not.toThrow();
		expect(app.flags.CF).toEqual(false);
	});
});
