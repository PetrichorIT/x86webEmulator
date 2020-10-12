import { App } from '../App';
import Operand from '../models/Operand';

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
