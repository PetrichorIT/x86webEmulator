import { App, Command, CommandOperandChecker, CompiledCode, Label } from "../App";
import { DataConstant, Programm } from "../models/Programm";
import { StringStream } from "./StringStream";
import { CompilerError, SourceMode, syn_label_def, syn_label, syn_registers, syn_number, syn_keywords, syn_string } from "./Common";
import Operand, { OperandTypes } from "../models/Operand";

import * as x86 from '../x86';

export class Compiler {

    public debugMode: boolean = false;

    private app: App;
    private mode: SourceMode = SourceMode.global;
    private currentLine: StringStream;

    public libs: { [key:string]: Programm }

    constructor(app: App) {
        this.app = app;
        this.libs = {};
    }

    public parseLib(libName: string, text: string): Programm {
        const prefix = `__lib_${libName}_`;
        if (this.debugMode) console.info(`[Compiler] Preparing libary "${libName}" for compiling.`)

        let entryPoints: string[] = [];
        let compiled = this.parse(text, entryPoints);
        
        // Prefixes labels with a libary prefix
		for (let i = 0; i < compiled.text.length; i++) {
			if ((compiled.text[i] as Label).label) {
				// Labels
				if (!entryPoints.includes((compiled.text[i] as Label).label)) {
					(compiled.text[i] as Label).label = prefix + (compiled.text[i] as Label).label;
				}
			} else {
				// Defines code as libary code
				(compiled.text[i] as Command).isLibCode = true;
				// Label Operands
				for (let j = 0; j < (compiled.text[i] as Command).params.length; j++) {
					const element = (compiled.text[i] as Command).params[j];
					if (element.type === OperandTypes.label) {
						if (!entryPoints.includes(element.value)) {
							element.value = prefix + element.value;
						}
					}
				}
			}
        }
        
        // Adds lib_label and JMP lib_label for header intergration

        compiled.text = [ 
            { name: "jmp", params: [ new Operand(OperandTypes.label, prefix + "libmain")], lineNumber: 0 }, 
            ...compiled.text, 
            { label: prefix + "libmain", lineNumber: 0}
        ];
        this.libs[libName] = compiled;

		if (this.debugMode) console.info(`[Compiler] Finished parsing Lib "${libName}"`);

		return this.libs[libName];
    }

    public parse(text: string, exportLabels?: string[]): Programm {

         exportLabels = exportLabels || [];

        const startTime = new Date().getTime();

        let lines = text.split("\n");
        let programm = new Programm([],[]);

        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            switch (this.mode) {
                case SourceMode.global:
                    this.parseGlobal(lines[lineIdx], lineIdx, programm);
                    break;
                case SourceMode.text: 
                    this.parseText(lines[lineIdx], lineIdx, programm, exportLabels);
                    break;
                case SourceMode.data: 
                    this.parseData(lines[lineIdx], lineIdx, programm);
                    break;
            }
            
        }

        /// Check label / dConstant consistency 

		function pushUniq<T>(arr: T[], value: T): boolean {
			if (!arr.includes(value)) {
				arr.push(value);
				return true;
			}
			return false;
		}

        /// Collect defined and requesten labels / dConst
		let definedLabels: string[] = [];
        let requestedLabels: { label: string; line: number }[] = [];
        
        let definedDConst: string[] = [];
        let requestedDConst: { name: string, line: number }[] = [];

		for (const instrc of programm.text) {
			if ((instrc as Label).label !== undefined) {
				// Push all defined labels into array to find redefinition
				if (!pushUniq(definedLabels, (instrc as Label).label)) {
					throw new CompilerError(
						`C018 - Illegal label redefintion "${(instrc as Label).label}"`,
						instrc.lineNumber,
						{ from: 0 }
					);
				}
			} else {
				// Push all used labels into array to gurantee existence
				for (const operand of (instrc as Command).params) {
					if (operand.type === OperandTypes.label)
                        pushUniq(requestedLabels, { label: operand.value, line: instrc.lineNumber });
                    if (operand.type === OperandTypes.dataOffset)
                        pushUniq(requestedDConst, { name: operand.value, line: instrc.lineNumber });
				}
			}
		}

        for (const dConst of programm.data) {
            if (!pushUniq(definedDConst, dConst.name)) 
                throw new CompilerError('C033 -  Illegal Constant redefintion "' + dConst.name + '"', dConst.lineNumber, { from: 0 })
        }

		// Test if requestedLabels <= definedLabels
		for (const { label, line } of requestedLabels) {
			if (!definedLabels.includes(label)) {
				throw new CompilerError(`C016 - Unkown Label "${label}"`, line, { from: 0 });
			}
        }
        
        // Test if requestedLabels <= definedLabels
		for (const { name, line } of requestedDConst) {
			if (!definedDConst.includes(name)) {
				throw new CompilerError(`C016 - Unkown Constant "${name}"`, line, { from: 0 });
			}
		}

        if (this.debugMode) {
			const dur = (new Date()).getTime() - startTime;
			console.info(`[Compiler] Parsed ${lines.length} lines in ${dur}ms`);
            console.info(`[Compiler] Captured ${programm.text.length} symbols (${definedLabels.length} labels, ${programm.text.length - definedLabels.length} commands)`);
            console.info(`[Compiler] Captured ${programm.data.length} constants`);
			console.info(`[Compiler] Captured ${exportLabels.length} public symbols`);
		}

