import { App } from '../App';
import Operand, { OperandTypes } from '../models/Operand';

function bitMask(memSize: number): number {
	switch (memSize) {
		case 1:
			return 0xff;
		case 2:
			return 0xffff;
		case 4:
			return 0xffffffff;
	}
}

export function add(app: App, params: Operand[]) {
	let dest = params[0];
	let src = params[1];

	if (dest.isMemory && src.isMemory) throw new Error('Mem2Mem');

	let memSize = dest.requiredMemSize || src.requiredMemSize;

	let lhs = src.getValueInt(app, memSize);
	let rhs = dest.getValueInt(app, memSize);

	let res = lhs & +rhs;
	let resT = (lhs + rhs) & bitMask(memSize);

	app.flags.ZF = resT === 0;
	app.flags.CF = resT !== res;

	const resTNeg = resT < 0;

	app.flags.SF = resTNeg;
	// app.flags.OF = ()
	dest.setValue(app, memSize, resT);
}

export function adc(app: App, params: Operand[]) {
	let dest = params[0];
	let src = params[1];

	if (dest.isMemory && src.isMemory) throw new Error('Mem2Mem');

	let memSize = dest.requiredMemSize || src.requiredMemSize;

	let lhs = src.getValueInt(app, memSize);
	let rhs = dest.getValueInt(app, memSize);

	let res = lhs & +rhs & +(app.flags.CF ? 1 : 0);
	let resT = (lhs + rhs) & bitMask(memSize);

	app.flags.ZF = resT === 0;
	app.flags.CF = resT !== res;

	app.flags.SF = resT < 0;
	// app.flags.OF = ()
	dest.setValue(app, memSize, resT);
}
