import { App } from '../App';
import Operand from '../models/Operand';
import { CommonCheckers } from './common';

export const __stc = CommonCheckers.noParams;
export function stc(app: App, params: Operand[]) {
	app.flags.CF = true;
	app.registers.eip._32 += 4;
}

export const __clc = CommonCheckers.noParams;
export function clc(app: App, params: Operand[]) {
	app.flags.CF = false;
	app.registers.eip._32 += 4;
}

export const __cmc = CommonCheckers.noParams;
export function cmc(app: App, params: Operand[]) {
	app.flags.CF = !app.flags.CF;
	app.registers.eip._32 += 4;
}
