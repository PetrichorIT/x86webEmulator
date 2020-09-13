import { App } from '../App';
import * as l from './logic';
import Operand, { OperandTypes } from '../models/Operand';

describe('@Test AND', () => {
	let app: App = new App(l);
	app.registers.eax._32 = 0xffffffff;

	it('AND reg32, const', () => {
		l.and(app, [ new Operand(OperandTypes.register, 'eax'), new Operand(OperandTypes.const, 0x12345678) ]);
		expect(app.registers.eax._32).toEqual(0x12345678);
	});

	it('AND reg32, reg32', () => {
		app.registers.ebx._32 = 0x0000ffff;
		l.and(app, [ new Operand(OperandTypes.register, 'ebx'), new Operand(OperandTypes.register, 'eax') ]);
		expect(app.registers.ebx._32).toEqual(0x00005678);
	});

	it('AND reg8, const', () => {
		l.and(app, [ new Operand(OperandTypes.register, 'bh'), new Operand(OperandTypes.const, 0) ]);
		expect(app.registers.ebx._32).toEqual(0x00000078);
	});

	it('AND reg8, const', () => {
		l.and(app, [ new Operand(OperandTypes.register, 'bl'), new Operand(OperandTypes.const, 8) ]);
		expect(app.registers.ebx._32).toEqual(0x00000008);
	});
});

describe('@Test OR', () => {
	let app: App = new App(l);
	app.registers.eax._32 = 0;

	it('OR reg32, const', () => {
		l.or(app, [ new Operand(OperandTypes.register, 'eax'), new Operand(OperandTypes.const, 0x12345678) ]);
		expect(app.registers.eax._32).toEqual(0x12345678);
	});

	it('OR reg32, reg32', () => {
		app.registers.ebx._32 = 0x0000ffff;
		l.or(app, [ new Operand(OperandTypes.register, 'ebx'), new Operand(OperandTypes.register, 'eax') ]);
		expect(app.registers.ebx._32).toEqual(0x1234ffff);
	});

	it('OR reg8, const', () => {
		l.or(app, [ new Operand(OperandTypes.register, 'al'), new Operand(OperandTypes.const, 0xff) ]);
		expect(app.registers.eax._32).toEqual(0x123456ff);
	});

	it('OR reg8, const', () => {
		l.or(app, [ new Operand(OperandTypes.register, 'ah'), new Operand(OperandTypes.const, 0xff) ]);
		expect(app.registers.eax._32).toEqual(0x1234ffff);
	});
});

describe('@Test XOR', () => {
	let app: App = new App(l);
	app.registers.eax._32 = 0x12345678;

	it('XOR reg32, const', () => {
		l.xor(app, [ new Operand(OperandTypes.register, 'eax'), new Operand(OperandTypes.const, 0x12345678) ]);
		expect(app.registers.eax._32).toEqual(0x0);
	});

	it('XOR reg32, reg32', () => {
		app.registers.ebx._32 = 0x0000ffff;
		l.xor(app, [ new Operand(OperandTypes.register, 'ebx'), new Operand(OperandTypes.register, 'eax') ]);
		expect(app.registers.ebx._32).toEqual(0x0000ffff);
	});

	it('XOR reg8, const', () => {
		l.xor(app, [ new Operand(OperandTypes.register, 'al'), new Operand(OperandTypes.const, 0x0f) ]);
		expect(app.registers.eax._32).toEqual(0x0000000f);
	});

	it('XOR reg8, const', () => {
		l.xor(app, [ new Operand(OperandTypes.register, 'ah'), new Operand(OperandTypes.const, 0xff) ]);
		expect(app.registers.eax._32).toEqual(0x0000ff0f);
	});
});

describe('@Test NOT', () => {
	let app: App = new App(l);
	app.registers.eax._32 = 0x12345678;

	it('NOT reg32', () => {
		l.not(app, [ new Operand(OperandTypes.register, 'eax') ]);
		expect(app.registers.eax._32).toEqual(-0x12345679);
	});
});

describe('@Test SHL', () => {
	let app: App = new App(l);
	app.registers.eax._32 = 0x11111111;

	it('SHL reg32, const', () => {
		l.shl(app, [ new Operand(OperandTypes.register, 'eax'), new Operand(OperandTypes.const, 2) ]);
		expect(app.registers.eax._32).toEqual(0x44444444);
	});

	it('SHL reg16, const', () => {
		l.shl(app, [ new Operand(OperandTypes.register, 'ax'), new Operand(OperandTypes.const, 1) ]);
		expect(app.registers.eax._32).toEqual(0x44448888);
	});
});

describe('@Test SHR', () => {
	let app: App = new App(l);
	app.registers.eax._32 = 0x88888888;

	it('SHR reg32, const', () => {
		l.shr(app, [ new Operand(OperandTypes.register, 'eax'), new Operand(OperandTypes.const, 2) ]);
		expect(app.registers.eax._32).toEqual(0x22222222);
	});

	it('SHR reg16, const', () => {
		l.shr(app, [ new Operand(OperandTypes.register, 'ax'), new Operand(OperandTypes.const, 1) ]);
		expect(app.registers.eax._32).toEqual(0x22221111);
	});
});
