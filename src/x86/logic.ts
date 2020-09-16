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

export const _or = CommonCheckers.dualMutFirst;
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

	let lhs = lhsOp.getValue(app, memSize);
	let res = lhs << rhsOp.getValue(app, 4);

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

	let lhs = lhsOp.getValue(app, memSize);
	let res = lhs >>> rhsOp.getValue(app, 4);

	lhsOp.setValue(app, memSize, res);
	app.registers.eip._32 += 4;
}
