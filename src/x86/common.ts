import Operand, { OperandTypes } from '../models/Operand';

export function operandMemSize(operands: Operand[]) {
	let memSize: number | undefined = undefined;
	for (const op of operands) {
		if (op.requiredMemSize !== undefined) {
			if (memSize !== undefined) {
				if (memSize > op.requiredMemSize) memSize = op.requiredMemSize;
			} else {
				memSize = op.requiredMemSize;
			}
		}
	}
	return memSize;
}

export const CommonCheckers = {
	// Generic Checkers (multi opernad)
	expectCount: (params: Operand[], count: number) => {
		if (params.length !== count)
			throw new Error('C00X - Invalid operands. Invalid number of operands. Expected ' + count + '.');
	},

	expectNoMem2Mem: (params: Operand[]) => {
		let c = 0;
		for (const op of params) {
			if (op.isMemory) c++;
		}
		if (c > 1) throw new Error('C00X - Invalid operand. Only one operand can be memory.');
	},
	// Generic Checker (one operand)
	expectLabelLike: (param: Operand) => {
		if (param.type !== OperandTypes.label && param.type !== OperandTypes.const)
			throw new Error('C00X - Invalid operands. Expected label or const.');
	},
	expectConst: (param: Operand) => {
		if (param.type !== OperandTypes.const) throw new Error('C00X - Invalid operands. Operand must be const.');
	},
	expectMutable: (param: Operand) => {
		if (param.type === OperandTypes.const) throw new Error('C00X - Invalid operands. Operand must be mutable.');
	},
	expectNoMem: (param: Operand) => {
		if (param.isMemory) throw new Error('C00X - Invalid Operands. Operand cannot be memory');
	},
	expectMemSize: (param: Operand, memSize: number) => {
		if (param.requiredMemSize) {
			if (param.requiredMemSize !== memSize)
				throw new Error('C00X - Invalid operands. Invalid MemSize. Expected 4bytes or undefined.');
		}
	},
	// Other often use combis
	jumpLike,
	dualMutFirst,
	noParams
};

function dualMutFirst(params: Operand[]) {
	CommonCheckers.expectCount(params, 2);
	CommonCheckers.expectNoMem2Mem(params);
	CommonCheckers.expectMutable(params[0]);
}

function jumpLike(params: Operand[]) {
	CommonCheckers.expectCount(params, 1);
	CommonCheckers.expectLabelLike(params[0]);
}

function noParams(params: Operand[]) {
	CommonCheckers.expectCount(params, 0);
}
