import { App } from '../App';
import Operand, { OperandTypes } from '../models/Operand';

export function __and(params: Operand[]) {
	if (params.length !== 2) throw new Error('C00X - Invalid operands. Invalid number of operands. Expected 2.');
	let lhsOp = params[0];
	let rhsOp = params[1];
	if (lhsOp.type === OperandTypes.const) throw new Error('C00X - Invalid operands. Left operand must be mutable.');
	if (lhsOp.isMemory && rhsOp.isMemory) throw new Error('C00X - Invalid operands. Only one operand can be memory.');
}

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

export function or(app: App, params: Operand[]) {
	let lhsOp = params[0];
	let rhsOp = params[1];

	if (lhsOp.type === OperandTypes.const) throw new Error('noConst');

	let memSize = lhsOp.requiredMemSize || rhsOp.requiredMemSize;

	let lhs = lhsOp.getValue(app, memSize);
	let rhs = rhsOp.getValue(app, memSize);

	let res = lhs | rhs;

	lhsOp.setValue(app, memSize, res);
	app.registers.eip._32 += 4;
}

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

export function not(app: App, params: Operand[]) {
	let lhsOp = params[0];

	if (lhsOp.type === OperandTypes.const) throw new Error('noConst');

	let memSize = lhsOp.requiredMemSize;

	let lhs = lhsOp.getValue(app, memSize);

	let res = ~lhs;

	lhsOp.setValue(app, memSize, res);
	app.registers.eip._32 += 4;
}

export function shl(app: App, params: Operand[]) {
	let lhsOp = params[0];
	let rhsOp = params[1];

	if (lhsOp.type === OperandTypes.const) throw new Error('noConst');
	if (lhsOp.isMemory) throw new Error('noMEM');
	if (rhsOp.type !== OperandTypes.const) throw new Error('needConst');

	let memSize = lhsOp.requiredMemSize;

	let lhs = lhsOp.getValue(app, memSize);
	let res = lhs << rhsOp.getValue(app, 4);

	lhsOp.setValue(app, memSize, res);
	app.registers.eip._32 += 4;
}

export function shr(app: App, params: Operand[]) {
	let lhsOp = params[0];
	let rhsOp = params[1];

	if (lhsOp.type === OperandTypes.const) throw new Error('noConst');
	if (lhsOp.isMemory) throw new Error('noMEM');
	if (rhsOp.type !== OperandTypes.const) throw new Error('needConst');

	let memSize = lhsOp.requiredMemSize;

	let lhs = lhsOp.getValue(app, memSize);
	let res = lhs >>> rhsOp.getValue(app, 4);

	lhsOp.setValue(app, memSize, res);
	app.registers.eip._32 += 4;
}
