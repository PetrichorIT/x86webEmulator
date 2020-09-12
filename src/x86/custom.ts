import { App } from '../App';
import Operand from '../models/Operand';

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
