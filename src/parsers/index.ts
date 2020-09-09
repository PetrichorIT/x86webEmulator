import { Command, Label, App } from '../App';
import Operand, { OperandTypes } from '../models/Operand';
import { syn_keywords, syn_registers } from './syntax';

export class Parser {
	private currentLine: string = '';

	parse(code: string, app: App): (Command | Label)[] {
		let lines = code.split('\n');
		let commands: (Command | Label)[] = [];

		for (let idx = 0; idx < lines.length; idx++) {
			const line = lines[idx];

			this.currentLine = line.trim();
			if (this.currentLine === '') continue;
			if (this.currentLine[0] === ';') continue;

			if (this.currentLine.includes(':')) {
				// LABEL
				let ddotpos = this.currentLine.indexOf(':');
				commands.push({ label: this.currentLine.substr(0, ddotpos), lineNumber: idx });
			} else if (this.currentLine.startsWith('#include')) {
				let whPos = this.currentLine.indexOf(' ');
				if (whPos === -1) {
					whPos = this.currentLine.length;
				}
				this.currentLine = this.currentLine.substr(whPos + 1);

				if (this.currentLine[0] !== `"`)
					throw new Error(`C001 - Invalid token ${this.currentLine[0]} after #include`);
				this.currentLine = this.currentLine.substr(1);

				let endIdx = this.currentLine.indexOf(`"`);
				if (endIdx === -1) throw new Error('C002 - Missing second " after string start');
				let importName = this.currentLine.substr(0, endIdx);

				commands = commands.concat(this.import(importName, app, idx));
			} else {
				let whPos = this.currentLine.indexOf(' ');
				if (whPos === -1) {
					whPos = this.currentLine.length;
				}
				let commandName = this.currentLine.substr(0, whPos).toLowerCase();
				let params: Operand[] = [];

				if (!syn_keywords.test(commandName.toLowerCase()))
					throw new Error(`C003 - Invalid instruction name "${commandName}"`);

				this.currentLine = this.currentLine.substr(whPos);
				let i = 0;
				while (this.currentLine !== '' && i < 16) {
					i++;
					this.currentLine = this.currentLine.trim();
					if (this.currentLine[0] === ';') break;

					params.push(this.parseOperand());
				}

				commands.push({ name: commandName, params: params, lineNumber: idx });
			}
		}
		console.log(commands);
		return commands;
	}

	private import(pckg: string, app: App, lineNumber: number): (Command | Label)[] {
		let pckgInstr = app.libs[pckg];
		if (pckgInstr === undefined) throw new Error(`C011 - Invalid package name  "${pckg}"`);

		const lbName = '__pckg_' + pckg + '_end';

		pckgInstr.unshift({
			name: 'jmp',
			params: [ new Operand(OperandTypes.label, lbName) ],
			lineNumber
		});
		pckgInstr.push({ label: lbName, lineNumber });

		return pckgInstr.map((v: Command | Label) => {
			v.lineNumber = lineNumber;
			return v;
		});
	}

	private parseOperand(): Operand {
		if (this.currentLine[0] === ',') this.currentLine = this.currentLine.substr(1).trimLeft();

		if (this.currentLine[0] === '[') {
			this.currentLine = this.currentLine.substr(1).trimLeft();
			if (!isNaN(parseInt(this.currentLine[0], 10))) {
				// Direct Memory
				let idx = this.currentLine.indexOf(']');
				if (idx === -1) throw new Error('C004 - Missing closing "]" at dMem operand');
				let num = parseInt(this.currentLine.substr(0, idx));
				this.currentLine = this.currentLine.substr(idx + 1);

				if (isNaN(num)) throw new Error(`C005 - Error parsing number from string "${num}"`);
				return new Operand(OperandTypes.mDirect, num);
			} else {
				let idx = this.currentLine.indexOf(']');
				if (idx === -1) throw new Error('C006 - Missing closing "]" at idMem operand');
				let firstFieldDesc = this.currentLine.substr(0, idx);
				this.currentLine = this.currentLine.substr(idx + 1).trim();

				if (firstFieldDesc.includes('+')) {
					// Indexed
					let pIdx = firstFieldDesc.indexOf('+');
					let reg = firstFieldDesc.substr(0, pIdx).trim().toLowerCase();
					if (!syn_registers.test(reg)) throw new Error(`C007 - Invalid registers "${reg}"`);

					let offset = parseInt(firstFieldDesc.substr(pIdx + 1));
					if (isNaN(offset)) throw new Error(`C008 - Error parsing number from string "${offset}"`);

					return new Operand(OperandTypes.mIndexed, [ reg, offset ]);
				} else {
					let fRegDesc = firstFieldDesc.trim().toLowerCase();
					if (!syn_registers.test(fRegDesc)) throw new Error(`C007 - Invalid registers "${fRegDesc}"`);

					if (this.currentLine[0] === '[') {
						this.currentLine = this.currentLine.substr(1);
						let idx = this.currentLine.indexOf(']');
						if (idx === -1) throw new Error('C009 - Missing closing "]" at indRMem operand');
						let reg = this.currentLine.substr(0, idx).trim().toLowerCase();
						this.currentLine = this.currentLine.substr(idx + 1);

						if (!syn_registers.test(reg)) throw new Error(`C007 - Invalid registers "${reg}"`);
						return new Operand(OperandTypes.mDIndexed, [ fRegDesc, reg ]);
					} else {
						// Indirect
						return new Operand(OperandTypes.mIndirect, fRegDesc);
					}
				}
			}
		} else {
			if (!isNaN(parseInt(this.currentLine[0], 10))) {
				// Const
				let whPos = this.currentLine.indexOf(',');
				if (whPos === -1) whPos = this.currentLine.length;
				let num = parseInt(this.currentLine.substr(0, whPos));
				this.currentLine = this.currentLine.substr(whPos + 1);
				if (isNaN(num)) throw new Error(`C010 - Error parsing number from string "${num}"`);
				return new Operand(OperandTypes.const, num);
			} else {
				// Register
				let whPos = this.currentLine.indexOf(',');
				if (whPos === -1) whPos = this.currentLine.length;
				let desc = this.currentLine.substr(0, whPos).trim().toLowerCase();
				this.currentLine = this.currentLine.substr(whPos + 1);

				if (!syn_registers.test(desc)) {
					return new Operand(OperandTypes.label, desc);
				}

				return new Operand(OperandTypes.register, desc);
			}
		}
	}
}

export default Parser;
