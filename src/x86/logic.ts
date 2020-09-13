import { App } from '../App';
import Operand, { OperandTypes } from '../models/Operand';

export function and(app: App, params: Operand[]) {
	let lhsOp = params[0];
	let rhsOp = params[1];

	if (lhsOp.type === OperandTypes.const) throw new Error('noConst');

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
