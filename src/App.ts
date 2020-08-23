import Register32 from './models/Register32';
import Operand, { OperandTypes } from './models/Operand';

type Command = { name: string; params: Operand[] };
type CommandFunction = (app: App, params: Operand[]) => void;

export class App {
	registers: { [key: string]: Register32 };
	flags: { [key: string]: boolean };
	memory: Buffer;

	instructions: Command[];
	commandHandlers: { [key: string]: CommandFunction };

	constructor(commandHandlers: { [key: string]: CommandFunction }) {
		this.registers = {
			eax: new Register32(0),
			ebx: new Register32(0),
			ecx: new Register32(0),
			edx: new Register32(0),

			esi: new Register32(0),
			edi: new Register32(0),

			esp: new Register32(0),
			ebp: new Register32(0),

			eip: new Register32(0)
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

		this.commandHandlers = commandHandlers;
		this.instructions = [];
	}

	runProgram(commands: Command[], position?: number) {
		position = position || 0x7fff;
		this.writeProgram(commands, position);
		this.registers.eip._32 = position;
	}

	writeProgram(commands: Command[], position: number) {
		// TODO: Resolve Labels
		let pos = position;
		let idx = this.instructions.length;
		for (const command of commands) {
			this.instructions.push(command);
			this.memory.writeUInt32LE(idx++, pos);
			pos += 4;
		}
	}

	writeMemoryBytes(adresse: number, bytes: number[]) {
		for (const byte of bytes) {
			this.memory.writeUInt8(byte, adresse++);
		}
	}

	instructionCycle() {
		const iLoc = this.memory.readUInt32LE(this.registers.eip._32);

		if (iLoc >= this.instructions.length) throw new Error('NOP');
		let instrc = this.instructions[iLoc];

		this.commandHandlers[instrc.name](this, instrc.params);
	}
}
