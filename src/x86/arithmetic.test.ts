import { App } from '../App';
import * as a from './arithmetic';
import Operand, { OperandTypes } from '../models/Operand';

describe('@Test ADD', () => {
	let app: App = new App(a);

	it('ADD reg32, const', () => {
		app.registers.eax._32 = 300;
		app.registers.ebx._32 = 100;
		app.registers.ecx._32 = 100;

		a.add(app, [ new Operand(OperandTypes.register, 'eax'), new Operand(OperandTypes.const, 100) ]);
		expect(app.registers.eax._32).toEqual(400);

		a.add(app, [ new Operand(OperandTypes.register, 'ebx'), new Operand(OperandTypes.const, -100) ]);
		expect(app.registers.ebx._32).toEqual(0);
		expect(app.flags.ZF).toEqual(true);

		a.add(app, [ new Operand(OperandTypes.register, 'ecx'), new Operand(OperandTypes.const, -110) ]);
		expect(app.registers.ecx._32).toEqual(-10);
		expect(app.flags.SF).toEqual(true);
	});

	it('ADD reg32, reg32', () => {
		// EAX 400 EBX 0 ECX -10

		a.add(app, [ new Operand(OperandTypes.register, 'eax'), new Operand(OperandTypes.register, 'ecx') ]);
		expect(app.registers.eax._32).toEqual(390);
	});

	it('ADD reg32, mem', () => {
		app.memory.writeInt32LE(-100, 0xe);
		a.add(app, [ new Operand(OperandTypes.register, 'eax'), new Operand(OperandTypes.mDirect, 0xe) ]);
		expect(app.registers.eax._32).toEqual(290);
	});

	it('ADD mem, reg32', () => {
		app.memory.writeInt32LE(-100, 0xe);
		a.add(app, [ new Operand(OperandTypes.mDirect, 0xe), new Operand(OperandTypes.register, 'eax') ]);
		expect(app.memory.readInt32LE(0xe)).toEqual(190);
	});
});
