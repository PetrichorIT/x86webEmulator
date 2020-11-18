import * as x86 from '../x86';

export const syn_keywords = Object.getOwnPropertyNames(x86).filter((s) => !s.startsWith('__')).concat([ "offset"]);
export const syn_registers = /^(eax|ax|ah|al|ebx|bx|bh|bl|ecx|cx|ch|cl|edx|dx|dh|dl|esp|ebp|edi|esi|eip)/i;
export const syn_label_def = /[A-z][A-z0-9_]*:/;
export const syn_label = /[A-z][A-z0-9_-]*/;
export const syn_string = /"[^"]*"/;
export const syn_number = /(0x[0-9a-fA-F]+|0b[01]+|[\d]+)/;
export const syn_datasize = /^(dd|db|dw)/i;

export enum SourceMode {
    global = 1, text = 2, data = 3
}

export enum CompilerErrorCode {

	// Instrutions
	invalidInstuction = "C001 - Invalid instruction name ",
	invalidTokenDirectMemory = "C002 - Invalid token for direct memory access. Expected [<number>]",
	invalidTokenNumber = "C003 - Invalid token. Expected <number>. Got ",
	invalidTokenRegister = "C004 - Invalid token. Expected <register>. Got ",

	unexpectedToken = "C005 - Unexpected token ",

	missingToken = "C009 - Missing token ",

	// Libary
	missingLibaryIdentifier = "C010 - Missing valid libary identifier after #include statement",
	unkownLibaryIdentifier = "C011 - Unkown libary identifier ",

	// Labels
	illegalLabelRedefintion = "C020 - Illegal redefintion label ",
	undefinedLabel = "C021 - Missing defintion for label ",
	illegalLabel = "C022 - Illegal label ",

	// Constants
	illegalConstantRedefintion = "C030 - Illegal redefintion for constant ",
	undefinedConstant = "C031 - Missing defintion for constant ",
	illegalNamingScheme = "C032 - Invalid naming scheme. Expected [A-z][A-z0-9_-]*. Got ",
	illegalSizeScheme = "C033 - Invalid size scheme. Expected DD DB DW. Got ",
	illegalStringSizeScheme = "C034 - Invalid size scheme. Expected DB(1byte) at String. Got size ",

	// Operand checkers,
	illegalOperands = "C040 - Invalid operands. ",

	invalidGlobalSymbol = "C090 - Invalid global symbol",
	missingGlobalOptionsDefintion = "C091 - Missing value of options defintion "
}

/**
 * Error type "Compiler Error"
 * - requires line number of error
 * - requires start char of error
 * - assumes end char to be line end if non is given
 */
export class CompilerError extends Error {
	code: CompilerErrorCode;
	line: number;
	position: { from: number; to?: number };

	constructor(code: CompilerErrorCode, description: string, line?: number, position?: { from: number; to?: number }) {
		super((code + (description || "")).replace("<", "&lt;").replace(">", "&gt;"));

		this.code = code;
		this.line = line;
		this.position = position;

		Object.setPrototypeOf(this, CompilerError.prototype);
    }
}
