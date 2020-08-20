import Register32 from './models/Register32';
import Operand, { OperandTypes } from './models/Operand';

type CommandFunction = (app: App, params: Operand[]) => void;

export class App {
	registers: { [key: string]: Register32 };
	flags: { [key: string]: boolean };
	memory: Buffer;
	commandHandlers: { [key: string]: CommandFunction };

	constructor() {
		this.registers = {
			eax: new Register32(0),
			ebx: new Register32(0),
			ecx: new Register32(0),
			edx: new Register32(0),

			esi: new Register32(0),
			edi: new Register32(0),

			esp: new Register32(0),
			ebp: new Register32(0)
		};

		this.flags = {
			CF: false,
			PF: false,
			AF: false,
			ZF: false,
			SF: false,
			OF: false
		};

		// 16 bit memory
		this.memory = Buffer.alloc(0xffff);
	}

	writeMemoryBytes(adresse: number, bytes: number[]) {
		for (const byte of bytes) {
			this.memory.writeUInt8(byte, adresse++);
		}
	}
}
