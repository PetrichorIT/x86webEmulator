import { App } from '../App';
import Operand, { OperandTypes } from '../models/Operand';

export function _alt(app: App, params: Operand[]) {
	const str = params
		.map((v) => {
			return `Operand:${v.type} ival: ${v.value} rval:${v.getValue(app, v.requiredMemSize || 4)}`;
		})
		.join('\n');
	alert(str);

	app.registers.eip._32 += 4;
}

export function _clearmemory(app: App, params: Operand[]) {
	app.memory = Buffer.alloc(0xffff);
	app.registers.eip._32 += 4;
}

export function _setinstrdelay(app: App, params: Operand[]) {
	let param = params[0];

	if (param.type !== OperandTypes.const) throw new Error('ONlY CONST');

	let val = param.getValue(app, 4);
	if (val <= 0) throw new Error('NOT 0 OR BELOW');

	app.instructionDelay = val;
	app.registers.eip._32 += 4;
}
