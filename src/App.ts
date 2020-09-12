import Register32 from './models/Register32';
import Operand, { OperandTypes } from './models/Operand';
import Parser from './parsers/parser';

export type Label = { label: string; lineNumber: number };
export type Command = { name: string; params: Operand[]; lineNumber: number };
export type CommandFunction = (app: App, params: Operand[]) => void;

export class App {
	parser: Parser;

	registers: { [key: string]: Register32 };
	flags: { [key: string]: boolean };
	memory: Buffer;

	instructions: Command[];
	commandHandlers: { [key: string]: CommandFunction };

	subscriber: (() => void)[];

	constructor(commandHandlers: { [key: string]: CommandFunction }) {
		this.registers = {
			eax: new Register32(0),
			ebx: new Register32(0),
			ecx: new Register32(0),
			edx: new Register32(0),

			esi: new Register32(0),
			edi: new Register32(0),

			esp: new Register32(0x8000),
			ebp: new Register32(0x8000),

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
		this.instructions = [ undefined ];
		this.subscriber = [];
		this.parser = new Parser(this);
	}

	parse(code: string): (Command | Label)[] {
		return this.parser.parse(code);
	}

	/**
	 * Adds a new RX like subscriber to the update cycle initialted by change in the app state
	 */
	subscribe(newSubscriber: () => void) {
		this.subscriber.push(newSubscriber);
	}

	/**
	 * Write a given set of instructions into the application memory at the given position (default 0x8000)
	 * and prepares the app for execution of said programm
	 */
	runProgram(commands: (Command | Label)[], position?: number) {
		position = position || 0x8000;
		this.writeProgram(commands, position);
		this.registers.eip._32 = position;

		this.subscriber.forEach((s) => s());
	}

	/**
	 * Write a given set of instructions into the application memory at the given position
	 */
	writeProgram(commands: (Command | Label)[], position: number) {
		let pos = position;
		let labels: { [key: string]: number } = {};
		let relPos = 0;

		for (let i = 0; i < commands.length; i++) {
			if ((commands[i] as Label).label) {
				labels[(commands[i] as Label).label] = pos + relPos;
			} else {
				relPos += 4;
			}
		}

		commands = commands.filter((v: any) => v.label === undefined).map((c: Command) => {
			for (let i = 0; i < c.params.length; i++) {
				if (c.params[i].type === OperandTypes.label) {
					c.params[i] = new Operand(OperandTypes.const, labels[c.params[i].value]);
				}
			}
			return c;
		});

		let idx = this.instructions.length;

		for (const command of commands) {
			this.instructions.push(command as Command);
			this.memory.writeUInt32LE(idx++, pos);
			pos += 4;
		}
	}

	/**
	 * Writes the given bytes starting at the address assending 
	 */
	writeMemoryBytes(adresse: number, bytes: number[]) {
		for (const byte of bytes) {
			this.memory.writeUInt8(byte, adresse++);
		}
	}

	/**
	 * Loads a code snippet as Lib.
	 * This lib can than be used by using the #include statement.
	 * @param name The name used to include the library (also prefix for internal labels)
	 * @param code The code that should be implemented
	 * @param entryPoints The internal labels that should NOT be prefixed
	 */
	loadLib(name: string, code: string, entryPoints?: string[]) {
		entryPoints = entryPoints || [ name ];
		this.parser.parseLib(name, code, entryPoints);
	}

	/**
	 * Executes an instruction based on the current EIP.
	 * Returns a flag that shows if an instruction was available (and thus executed)
	 */
	instructionCycle(): boolean {
		const iLoc = this.memory.readUInt32LE(this.registers.eip._32);

		if (iLoc >= this.instructions.length) return false;
		let instrc = this.instructions[iLoc];
		if (!instrc) return false;

		this.commandHandlers[instrc.name](this, instrc.params);

		this.subscriber.forEach((s) => s());
		return true;
	}
}
