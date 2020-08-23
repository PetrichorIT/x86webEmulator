import { App } from '../App';
import Operand from '../models/Operand';

export function call(app: App, params: Operand[]) {
	let op = params[0];
	if (op.isMemory) throw new Error('noMem');

	let neweip = op.getValue(app, 4);

	app.registers.eip._32 += 4;
	// Push EBP onto stack
	app.registers.esp._32 -= 4;
	app.memory.writeUInt32LE(app.registers.ebp._32, app.registers.esp._32);

	// Push EIP onto stack
	app.registers.esp._32 -= 4;
	app.memory.writeUInt32LE(app.registers.eip._32, app.registers.esp._32);

	app.registers.ebp._32 = app.registers.esp._32;
	app.registers.eip._32 = neweip;
}

export function ret(app: App, params: Operand[]) {
	// Pop eip from stack
	app.registers.eip._32 = app.memory.readUInt32LE(app.registers.esp._32);
	app.registers.esp._32 += 4;

	// Pop EBP from strack
	app.registers.ebp._32 = app.memory.readUInt32LE(app.registers.esp._32);
	app.registers.esp._32 += 4;
}
