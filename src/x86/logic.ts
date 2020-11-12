import { App } from '../App';
import Operand, { OperandTypes } from '../models/Operand';
import { CommonCheckers } from './common';

export const __and = CommonCheckers.dualMutFirst;
export function and(app: App, params: Operand[]) {
	let lhsOp = params[0];
	let rhsOp = params[1];

	let memSize = lhsOp.requiredMemSize || rhsOp.requiredMemSize;

	let lhs = lhsOp.getValue(app, memSize);
	let rhs = rhsOp.getValue(app, memSize);

	let res = lhs & rhs;

	lhsOp.setValue(app, memSize, res);
	app.registers.eip._32 += 4;
}

export const __or = CommonCheckers.dualMutFirst;
export function or(app: App, params: Operand[]) {
	let lhsOp = params[0];
	let rhsOp = params[1];

	let memSize = lhsOp.requiredMemSize || rhsOp.requiredMemSize;

	let lhs = lhsOp.getValue(app, memSize);
	let rhs = rhsOp.getValue(app, memSize);

	let res = lhs | rhs;

	lhsOp.setValue(app, memSize, res);
	app.registers.eip._32 += 4;
}

export const __xor = CommonCheckers.dualMutFirst;
export function xor(app: App, params: Operand[]) {
	let lhsOp = params[0];
	let rhsOp = params[1];

	if (lhsOp.type === OperandTypes.const) throw new Error('noConst');

	let memSize = lhsOp.requiredMemSize || rhsOp.requiredMemSize;

	let lhs = lhsOp.getValue(app, memSize);
	let rhs = rhsOp.getValue(app, memSize);

	let res = lhs ^ rhs;

	lhsOp.setValue(app, memSize, res);
	app.registers.eip._32 += 4;
}

export function __not(params: Operand[]) {
	CommonCheckers.expectCount(params, 1);
	CommonCheckers.expectMutable(params[0]);
}
export function not(app: App, params: Operand[]) {
	let lhsOp = params[0];

	if (lhsOp.type === OperandTypes.const) throw new Error('noConst');

	let memSize = lhsOp.requiredMemSize;

	let lhs = lhsOp.getValue(app, memSize);

	let res = ~lhs;

	lhsOp.setValue(app, memSize, res);
	app.registers.eip._32 += 4;
}

export function __shl(params: Operand[]) {
	CommonCheckers.expectCount(params, 2);

	CommonCheckers.expectMutable(params[0]);
	CommonCheckers.expectNoMem(params[0]);

	CommonCheckers.expectConst(params[1]);
}
export function shl(app: App, params: Operand[]) {
	let lhsOp = params[0];
	let rhsOp = params[1];

	let memSize = lhsOp.requiredMemSize;
	const offset = rhsOp.getValue(app, 4);

	let lhs = lhsOp.getValue(app, memSize);
	let res = lhs << offset;

	app.flags.CF = (lhs & (0b1 >>> (memSize*8 - offset))) !== 0
	app.flags.ZF = res === 0;

	lhsOp.setValue(app, memSize, res);
	app.registers.eip._32 += 4;
}

export function __shr(params: Operand[]) {
	CommonCheckers.expectCount(params, 2);

	CommonCheckers.expectMutable(params[0]);
	CommonCheckers.expectNoMem(params[0]);

	CommonCheckers.expectConst(params[1]);
}
export function shr(app: App, params: Operand[]) {
	let lhsOp = params[0];
	let rhsOp = params[1];

	let memSize = lhsOp.requiredMemSize;

	const offset = rhsOp.getValue(app, 4)
	let lhs = lhsOp.getValue(app, memSize);
	let res = lhs >>> offset;

	app.flags.CF = (lhs & (0b1 << (offset - 1))) !== 0
	app.flags.ZF = res === 0;

	lhsOp.setValue(app, memSize, res);
	app.registers.eip._32 += 4;
}


export function __bt(params: Operand[]) {
	CommonCheckers.expectCount(params, 2)
}

export function bt(app: App, params: Operand[]) {
	let reg = params[0];
	let bit = params[1].getValue(app, params[1].requiredMemSize);

	if (bit < 0 || bit > ((reg.requiredMemSize || 1) * 8)) throw new Error("BT idx invalid");

	let pattern = reg.getValue(app, reg.requiredMemSize) >>> bit;

	console.info(pattern.toString(2), bit)

	app.flags.CF = (pattern & 0x1) === 1 ? true : false
	app.registers.eip._32 += 4;
}