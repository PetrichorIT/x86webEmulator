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
			throw new Error('Invalid number of operands. Expected ' + count + '.');
	},

	expectNoMem2Mem: (params: Operand[]) => {
		let c = 0;
		for (const op of params) {
			if (op.isMemory) c++;
		}
		if (c > 1) throw new Error('Invalid operand. Only one operand can be memory.');
	},
	// Generic Checker (one operand)
	expectLabelLike: (param: Operand) => {
		if (param.type !== OperandTypes.label && param.type !== OperandTypes.const)
			throw new Error('Expected label or const.');
	},
	expectConst: (param: Operand) => {
		if (param.type !== OperandTypes.const) throw new Error('Operand must be const.');
	},
	expectMutable: (param: Operand) => {
		if (param.type === OperandTypes.const) throw new Error('Operand must be mutable.');
	},
	expectNoMem: (param: Operand) => {
		if (param.isMemory) throw new Error('Operand cannot be memory');
	},
	expectMemSize: (param: Operand, memSize: number) => {
		if (param.requiredMemSize) {
			if (param.requiredMemSize !== memSize)
				throw new Error('Invalid memory size. Expected 4 bytes or undefined.');
		}
	},
	expectAL: (param: Operand) => {
		if (param.type !== OperandTypes.register) throw new Error("Expected register AL");
		if (param.value !== "al") throw new Error("Expected register AL");
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
