import { App } from '../App';
import Operand, { OperandTypes } from '../models/Operand';
import { operandMemSize } from './common';

export function mov(app: App, params: Operand[]) {
	let dest = params[0];
	let src = params[1];

	if (dest.isMemory && src.isMemory) throw new Error('Mem2Mem');

	let memSize = operandMemSize([ dest, src ]);
	let val = src.getValue(app, memSize);

	dest.setValue(app, memSize, val);
	app.registers.eip._32 += 4;
}

export function push(app: App, params: Operand[]) {
	let src = params[0];
	if (src.isMemory) throw new Error('Mem2Mem');
	if (src.requiredMemSize && src.requiredMemSize !== 4) throw new Error('No');

	app.registers.esp._32 -= 4;
	app.memory.writeUInt32LE(src.getValue(app, 4), app.registers.esp._32);
	app.registers.eip._32 += 4;
}

export function pop(app: App, params: Operand[]) {
	let src = params[0];
	if (src.isMemory) throw new Error('Mem2Mem');
	if (src.requiredMemSize !== 4) throw new Error('No');

	if (app.registers.esp._32 >= app.registers.ebp._32) throw new Error('STACK UNDERFLOW');

	let val = app.memory.readUInt32LE(app.registers.esp._32);
	src.setValue(app, 4, val);

	app.registers.esp._32 += 4;
	app.registers.eip._32 += 4;
}
