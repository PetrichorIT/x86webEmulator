import { App } from '../App';
import Operand, { OperandTypes } from '../models/Operand';
import { CommonCheckers } from './common';

export const __alert = (params: Operand[]) => {};
export function alert(app: App, params: Operand[]) {
	const str = params
		.map((v) => {
			return `Operand:${v.type} ival: ${v.value} rval:${v.getValue(app, v.requiredMemSize || 4)}`;
		})
		.join('\n');
	window.alert(str);

	app.registers.eip._32 += 4;
}

export function __setcorespeed(params: Operand[]) {
	if (params.length === 0) return;
	CommonCheckers.expectCount(params, 1);
	CommonCheckers.expectConst(params[0]);
	if ((params[0].value as number) <= 0) throw new Error('C00X - Invalid operands. Const must be greater than zero');
}
export function setcorespeed(app: App, params: Operand[]) {
	let val = params.length === 1 ? params[0].getValue(app, 4) : app.defaultInstructionDelay;
	app.instructionDelay = val;
	app.registers.eip._32 += 4;
}
