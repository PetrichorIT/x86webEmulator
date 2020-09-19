import { App, Command, CommandOperandChecker, Label } from '../App';
import { StringStream } from './StringStream';
import { syn_label, CompilerError, syn_keywords, syn_registers, syn_number, syn_string } from './const';
import Operand, { OperandTypes } from '../models/Operand';
import * as x86 from '../x86';

export class Parser {
	app: App;
	currentLine: StringStream;
	libs: { [key: string]: (Command | Label)[] };

	constructor(app: App) {
		this.app = app;
		this.libs = {};
	}

	/**
	 * Parses given code as libary code, 
	 * converting internal labels using the __libName_ prefix.
	 */
	parseLib(libName: string, code: string) {
		let prefix = `__lib_${libName}_`;

		let entryPoints: string[] = [];
		let compiled = this.parse(code, entryPoints);

		for (let i = 0; i < compiled.length; i++) {
			if ((compiled[i] as Label).label) {
				if (!entryPoints.includes((compiled[i] as Label).label)) {
					(compiled[i] as Label).label = prefix + (compiled[i] as Label).label;
				}
			} else {
				for (let j = 0; j < (compiled[i] as Command).params.length; j++) {
					const element = (compiled[i] as Command).params[j];
					if (element.type === OperandTypes.label) {
						if (!entryPoints.includes(element.value)) {
							element.value = prefix + element.value;
						}
					}
				}
			}
		}

		this.libs[libName] = [
			{
				name: 'jmp',
				params: [ new Operand(OperandTypes.label, prefix + 'libmain') ],
				lineNumber: 0
			}
		];
		this.libs[libName] = this.libs[libName].concat(compiled);
		this.libs[libName].push({ label: prefix + 'libmain', lineNumber: 0 });

		return this.libs[libName];
	}

