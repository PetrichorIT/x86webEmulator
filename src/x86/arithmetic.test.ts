import { App } from '../App';
import * as arithmetic from './arithmetic';
import Operand, { OperandTypes } from '../models/Operand';

let app: App;
beforeAll(() => (app = new App(arithmetic)));

describe('@Test ADD', () => {
	// let app: App = new App(arithmetic);

	it('ADD reg32, const', () => {
		app.registers.eax._32 = 300;
		app.registers.ebx._32 = 100;
		app.registers.ecx._32 = 100;

		arithmetic.add(app, [ new Operand(OperandTypes.register, 'eax'), new Operand(OperandTypes.const, 100) ]);
		expect(app.registers.eax._32).toEqual(400);

		arithmetic.add(app, [ new Operand(OperandTypes.register, 'ebx'), new Operand(OperandTypes.const, -100) ]);
		expect(app.registers.ebx._32).toEqual(0);
		expect(app.flags.ZF).toEqual(true);

		arithmetic.add(app, [ new Operand(OperandTypes.register, 'ecx'), new Operand(OperandTypes.const, -110) ]);
		expect(app.registers.ecx._32).toEqual(-10);
		expect(app.flags.SF).toEqual(true);
	});

	it('ADD reg32, reg32', () => {
		// EAX 400 EBX 0 ECX -10

		arithmetic.add(app, [ new Operand(OperandTypes.register, 'eax'), new Operand(OperandTypes.register, 'ecx') ]);
		expect(app.registers.eax._32).toEqual(390);
	});

	it('ADD reg32, mem', () => {
		app.memory.writeInt32LE(-100, 0xe);
		arithmetic.add(app, [ new Operand(OperandTypes.register, 'eax'), new Operand(OperandTypes.mDirect, 0xe) ]);
		expect(app.registers.eax._32).toEqual(290);
	});

	it('ADD mem, reg32', () => {
		app.memory.writeInt32LE(-100, 0xe);
		arithmetic.add(app, [ new Operand(OperandTypes.mDirect, 0xe), new Operand(OperandTypes.register, 'eax') ]);
		expect(app.memory.readInt32LE(0xe)).toEqual(190);
	});
});

describe('@Test ADC', () => {
	// let app: App = new App(arithmetic);

	it('ADC reg32, const', () => {
		app.registers.eax._32 = 300;
		app.flags.CF = true;

		arithmetic.adc(app, [ new Operand(OperandTypes.register, 'eax'), new Operand(OperandTypes.const, 100) ]);
		expect(app.registers.eax._32).toEqual(401);
		expect(app.flags.CF).toEqual(false);

		app.registers.ebx._32 = 100;

		arithmetic.adc(app, [ new Operand(OperandTypes.register, 'ebx'), new Operand(OperandTypes.const, -100) ]);
		expect(app.registers.ebx._32).toEqual(0);
		expect(app.flags.ZF).toEqual(true);
		expect(app.flags.CF).toEqual(false);

		app.registers.ecx._32 = 100;
		app.flags.CF = true;

		arithmetic.adc(app, [ new Operand(OperandTypes.register, 'ecx'), new Operand(OperandTypes.const, -110) ]);
		expect(app.registers.ecx._32).toEqual(-9);
		expect(app.flags.SF).toEqual(true);
		expect(app.flags.CF).toEqual(false);
	});

	it('ADC reg32, reg32', () => {
		app.registers.eax._32 = 400;
		app.registers.ecx._32 = -10;
		app.flags.CF = true;

		arithmetic.adc(app, [ new Operand(OperandTypes.register, 'eax'), new Operand(OperandTypes.register, 'ecx') ]);
		expect(app.registers.eax._32).toEqual(391);
		expect(app.flags.CF).toEqual(false);
	});

	it('ADC reg32, mem', () => {
		app.memory.writeInt32LE(-100, 0xe);
		app.registers.eax._32 = 390;
		app.flags.CF = true;

		arithmetic.adc(app, [ new Operand(OperandTypes.register, 'eax'), new Operand(OperandTypes.mDirect, 0xe) ]);
		expect(app.registers.eax._32).toEqual(291);
	});

	it('ADC mem, reg32', () => {
		app.memory.writeInt32LE(-100, 0xe);
		app.registers.eax._32 = 290;
		app.flags.CF = true;

		arithmetic.adc(app, [ new Operand(OperandTypes.mDirect, 0xe), new Operand(OperandTypes.register, 'eax') ]);
		expect(app.memory.readInt32LE(0xe)).toEqual(191);
	});
});

describe('@Test INC', () => {
	it('INC reg32', () => {
		app.registers.eax._32 = 10;

		arithmetic.inc(app, [ new Operand(OperandTypes.register, 'eax') ]);
		expect(app.registers.eax._32).toEqual(11);
	});

	it('INC reg16', () => {
		app.registers.eax._32 = 0xdddddddd;

		arithmetic.inc(app, [ new Operand(OperandTypes.register, 'ax') ]);
		expect(app.registers.eax._16).toEqual(0xddde);

		app.registers.eax._32 = 0xddddffff;
		arithmetic.inc(app, [ new Operand(OperandTypes.register, 'ax') ]);
		expect(app.registers.eax._16).toEqual(0);
		expect(app.flags.ZF).toEqual(true);
		// expect(app.registers.eax._32).toEqual(0xdddd0000);error
	});

	it('INC const/mem -> fail', () => {
		expect(() => arithmetic.inc(app, [ new Operand(OperandTypes.const, 12) ])).toThrow();
		expect(() => arithmetic.inc(app, [ new Operand(OperandTypes.mDirect, 12) ])).toThrow();
	});
});

describe('@Test INC', () => {
	it('DEC reg32', () => {
		app.registers.eax._32 = 10;

		arithmetic.dec(app, [ new Operand(OperandTypes.register, 'eax') ]);
		expect(app.registers.eax._32).toEqual(9);
	});

	it('DEC reg16', () => {
		app.registers.eax._32 = 0xdddddddd;

		arithmetic.dec(app, [ new Operand(OperandTypes.register, 'ax') ]);
		expect(app.registers.eax._16).toEqual(0xdddc);

		app.registers.eax._32 = 0xdddd0001;
		arithmetic.dec(app, [ new Operand(OperandTypes.register, 'ax') ]);
		expect(app.registers.eax._16).toEqual(0);
		expect(app.flags.ZF).toEqual(true);
		// expect(app.registers.eax._32).toEqual(0xdddd0000);error
	});

	it('DEC const/mem -> fail', () => {
		expect(() => arithmetic.dec(app, [ new Operand(OperandTypes.const, 12) ])).toThrow();
		expect(() => arithmetic.dec(app, [ new Operand(OperandTypes.mDirect, 12) ])).toThrow();
	});
});