        this.mode = SourceMode.global;
        return programm;
    }


    private parseGlobal(line: string, lineIdx: number, programm: Programm) {
        // Use line a string stream
        this.currentLine = new StringStream(line);
        this.currentLine.eatWhitespaces();

        // Ingnore empty lines and pure comments
        if (this.currentLine.eol()) return;
        if (this.currentLine.eat(';')) return;

        if (this.currentLine.eat(".")) {
            // MARKER
            if (this.currentLine.match("data:", true)) {
                this.mode = SourceMode.data
                return
            }
            if (this.currentLine.match("text:", true)) {
                this.mode = SourceMode.text;
                return;
            }
        } else if (this.currentLine.rest().startsWith("#include")) {
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


            programm.text.push(...this.libs[libName].text
                .map((instr) => {
                    instr.lineNumber = lineIdx;
                    return instr;
                })
            );
            programm.data.push(...this.libs[libName].data
                .map((dConst) => {
                    dConst.lineNumber = lineIdx;
                    return dConst;
                })
            );

            if (this.debugMode) console.info(`[Compiler] Including libary "${libName}" (${this.libs[libName].text.length} instructions & ${this.libs[libName].data.length} constants)`);

        } else {
            const res = this.currentLine.match(syn_label_def) as RegExpMatchArray;
            if (res) {
                const opt = res[0].substr(0, res.length - 1);
                const value = this.currentLine.eatWhile((c) => c !== ";");

                programm.options[opt] = value.trim();
            }
        }
    }

    /**
     * Parses a line defined as a text line.
     */
    private parseText(line: string, lineIdx: number, programm: Programm, exportLabels: string[]) {

        // Use line a string stream
        this.currentLine = new StringStream(line);
        this.currentLine.eatWhitespaces();

        // Ingnore empty lines and pure comments
        if (this.currentLine.eol()) return;
        if (this.currentLine.eat(';')) return;

        

        if (this.currentLine.rest().startsWith(".data:")) {
            this.mode = SourceMode.data;
            return
        }

        // Identifiy @export labels
        let isExportLabel = this.currentLine.rest().startsWith('@export ');
        if (isExportLabel) this.currentLine.skip(8);

        {
            // Manage Lables
            const labelMatch = this.currentLine.match(syn_label_def, true) as RegExpMatchArray;
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
                programm.text.push({
                    label: label,
                    lineNumber: lineIdx
                });

                if (isExportLabel) exportLabels.push(label);
            }

            // Eat Whitespaces whenever possible
            this.currentLine.eatWhitespaces();
            if (this.currentLine.eol()) return;

            // Manage Instruction
            const preCN = this.currentLine.position;
            const commandName = this.currentLine.eatWhile(/[A-z_0-9]/).toLowerCase();
            let params: Operand[] = [];


            // Test for valid keyword
            if (!syn_keywords.includes(commandName))
                throw new CompilerError(`C006 - Invalid token. Invalid instruction "${commandName}"`, lineIdx, {
                    from: preCN,
                    to: this.currentLine.position
                });

            // Read Operands (max 4)
            let i = 0;
            while (!this.currentLine.eol() && i < 4) {
                if (this.currentLine.peek() === ';') break;

                // Eat all whitspacing characters
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
                            if (!offsetStr.match(syn_number) || offsetStr.match(syn_number)[0] !== offsetStr)
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
                        let numStr = this.currentLine.eatWhile((c) => c !== ',' && c !== ' ' && c !== ";");

                        if (numStr.match(syn_number)[0] !== numStr)
                            throw new CompilerError(
                                `C014 - Invalid token. Expected number from string "${numStr}"`,
                                lineIdx,
                                {
                                    from: preOpParse
                                }
                            );

                        let num = parseInt(numStr);
                        if (numStr.toLowerCase().startsWith("0b")) num = parseInt(numStr.substr(2), 2)
                        
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
                        let desc = this.currentLine.eatWhile((c) => c !== ',' && c !== ";").trim();
                        if (syn_string.test(desc)) {
                            params.push(new Operand(OperandTypes.string, desc.substr(1, desc.length - 2)));
                        }
                    } else if (this.currentLine.rest().toLowerCase().startsWith("offset ")) {
                        this.currentLine.skip(7);
                        let desc = this.currentLine.eatWhile((c) => c !== "," && c !== ";")
                        params.push(new Operand(OperandTypes.dataOffset, desc));
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
                if (this.debugMode) console.warn(`[Compiler ]Missing checker for instruction "${commandName}" `);
            }

            programm.text.push({ name: commandName, params: params, lineNumber: lineIdx });
        }
    }

    private parseData(line: string, lineIdx: number, programm: Programm) {
        // Use line a string stream
        this.currentLine = new StringStream(line);
        this.currentLine.eatWhitespaces();
 
        // Ingnore empty lines and pure comments
        if (this.currentLine.eol()) return;
        if (this.currentLine.eat(';')) return;

        if (this.currentLine.match(".text:", true)) {
            this.mode = SourceMode.text;
            return;
        };


        const w = this.currentLine.eatWhile(/\w/)
        if (!syn_label.test(w))
            throw new CompilerError('C031 - Invalid naming scheme "' + w + '". Expected [A-z][A-z0-9_-]*', lineIdx)

        this.currentLine.eatWhitespaces();

        const def = this.currentLine.eatWhile(/\w/).toLowerCase();
        if (![ "dd", "db", "dw"].includes(def))
            throw new CompilerError('C032 - Invalid size scheme "' + def + '". Expected "DD", "DW" or "DB"')
    
        const defSize: number = def === "dd" ? 4 : (def === "dw" ? 2 : 1)

        const raw: number[] = []
        while (!this.currentLine.eol()) {
            if (this.currentLine.peek() === ";") break;
            if (this.currentLine.peek() === ",") this.currentLine.next();

            const r = this.currentLine.eatWhile((c) => c !== ";" && c !== ",").trim();
            if (r === "") break;
            if (r === "?") {
                raw.push(null);
            } else {
                raw.push(parseInt(r));
            }

        }

        programm.data.push(
            new DataConstant(w, defSize, raw, lineIdx)
        );

    }
}