	/**
	 * Parses given code and collectd exported labels.
	 */
	parse(code: string, exportLabels?: string[]): (Command | Label)[] {
		exportLabels = exportLabels || [];

		let lines = code.split('\n');
		let instructions: (Command | Label)[] = [];

		for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
			this.currentLine = new StringStream(lines[lineIdx]);
			this.currentLine.eatWhitespaces();

			if (this.currentLine.eol()) continue;
			if (this.currentLine.eat(';')) continue;

			let isExportLabel = this.currentLine.rest().startsWith('@export ');
			if (isExportLabel) this.currentLine.skip(8);

			if (this.currentLine.rest().startsWith('#include')) {
				// Include statement
				this.currentLine.skip(8);
				this.currentLine.eatWhitespaces();

				if (this.currentLine.eol())
					throw new CompilerError('C001 - Missing libName after #include statement', lineIdx, {
						from: 0
					});
				// Also removes next symvol (if nothrow == ")
				if (this.currentLine.next() !== '"')
					throw new CompilerError('C002 - Unkown token after #include statement. Expected "', lineIdx, {
						from: this.currentLine.position
					});

				let preIdx = this.currentLine.position - 1;
				let libName = this.currentLine.eatWhile(/[A-z._/]/);

				if (this.currentLine.eol() || this.currentLine.peek() !== '"')
					throw new CompilerError('C003 - Missing closing token " in #include statment', lineIdx, {
						from: preIdx,
						to: this.currentLine.position
					});

				if (this.libs[libName] === undefined)
					throw new CompilerError(`C004 - Unknown libary identifier "${libName}"`, lineIdx, {
						from: preIdx,
						to: this.currentLine.position
					});

				instructions = instructions.concat(
					this.libs[libName].map((instr) => {
						instr.lineNumber = lineIdx;
						return instr;
					})
				);

				console.info(`Including libary "${libName}" (${this.libs[libName].length} instructions)`);
			} else {
				const labelMatch = this.currentLine.match(syn_label, true) as RegExpMatchArray;
				if (labelMatch) {
					// Found label
					const label = labelMatch[0].substr(0, labelMatch[0].length - 1);
					if (label === 'libmain')
						throw new CompilerError('C005 - Forbidden Label "libmain"', lineIdx, {
							from: 0,
							to: this.currentLine.position
						});
					if (label.startsWith('__'))
						throw new CompilerError('C005 - Forbidden Label "__*"', lineIdx, {
							from: 0,
							to: this.currentLine.position
						});
					instructions.push({
						label: label,
						lineNumber: lineIdx
					});

					if (isExportLabel) exportLabels.push(label);
				}

				this.currentLine.eatWhitespaces();
				if (this.currentLine.eol()) continue;

				// Normal Instruction
				const preCN = this.currentLine.position;
				const commandName = this.currentLine.eatWhile(/[A-z_0-9]/).toLowerCase();
				let params: Operand[] = [];

				if (!syn_keywords.includes(commandName))
					throw new CompilerError(`C006 - Invalid token. Invalid instruction "${commandName}"`, lineIdx, {
						from: preCN,
						to: this.currentLine.position
					});

				let i = 0;
				while (!this.currentLine.eol() && i < 16) {
					if (this.currentLine.peek() === ';') break;

					// Operand check

					this.currentLine.eat(',');
					this.currentLine.eatWhitespaces();

					let preOpParse = this.currentLine.position;
					if (this.currentLine.peek() === '[') {
						this.currentLine.next();
						this.currentLine.eatWhitespaces();

						if (!isNaN(parseInt(this.currentLine.peek()))) {
							// Direct Memory
							let matches = this.currentLine.match(
								/((0x[\dabcdef]+)|(0b[01]+)|([\d]+))[ ]*]/
							) as RegExpMatchArray;
							if (!matches)
								throw new CompilerError(
									'C007 - Invalid token for direct memory adressing. Expected [<number>]',
									lineIdx,
									{ from: preOpParse }
								);

							let number = parseInt(matches[0].substr(0, matches[0].length - 1));
							if (isNaN(number))
								throw new CompilerError(
									`C008 - Invalid number string "${matches[0].substr(0, matches[0].length - 1)}"`,
									lineIdx,
									{ from: preOpParse }
								);
							params.push(new Operand(OperandTypes.mDirect, number));
						} else {
							// Some Indirect Mem

							let contents = this.currentLine.eatWhile((c) => c !== ']');
							if (this.currentLine.peek() !== ']')
								throw new CompilerError('C009 - Missing closing token ]', lineIdx, {
									from: preOpParse,
									to: this.currentLine.position
								});
							this.currentLine.next();
							contents = contents.trim();

							if (contents.includes('+') || contents.includes('-')) {
								// Indexed Memory Access
								let idx = contents.indexOf('+');
								if (idx === -1) idx = contents.indexOf('-');
								let regString = contents.substr(0, idx).trim().toLowerCase();

								if (!syn_registers.test(regString))
									throw new CompilerError(
										`C010 - Invalid token. Invalid register "${regString}"`,
										lineIdx,
										{
											from: preOpParse,
											to: this.currentLine.position
										}
									);

								let offsetStr = contents.substr(idx + 1).trim();
								if (offsetStr.match(syn_number)[0] !== offsetStr)
									throw new CompilerError(
										`C011 - Invalid token. Expected number from string "${offsetStr}"`,
										lineIdx,
										{
											from: preOpParse,
											to: this.currentLine.position
										}
									);

								let offset = parseInt(offsetStr);

								if (isNaN(offset))
									throw new CompilerError(
										`C011 - Invalid token. Expected number from string ${offsetStr}`,
										lineIdx,
										{
											from: preOpParse,
											to: this.currentLine.position
										}
									);

								params.push(
									new Operand(OperandTypes.mIndexed, [
										regString,
										contents.charAt(idx) == '+' ? offset : -offset
									])
								);
							} else {
								// Some Other

								const fReg = contents.toLowerCase();
								if (!syn_registers.test(fReg))
									throw new CompilerError(
										`C012 - Invalid token. Invalid register "${fReg}"`,
										lineIdx,
										{
											from: preOpParse,
											to: this.currentLine.position
										}
									);

								this.currentLine.eatWhitespaces();
								let preSecondParse = this.currentLine.position;
								if (this.currentLine.peek() === '[') {
									// DIndexed
									this.currentLine.next();
									let sReg = this.currentLine.eatWhile((c) => c !== ']');
									if (this.currentLine.peek() !== ']')
										throw new CompilerError('C013 - Missing closing token ]', lineIdx, {
											from: preSecondParse,
											to: this.currentLine.position
										});
									this.currentLine.next();
									sReg = sReg.toLowerCase();

									if (!syn_registers.test(sReg))
										throw new CompilerError(
											`C014 - Invalid token. Invalid register "${sReg}"`,
											lineIdx,
											{
												from: preSecondParse,
												to: this.currentLine.position
											}
										);

									params.push(new Operand(OperandTypes.mDIndexed, [ fReg, sReg ]));
								} else {
									// Indirect
									params.push(new Operand(OperandTypes.mIndirect, fReg));
								}
							}
						}
					} else {
						if (!isNaN(parseInt(this.currentLine.peek()))) {
							// Const
							let numStr = this.currentLine.eatWhile((c) => c !== ',' && c !== ' ');

							if (numStr.match(syn_number)[0] !== numStr)
								throw new CompilerError(
									`C014 - Invalid token. Expected number from string "${numStr}"`,
									lineIdx,
									{
										from: preOpParse
									}
								);

							let num = parseInt(numStr);
							if (isNaN(num))
								throw new CompilerError(
									`C015 - Invalid token. Expected number from string "${numStr}"`,
									lineIdx,
									{
										from: preOpParse
									}
								);

							params.push(new Operand(OperandTypes.const, num));
						} else if (this.currentLine.peek() === '"') {
							let desc = this.currentLine.eatWhile((c) => c !== ',').trim();
							if (syn_string.test(desc)) {
								params.push(new Operand(OperandTypes.string, desc.substr(1, desc.length - 2)));
							}
						} else {
							// Register
							let desc = this.currentLine.eatWhile((c) => c !== ',' && c !== ';').trim().toLowerCase();
							if (syn_registers.test(desc)) {
								params.push(new Operand(OperandTypes.register, desc));
							} else {
								params.push(new Operand(OperandTypes.label, desc));
							}
						}
					}
					// Operand check over

					this.currentLine.eatWhitespaces();
					i++;
				}

				// Check Operand Composition

				const checker = (x86 as any)['__' + commandName] as CommandOperandChecker | undefined;
				if (checker) {
					try {
						checker(params);
					} catch (e) {
						throw new CompilerError(e.message, lineIdx, { from: preCN });
					}
				} else {
					console.warn(`Missing checker for instruction "${commandName}" `);
				}

				instructions.push({ name: commandName, params: params, lineNumber: lineIdx });
			}
		}

		// Label Resolve Test

		function pushUniq<T>(arr: T[], value: T) {
			if (!arr.includes(value)) arr.push(value);
		}

		let definedLabels: string[] = [];
		let requestedLabels: { label: string; line: number }[] = [];

		for (const instrc of instructions) {
			if ((instrc as Label).label !== undefined) {
				pushUniq(definedLabels, (instrc as Label).label);
			} else {
				for (const operand of (instrc as Command).params) {
					if (operand.type === OperandTypes.label)
						pushUniq(requestedLabels, { label: operand.value, line: instrc.lineNumber });
				}
			}
		}

		for (const { label, line } of requestedLabels) {
			if (!definedLabels.includes(label)) {
				throw new CompilerError(`C016 - Unkown Label "${label}"`, line, { from: 0 });
			}
		}

		return instructions;
	}
}

export default Parser;
