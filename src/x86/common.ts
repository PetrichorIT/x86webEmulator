import Operand from '../models/Operand';

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
