import { App } from '../App';
import Operand, { OperandTypes } from '../models/Operand';

export function call(app: App, params: Operand[]) {
	let op = params[0];
	if (op.isMemory) throw new Error('noMem');

	let neweip = op.getValue(app, 4);

	app.registers.eip._32 += 4;
	// Push EBP onto stack
	app.registers.esp._32 -= 4;
	app.memory.writeUInt32LE(app.registers.ebp._32, app.registers.esp._32);

	// Push EIP onto stack
	app.registers.esp._32 -= 4;
	app.memory.writeUInt32LE(app.registers.eip._32, app.registers.esp._32);

	app.registers.ebp._32 = app.registers.esp._32;
	app.registers.eip._32 = neweip;
}

export function ret(app: App, params: Operand[]) {
	// Pop eip from stack
	app.registers.eip._32 = app.memory.readUInt32LE(app.registers.esp._32);
	app.registers.esp._32 += 4;

	// Pop EBP from strack
	app.registers.ebp._32 = app.memory.readUInt32LE(app.registers.esp._32);
	app.registers.esp._32 += 4;
}

export function jmp(app: App, params: Operand[]) {
	let op = params[0];
	let memSize = op.requiredMemSize || 4;

	let newEIP = op.getValue(app, memSize);
	app.registers.eip._32 = newEIP;
}

export function je(app: App, params: Operand[]) {
	jz(app, params);
}
export function jz(app: App, params: Operand[]) {
	let op = params[0];
	let memSize = op.requiredMemSize || 4;

	let newEIP = op.getValue(app, memSize);
	if (app.flags.ZF === true) {
		app.registers.eip._32 = newEIP;
	} else {
		app.registers.eip._32 += 4;
	}
}

export function jne(app: App, params: Operand[]) {
	jnz(app, params);
}
export function jnz(app: App, params: Operand[]) {
	let op = params[0];
	let memSize = op.requiredMemSize || 4;

	let newEIP = op.getValue(app, memSize);
	if (app.flags.ZF === false) {
		app.registers.eip._32 = newEIP;
	} else {
		app.registers.eip._32 += 4;
	}
}

export function nop(app: App, params: Operand[]) {
	app.registers.eip._32 += 4;
}
