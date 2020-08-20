import { App } from '../App';

export enum OperandTypes {
	const,
	register,
	mDirect,
	mIndirect
}

export class Operand {
	type: OperandTypes;
	value: any;

	constructor(type: OperandTypes, value: any) {
		this.type = type;
		this.value = value;

		if (type === OperandTypes.const && typeof value === 'number' && value < 0) {
			const buf = Buffer.alloc(4);
			buf.writeInt32LE(value);
			this.value = buf.readUInt32LE();
		}
	}

	get isMemory() {
		return !(this.type === OperandTypes.register || this.type === OperandTypes.const);
	}

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
			switch (memSize) {
				case 1:
					return app.memory.readUInt8(this.value);
				case 2:
					return app.memory.readUInt16LE(this.value);
				case 4:
					return app.memory.readUInt32LE(this.value);
				default:
					throw new Error('Invalid memsize Size');
			}
		}

		throw new Error('NEEDED' + this.type);
	}

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
			switch (memSize) {
				case 1:
					return app.memory.readInt8(this.value);
				case 2:
					return app.memory.readInt16LE(this.value);
				case 4:
					return app.memory.readInt32LE(this.value);
				default:
					throw new Error('Invalid memsize Size');
			}
		}

		throw new Error('NEEDED' + this.type);
	}

	setValue(app: App, memSize: number | undefined, newValue: number): void {
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
			switch (memSize) {
				case 1:
					app.memory.writeUInt8(newValue);
					return;
				case 2:
					app.memory.writeUInt16LE(newValue);
					return;
				case 4:
					app.memory.writeUInt32LE(newValue);
					return;
				default:
					throw new Error('Invalid memsize Size');
			}
		}
	}
}

export default Operand;
