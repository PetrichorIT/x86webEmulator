import { App } from '../App';
import Operand from '../models/Operand';

export function stc(app: App, params: Operand[]) {
	app.flags.CF = true;
	app.registers.eip._32 += 4;
}

export function clc(app: App, params: Operand[]) {
	app.flags.CF = false;
	app.registers.eip._32 += 4;
}

export function cmc(app: App, params: Operand[]) {
	app.flags.CF = !app.flags.CF;
	app.registers.eip._32 += 4;
}
