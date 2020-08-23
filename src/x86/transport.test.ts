import * as t from './transport';
import { App } from '../App';
import Operand, { OperandTypes } from '../models/Operand';

describe('@Test MOV', () => {
	let app: App = new App(t);

	it('MOV reg32, const', () => {
		t.mov(app, [ new Operand(OperandTypes.register, 'eax'), new Operand(OperandTypes.const, 0xf0f0f0f0) ]);
		expect(app.registers.eip._32).toEqual(4);
		expect(app.registers.eax._32).toEqual(0xf0f0f0f0);
	});

	it('MOV reg32, reg32', () => {
		t.mov(app, [ new Operand(OperandTypes.register, 'ebx'), new Operand(OperandTypes.register, 'eax') ]);
		expect(app.registers.ebx._32).toEqual(0xf0f0f0f0);

		t.mov(app, [ new Operand(OperandTypes.register, 'cx'), new Operand(OperandTypes.register, 'bx') ]);
		expect(app.registers.ecx._16).toEqual(0xf0f0);
		expect(app.registers.ecx._32).toEqual(0x0000f0f0);

		expect(() =>
			t.mov(app, [ new Operand(OperandTypes.register, 'edi'), new Operand(OperandTypes.register, 'cx') ])
		).toThrowError();
	});

	it('MOV reg32, mem', () => {
		app.memory.writeUInt32LE(0xa0a0a0a0, 0xe);
		t.mov(app, [ new Operand(OperandTypes.register, 'eax'), new Operand(OperandTypes.mDirect, 0xe) ]);
		expect(app.registers.eax._32).toEqual(0xa0a0a0a0);
	});

	it('MOV mem, reg32', () => {
		t.mov(app, [ new Operand(OperandTypes.mDirect, 0xee), new Operand(OperandTypes.register, 'eax') ]);
		expect(app.memory.readUInt32LE(0xee)).toEqual(0xa0a0a0a0);
	});

	it('MOV mem, mem', () => {
		expect(() =>
			t.mov(app, [ new Operand(OperandTypes.mDirect, 0), new Operand(OperandTypes.mDirect, 0) ])
		).toThrowError();
	});

	it('MOV reg8, const', () => {
		app.registers.eax._32 = 0;
		t.mov(app, [ new Operand(OperandTypes.register, 'ah'), new Operand(OperandTypes.const, 0xaaa) ]);
		expect(app.registers.eax._32).toEqual(0x0000aa00);
		t.mov(app, [ new Operand(OperandTypes.register, 'al'), new Operand(OperandTypes.const, 0xbb) ]);
		expect(app.registers.eax._32).toEqual(0x0000aabb);
	});

	it('MOV reg8, reg8', () => {
		app.registers.ebx._32 = 0;
		t.mov(app, [ new Operand(OperandTypes.register, 'bl'), new Operand(OperandTypes.register, 'ah') ]);
		expect(app.registers.ebx._32).toEqual(0x000000aa);
	});

	it('MOV mem, reg8', () => {
		app.memory.writeUInt32LE(0, 0xff);
		t.mov(app, [ new Operand(OperandTypes.mDirect, 0xff), new Operand(OperandTypes.register, 'ah') ]);
		expect(app.memory.readUInt8(0xff)).toEqual(0xaa);
		expect(app.memory.readUInt32LE(0xff)).toEqual(0xaa);
	});
});

describe('@Test PUSH', () => {
	let app: App = new App(t);
	app.registers.esp._32 = 100;

	it('PUSH const', () => {
		t.push(app, [ new Operand(OperandTypes.const, 0xf0f0f0f0) ]);
		t.push(app, [ new Operand(OperandTypes.const, 0xa0a0a0a0) ]);
		expect(app.memory.readUInt32LE(96)).toEqual(0xf0f0f0f0);
		expect(app.memory.readUInt32LE(92)).toEqual(0xa0a0a0a0);
		expect(app.registers.esp._32).toEqual(92);
	});

	it('PUSH reg32', () => {
		app.registers.eax._32 = 0xe;

		t.push(app, [ new Operand(OperandTypes.register, 'eax') ]);
		expect(app.memory.readUInt32LE(88)).toEqual(0xe);
		expect(app.registers.esp._32).toEqual(88);
	});
});

describe('@Test POP', () => {
	let app: App = new App(t);
	app.registers.esp._32 = 100;
	app.registers.ebp._32 = 100;

	it('init(_:push)', () => {
		t.push(app, [ new Operand(OperandTypes.const, 0xf0f0f0f0) ]);
		t.push(app, [ new Operand(OperandTypes.const, 0xa0a0a0a0) ]);
		t.push(app, [ new Operand(OperandTypes.const, 0x40404040) ]);
	});

	it('POP reg32', () => {
		t.pop(app, [ new Operand(OperandTypes.register, 'eax') ]);
		expect(app.registers.eax._32).toEqual(0x40404040);
		t.pop(app, [ new Operand(OperandTypes.register, 'ebx') ]);
		expect(app.registers.ebx._32).toEqual(0xa0a0a0a0);
		t.pop(app, [ new Operand(OperandTypes.register, 'ecx') ]);
		expect(app.registers.ecx._32).toEqual(0xf0f0f0f0);

		expect(() => t.pop(app, [ new Operand(OperandTypes.register, 'edx') ])).toThrowError();
	});
});
