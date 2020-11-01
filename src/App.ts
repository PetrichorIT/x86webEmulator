import Register32 from './models/Register32';
import Operand, { OperandTypes } from './models/Operand';
import Parser from './parsers/parser';
import IODevice from './io/io'

export type Label = { label: string; lineNumber: number };
export type Command = { name: string; params: Operand[]; lineNumber: number; isLibCode?: boolean };
export type CommandFunction = (app: App, params: Operand[]) => void;
export type CommandOperandChecker = (params: Operand[]) => void;

export class App {
	parser: Parser;

	registers: { [key: string]: Register32 };
	flags: { [key: string]: boolean };
	memory: Buffer;

	instructions: Command[];
	commandHandlers: { [key: string]: CommandFunction | CommandOperandChecker };
	subscriber: (() => void)[];

	instructionDelay: number;
	ioDevices: IODevice[]

	/**
	 * Creates an application process, capable of executing all commands given in the commandHandlers.
	 */
	constructor(commandHandlers: { [key: string]: CommandFunction | CommandOperandChecker }) {
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

		// Only 16 Bit Address Space is valid
		this.memory = Buffer.alloc(0xffff);

		this.commandHandlers = commandHandlers;
		this.instructions = [ undefined ];
		this.subscriber = [];
		this.instructionDelay = 100;
		this.parser = new Parser(this);
		this.ioDevices = []
	}

	/** 
	* Emulates a IO write operation to a registered IO Device.
	*/
	ioWrite(port: number, value: number) {
		for (const device of this.ioDevices) {
			if (device.ports.includes(port)) {
				device.onOutput(port, value)
				return
			}
		}
	}

	/**
	 * Emulates a IO read operation from a registered IO Device.
	 */
	ioRead(port: number): number {
		for (const device of this.ioDevices) {
			if (device.ports.includes(port)) {
				return device.onInput(port);
			}
		}
		return 0;
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
	 * Write a given set of instructions into the application memory at the given position.
	 */
	writeProgram(commands: (Command | Label)[], position: number) {
		let pos = position;
		let labels: { [key: string]: number } = {};
		let relPos = 0;

		// Extract labels from source (matching relative positions)
		for (let i = 0; i < commands.length; i++) {
			if ((commands[i] as Label).label) {
				labels[(commands[i] as Label).label] = pos + relPos;
			} else {
				relPos += 4;
			}
		}

		// Replace label operand with direct jumps
		commands = commands.filter((v: any) => v.label === undefined).map((c: Command) => {
			for (let i = 0; i < c.params.length; i++) {
				if (c.params[i].type === OperandTypes.label) {
					c.params[i] = new Operand(OperandTypes.const, labels[c.params[i].value]);
				}
			}
			return c;
		});

		// Write commands to memory
		let idx = this.instructions.length;
		for (const command of commands) {
			this.instructions.push(command as Command);
			this.memory.writeUInt32LE(idx++, pos);
			pos += 4;
		}
	}

	/**
	 * Writes the given bytes starting at the address assending.
	 */
	writeMemoryBytes(adresse: number, bytes: number[]) {
		for (const byte of bytes) {
			this.memory.writeUInt8(byte, adresse++);
		}
	}

	/**
	 * Indicates if the next command is libary code.
	 */
	get isInLibMode(): boolean {
		const iLoc = this.memory.readUInt32LE(this.registers.eip._32);
		if (iLoc >= this.instructions.length) return false;
		let instrc = this.instructions[iLoc];
		if (!instrc) return false;
		return instrc.isLibCode === true;
	}

	/**
	 * Executes an instruction based on the current EIP.
	 * Returns a flag that shows if an instruction was available (and thus executed).
	 */
	instructionCycle(): boolean {
		const iLoc = this.memory.readUInt32LE(this.registers.eip._32);

		if (iLoc >= this.instructions.length) return false;
		let instrc = this.instructions[iLoc];
		if (!instrc) return false;

		(this.commandHandlers[instrc.name] as CommandFunction)(this, instrc.params);

		if (!this.isInLibMode) this.subscriber.forEach((s) => s());
		return true;
	}
}
