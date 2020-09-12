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

	const resTNeg = resT < 0;

	app.flags.ZF = resT === 0;
	app.flags.CF = resT !== res;
	app.flags.SF = resTNeg;
	app.flags.OF = false;

	dest.setValue(app, memSize, resT);
	app.registers.eip._32 += 4;
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
	app.registers.eip._32 += 4;
}

export function sub(app: App, params: Operand[]) {
	let lhsOp = params[0];
	let rhsOp = params[1];

	if (lhsOp.isMemory && rhsOp.isMemory) throw new Error('Mem2Mem');

	let memSize = lhsOp.requiredMemSize || rhsOp.requiredMemSize;

	let lhs = lhsOp.getValueInt(app, memSize);
	let rhs = rhsOp.getValueInt(app, memSize);

	let res = lhs - rhs;
	let resT = (lhs - rhs) & bitMask(memSize);

	app.flags.ZF = resT === 0;
	app.flags.CF = resT !== res;

	const resTNeg = resT < 0;

	app.flags.SF = resTNeg;
	// app.flags.OF = ()
	lhsOp.setValue(app, memSize, resT);
	app.registers.eip._32 += 4;
}

export function sbb(app: App, params: Operand[]) {
	let lhsOp = params[0];
	let rhsOp = params[1];

	if (lhsOp.isMemory && rhsOp.isMemory) throw new Error('Mem2Mem');

	let memSize = lhsOp.requiredMemSize || rhsOp.requiredMemSize;

	let lhs = rhsOp.getValueInt(app, memSize);
	let rhs = lhsOp.getValueInt(app, memSize);

	let res = lhs - rhs - (app.flags.CF ? 1 : 0);
	let resT = (lhs - rhs) & bitMask(memSize);

	app.flags.ZF = resT === 0;
	app.flags.CF = resT !== res;

	app.flags.SF = resT < 0;
	// app.flags.OF = ()
	lhsOp.setValue(app, memSize, resT);
	app.registers.eip._32 += 4;
}

export function inc(app: App, params: Operand[]) {
	let para = params[0];
	if (para.type === OperandTypes.const) throw new Error('NOCONST');

	let memSize = para.requiredMemSize || 4;

	let lhs = para.getValueInt(app, memSize);
	let rhs = 1;

	let resT = (lhs + rhs) & bitMask(memSize);
	app.flags.ZF = resT === 0;
	const resTNeg = resT < 0;
	app.flags.SF = resTNeg;

	para.setValue(app, memSize, resT);
	app.registers.eip._32 += 4;
}

export function dec(app: App, params: Operand[]) {
	let para = params[0];
	if (para.type === OperandTypes.const) throw new Error('NOCONST');

	let memSize = para.requiredMemSize || 4;

	let lhs = para.getValueInt(app, memSize);
	let rhs = 1;

	let resT = (lhs - rhs) & bitMask(memSize);
	app.flags.ZF = resT === 0;
	const resTNeg = resT < 0;
	app.flags.SF = resTNeg;

	para.setValue(app, memSize, resT);
	app.registers.eip._32 += 4;
}

export function cmp(app: App, params: Operand[]) {
	let lhsOp = params[0];
	let rhsOp = params[1];

	if (lhsOp.isMemory && rhsOp.isMemory) throw new Error('Mem2Mem');

	let memSize = lhsOp.requiredMemSize || rhsOp.requiredMemSize;

	let lhs = rhsOp.getValueInt(app, memSize);
	let rhs = lhsOp.getValueInt(app, memSize);

	let res = lhs - rhs;
	let resT = (lhs - rhs) & bitMask(memSize);

	app.flags.ZF = resT === 0;
	app.flags.CF = resT !== res;

	const resTNeg = resT < 0;

	app.flags.SF = resTNeg;
	app.registers.eip._32 += 4;
}

export function mul(app: App, params: Operand[]) {
	let reg32 = params[0];
	if (reg32.type !== OperandTypes.register || reg32.requiredMemSize !== 4) throw new Error('reg32!');

	let lhs = reg32.getValueInt(app, 4);
	let rhs = app.registers.eax._32;

	let res = lhs * rhs;

	app.registers.eax._32 = res;
	app.registers.eip._32 += 4;
}

export function div(app: App, params: Operand[]) {
	let reg32 = params[0];
	if (reg32.type !== OperandTypes.register || reg32.requiredMemSize !== 4) throw new Error('reg32!');

	let lhs = reg32.getValueInt(app, 4);
	let rhs = app.registers.eax._32;

	let res = lhs / rhs;

	app.registers.eax._32 = res;
	app.registers.eip._32 += 4;
}
