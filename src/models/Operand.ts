import { App } from '../App';

export enum OperandTypes {
	const,
	register,
	mDirect,
	mIndirect,
	mIndexed,
	mDIndexed,
	label,
	string
}

export class Operand {
	type: OperandTypes;
	value: any;

	constructor(type: OperandTypes, value: any) {
		this.type = type;
		this.value = value;
	}

	/**
	 * Returns if the operand points to memory
	 */
	get isMemory() {
		return !(
			this.type === OperandTypes.register ||
			this.type === OperandTypes.const ||
			this.type === OperandTypes.string
		);
	}

	/**
	 * Returns the required memory size (if exisiting)
	 */
	get requiredMemSize() {
		if (this.type === OperandTypes.register) {
			if (this.value[0].toLowerCase() === 'e') return 4;
			if (this.value[1].toLowerCase() === 'x') return 2;
			if (this.value[1].toLowerCase() === 'h') return 1;
			if (this.value[1].toLowerCase() === 'l') return 1;
			throw new Error('Unidenified register');
		}
		return undefined;
	}

	/**
	 * Returns the address of the memory block, referenced by the operand
	 */
	getCompiledSelf(app: App): number {
		if (!this.isMemory) throw new Error('ONLYMEM');

		if (this.type === OperandTypes.mDirect) {
			return this.value;
		}

		if (this.type === OperandTypes.mIndirect) {
			return app.registers[this.value]._32;
		}

		if (this.type === OperandTypes.mIndexed) {
			return app.registers[this.value[0]]._32 + this.value[1];
		}

		if (this.type === OperandTypes.mDIndexed) {
			return app.registers[this.value[0]]._32 + app.registers[this.value[1]]._32;
		}
	}

	/**
	 * Extracts the real value as UInt from the operand, based on the (given?) memory size
	 * and the given application. 
	 */
	getValue(app: App, memSize: number | undefined): number {
		if (this.type === OperandTypes.const) return this.value;
		if (this.type === OperandTypes.register) {
			if (this.value[0].toLowerCase() === 'e') return app.registers[this.value]._32;
			if (this.value[1].toLowerCase() === 'x') return app.registers['e' + this.value]._16;
			if (this.value[1].toLowerCase() === 'h') return app.registers['e' + this.value[0] + 'x']._8H;
			if (this.value[1].toLowerCase() === 'l') return app.registers['e' + this.value[0] + 'x']._8L;
			throw new Error('Unidenified register');
		}

		if (this.type === OperandTypes.mDirect) {
			return this.getMemUInt(app, this.value, memSize);
		}

		if (this.type === OperandTypes.mIndirect) {
			return this.getMemUInt(app, app.registers[this.value]._32, memSize);
		}

		if (this.type === OperandTypes.mIndexed) {
			return this.getMemUInt(app, app.registers[this.value[0]]._32 + this.value[1], memSize);
		}

		if (this.type === OperandTypes.mDIndexed) {
			return this.getMemUInt(app, app.registers[this.value[0]]._32 + app.registers[this.value[1]]._32, memSize);
		}

		if (this.type === OperandTypes.string) {
			return this.value;
		}

		throw new Error('NEEDED' + this.type);
	}

	private getMemUInt(app: App, position: number, memSize: number): number {
		switch (memSize) {
			case 1:
				return app.memory.readUInt8(position);
			case 2:
				return app.memory.readUInt16LE(position);
			case 4:
				return app.memory.readUInt32LE(position);
			default:
				throw new Error('Invalid memsize Size');
		}
	}

	/**
	 * Extracts the real value as Int from the operand, based on the (given?) memory size
	 * and the given application. 
	 */
	getValueInt(app: App, memSize: number | undefined): number {
		if (this.type === OperandTypes.const) return this.value;
		if (this.type === OperandTypes.register) {
			if (this.value[0].toLowerCase() === 'e') return app.registers[this.value]._32;
			if (this.value[1].toLowerCase() === 'x') return app.registers['e' + this.value]._16;
			if (this.value[1].toLowerCase() === 'h') return app.registers['e' + this.value[0] + 'x']._8H;
			if (this.value[1].toLowerCase() === 'l') return app.registers['e' + this.value[0] + 'x']._8L;
			throw new Error('Unidenified register');
		}

		if (this.type === OperandTypes.mDirect) {
			return this.getMemInt(app, this.value, memSize);
		}

		if (this.type === OperandTypes.mIndirect) {
			return this.getMemInt(app, app.registers[this.value]._32, memSize);
		}

		if (this.type === OperandTypes.mIndexed) {
			return this.getMemInt(app, app.registers[this.value[0]]._32 + this.value[1], memSize);
		}

		if (this.type === OperandTypes.mDIndexed) {
			return this.getMemInt(app, app.registers[this.value[0]]._32 + app.registers[this.value[1]]._32, memSize);
		}

		if (this.type === OperandTypes.string) {
			return this.value;
		}

		throw new Error('NEEDED' + this.type);
	}

	private getMemInt(app: App, position: number, memSize: number): number {
		switch (memSize) {
			case 1:
				return app.memory.readInt8(position);
			case 2:
				return app.memory.readInt16LE(position);
			case 4:
				return app.memory.readInt32LE(position);
			default:
				throw new Error('Invalid memsize Size');
		}
	}

	/**
	 * Set the given newValue to the position referenced in this operand, based on the memory size,
	 * by using the given application object.
	 */
	setValue(app: App, memSize: number | undefined, newValue: number): void {
		if (this.requiredMemSize && memSize && this.requiredMemSize !== memSize) throw new Error('B');

		if (this.type === OperandTypes.const) throw new Error('CONST Cant be set');
		if (this.type === OperandTypes.register) {
			if (this.value[0].toLowerCase() === 'e') {
				app.registers[this.value]._32 = newValue;
				return;
			}
			if (this.value[1].toLowerCase() === 'x') {
				app.registers['e' + this.value]._16 = newValue;
				return;
			}
			if (this.value[1].toLowerCase() === 'h') {
				app.registers['e' + this.value[0] + 'x']._8H = newValue;
				return;
			}
			if (this.value[1].toLowerCase() === 'l') {
				app.registers['e' + this.value[0] + 'x']._8L = newValue;
				return;
			}
			throw new Error('Unidenified register');
		}

		if (this.type === OperandTypes.mDirect) {
			return this.setMemUInt(app, this.value, memSize, newValue);
		}

		if (this.type === OperandTypes.mIndirect) {
			return this.setMemUInt(app, app.registers[this.value]._32, memSize, newValue);
		}

		if (this.type === OperandTypes.mIndexed) {
			return this.setMemUInt(app, app.registers[this.value[0]]._32 + this.value[1], memSize, newValue);
		}

		if (this.type === OperandTypes.mDIndexed) {
			return this.setMemUInt(
				app,
				app.registers[this.value[0]]._32 + app.registers[this.value[1]]._32,
				memSize,
				newValue
			);
		}

		if (this.type === OperandTypes.string) {
			throw new Error('NOSTRING');
		}

		throw new Error('NEEDED');
	}
	private setMemUInt(app: App, position: number, memSize: number, value: number): void {
		switch (memSize) {
			case 1:
				app.memory.writeUInt8(value, position);
				break;
			case 2:
				app.memory.writeUInt16LE(value, position);
				break;
			case 4:
				app.memory.writeUInt32LE(value, position);
				break;
			default:
				throw new Error('Invalid memsize Size');
		}
	}
}

export default Operand;
