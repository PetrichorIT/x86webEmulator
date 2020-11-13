import Register32 from './models/Register32';
import Operand, { OperandTypes } from './models/Operand';
import IODevice from './io/io'
import { DataConstant, Programm } from './models/Programm';
import { Compiler } from './compiler/Compiler';

export type CompiledCode = (Command | Label)[];

export type Label = { label: string; lineNumber: number };
export type Command = { name: string; params: Operand[]; lineNumber: number; isLibCode?: boolean };
export type CommandFunction = (app: App, params: Operand[]) => void;
export type CommandOperandChecker = (params: Operand[]) => void;

export class App {
	public compiler: Compiler;

	public registers: { [key: string]: Register32 };
	public flags: { [key: string]: boolean };
	public memory: Buffer;

	public instructions: Command[];
	private commandHandlers: { [key: string]: CommandFunction | CommandOperandChecker };
	
	public onInstructionCycle: (() => void);
	public ioDevices: IODevice[]

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

		// Only 16 Bit Address Space is valid
		this.memory = Buffer.alloc(0xffff);

		this.commandHandlers = commandHandlers;
		this.instructions = [ undefined ];
		this.compiler = new Compiler(this);
		this.ioDevices = []
	}

	/** 
	* Emulates a IO write operation to a registered IO Device.
	*/
	public ioWrite(port: number, value: number) {
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
	public ioRead(port: number): number {
		for (const device of this.ioDevices) {
			if (device.ports.includes(port)) {
				return device.onInput(port);
			}
		}
		return 0;
	}


	/**
	 * Write a given programm into the application memory at the given position (default 0x8000)
	 * and prepares the app for execution of said programm.
	 */
	public runProgram(programm: Programm, position?: number) {
		position = position || 0x8000;
		programm.write(this, position);
	}

	/**
	 * Indicates if the next command is libary code.
	 */
	public get isInLibMode(): boolean {
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
	public instructionCycle(): boolean {

		const iLoc = this.memory.readUInt32LE(this.registers.eip._32);

		if (iLoc >= this.instructions.length) return false;
		let instrc = this.instructions[iLoc];
		if (!instrc) return false;

		(this.commandHandlers[instrc.name] as CommandFunction)(this, instrc.params);

		if (this.onInstructionCycle) this.onInstructionCycle();
		return true;
	}
}
