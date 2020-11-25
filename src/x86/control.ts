import { App } from '../App';
import Operand from '../models/Operand';
import { CommonCheckers } from './common';

export function __call(params: Operand[]) {
	CommonCheckers.expectCount(params, 1);
	CommonCheckers.expectLabelLike(params[0]);
}
export function call(app: App, params: Operand[]) {
	let op = params[0];

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

export const __ret = CommonCheckers.noParams;
export function ret(app: App, params: Operand[]) {
	// Pop eip from stack
	app.registers.eip._32 = app.memory.readUInt32LE(app.registers.esp._32);
	app.registers.esp._32 += 4;

	// Pop EBP from strack
	app.registers.ebp._32 = app.memory.readUInt32LE(app.registers.esp._32);
	app.registers.esp._32 += 4;
}

export const __jmp = CommonCheckers.jumpLike;
export function jmp(app: App, params: Operand[]) {
	let op = params[0];
	let memSize = op.requiredMemSize || 4;

	let newEIP = op.getValue(app, memSize);
	app.registers.eip._32 = newEIP;
}

export const __je = CommonCheckers.jumpLike;
export function je(app: App, params: Operand[]) {
	jz(app, params);
}

export const __jz = CommonCheckers.jumpLike;
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

export const __jne = CommonCheckers.jumpLike;
export function jne(app: App, params: Operand[]) {
	jnz(app, params);
}

export const __jnz = CommonCheckers.jumpLike;
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

export const __jc = CommonCheckers.jumpLike;
export function jc(app: App, params: Operand[]) {
	let op = params[0];
	let memSize = op.requiredMemSize || 4;

	let newEIP = op.getValue(app, memSize);
	if (app.flags.CF === true) {
		app.registers.eip._32 = newEIP;
	} else {
		app.registers.eip._32 += 4;
	}
}

export const __jnc = CommonCheckers.jumpLike;
export function jnc(app: App, params: Operand[]) {
	let op = params[0];
	let memSize = op.requiredMemSize || 4;

	let newEIP = op.getValue(app, memSize);
	if (app.flags.CF === false) {
		app.registers.eip._32 = newEIP;
	} else {
		app.registers.eip._32 += 4;
	}
}

export const __nop = CommonCheckers.noParams;
export function nop(app: App, params: Operand[]) {
	app.registers.eip._32 += 4;
}

export const __exit = CommonCheckers.noParams;
export function exit(app: App, params: Operand[]) {
	throw new Error('NOP');
}
