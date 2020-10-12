import { App } from '../App';
import Operand, { OperandTypes } from '../models/Operand';
import { CommonCheckers, operandMemSize } from './common';

export function __mov(params: Operand[]) {
	CommonCheckers.expectCount(params, 2);
	CommonCheckers.expectNoMem2Mem(params);
	CommonCheckers.expectMutable(params[0]);

	if (params[1].type === OperandTypes.string) {
		if (!params[0].isMemory) throw new Error('C00X - Invalid operands. Expected left operand to be memory.');
	}
}
export function mov(app: App, params: Operand[]) {
	let dest = params[0];
	let src = params[1];

	if (src.type === OperandTypes.string) {
		let memAddr = dest.getCompiledSelf(app);

		const str = (src.getValue(app, 1) as any) as string;
		for (let i = 0; i < str.length; i++) {
			const code = Math.min(str.charCodeAt(i), 255);
			app.memory.writeUInt8(code, memAddr);
			memAddr++;
		}
		app.memory.writeUInt8(0, memAddr);

		app.registers.eip._32 += 4;
	} else {
		let memSize = operandMemSize([ dest, src ]) || 4;
		let val = src.getValue(app, memSize);

		dest.setValue(app, memSize, val);
		app.registers.eip._32 += 4;
	}
}

export function __push(params: Operand[]) {
	CommonCheckers.expectCount(params, 1);
	CommonCheckers.expectNoMem(params[0]);
	CommonCheckers.expectMemSize(params[0], 4);
}
export function push(app: App, params: Operand[]) {
	let src = params[0];
	if (src.requiredMemSize && src.requiredMemSize !== 4) throw new Error('No');

	app.registers.esp._32 -= 4;
	app.memory.writeUInt32LE(src.getValue(app, 4), app.registers.esp._32);
	app.registers.eip._32 += 4;
}

export function __pop(params: Operand[]) {
	CommonCheckers.expectCount(params, 1);
	CommonCheckers.expectNoMem(params[0]);
	CommonCheckers.expectMemSize(params[0], 4);
	CommonCheckers.expectMutable(params[0]);
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
