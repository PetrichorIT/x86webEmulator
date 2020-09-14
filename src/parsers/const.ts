import * as x86 from '../x86';

export const syn_keywords = Object.getOwnPropertyNames(x86);
export const syn_registers = /^(eax|ax|ah|al|ebx|bx|bh|bl|ecx|cx|ch|cl|edx|dx|dh|dl|esp|ebp|edi|esi|eip)/i;
export const syn_label = /[A-z][A-z0-9_]*:/;
export const syn_include = /#include/;
export const syn_string = /"[^"]*"/;
export const syn_number = /(0x[0-9a-fA-F]+|0b[01]+|[\d]+)/;

export class CompilerError extends Error {
	line: number;
	position: { from: number; to?: number };

	constructor(message: string, line?: number, position?: { from: number; to?: number }) {
		super(message);

		this.line = line;
		this.position = position;
	}
}
