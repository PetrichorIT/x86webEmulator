import { App, Command, CommandOperandChecker, Label } from "../App";
import { DataConstant, Programm } from "../models/Programm";
import { StringStream } from "./StringStream";
import { CompilerError, SourceMode, syn_label_def, syn_label, syn_registers, syn_number, syn_keywords, syn_string, CompilerErrorCode } from "./Common";
import Operand, { OperandTypes } from "../models/Operand";

import * as x86 from '../x86';

// Ready to merge from "branch segmentedAssembler"
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

    /**
     * Parses a programm source , producing a libary unit (name as provided).
     */
    public parseLib(libName: string, text: string): Programm {
        // Defines libary internal prefix
        const prefix = `__lib_${libName}_`;
        if (this.debugMode) console.info(`[Compiler] Preparing libary "${libName}" for compiling.`)

        // Captures entry points from normal parse
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
            { name: "jmp", params: [ new Operand(OperandTypes.label, prefix + "libmain")], lineNumber: 0, isLibCode: true }, 
            ...compiled.text, 
            { label: prefix + "libmain", lineNumber: 0, isLibCode: true }
        ];
        this.libs[libName] = compiled;

		if (this.debugMode) console.info(`[Compiler] Finished parsing Lib "${libName}"`);

		return this.libs[libName];
    }

    /**
     * Parses a programm source, producing a runnable unit.
     * Returns public lables if reference is provided 
     */
    public parse(text: string, exportLabels?: string[]): Programm {

        // Reset global mode (as any cause ts is weird)
        this.mode = SourceMode.global as any;
        exportLabels = exportLabels || [];

        // Messaures time of compile process
        const startTime = new Date().getTime();

        // Parse line by line
        let lines = text.split("\n");
        let programm = new Programm([],[]);

        // Switch between global/text/data mode
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

        // Check label / dConstant consistency 
		function pushUniq<T>(arr: T[], value: T): boolean {
			if (!arr.includes(value)) {
				arr.push(value);
				return true;
			}
			return false;
		}

        /// Collect defined and requested labels
		let definedLabels: string[] = [];
        let requestedLabels: { label: string; line: number }[] = [];
        
        // Collect  defined and requested DConsts
        let definedDConst: string[] = [];
        let requestedDConst: { name: string, line: number }[] = [];

		for (const instrc of programm.text) {
			if ((instrc as Label).label !== undefined) {
				// Push all defined labels into array to find redefinition
				if (!pushUniq(definedLabels, (instrc as Label).label)) {
					throw new CompilerError(
                        CompilerErrorCode.illegalLabelRedefintion,
						(instrc as Label).label,
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
                    if (operand.type === OperandTypes.dataMReference)
                        pushUniq(requestedDConst, { name: operand.value, line: instrc.lineNumber });
				}
			}
		}

        // Collect defined dConsts
        for (const dConst of programm.data) {
            if (!pushUniq(definedDConst, dConst.name)) 
                throw new CompilerError(CompilerErrorCode.illegalConstantRedefintion, dConst.name, dConst.lineNumber, { from: 0 })
        }

		// Test if requestedLabels <= definedLabels
		for (const { label, line } of requestedLabels) {
			if (!definedLabels.includes(label)) {
				throw new CompilerError(CompilerErrorCode.undefinedLabel, label, line, { from: 0 });
			}
        }
        
        // Test if requestedLabels <= definedLabels
		for (const { name, line } of requestedDConst) {
			if (!definedDConst.includes(name)) {
				throw new CompilerError(CompilerErrorCode.undefinedConstant, name, line, { from: 0 });
			}
		}

        // Output additional information in debug mode
        if (this.debugMode) {
			const dur = (new Date()).getTime() - startTime;
			console.info(`[Compiler] Parsed ${lines.length} lines in ${dur === 0 ? "&lt;1" : dur}ms`);
            console.info(`[Compiler] Captured ${programm.text.length} symbols (${definedLabels.length} labels, ${programm.text.length - definedLabels.length} commands)`);
            console.info(`[Compiler] Captured ${programm.data.length} constants`);
            if (exportLabels.length !== 0)
                console.info(`[Compiler] Captured ${exportLabels.length} public symbols`);
            if (programm.depenencies.length !== 0)
                console.info(`[Compiler] Included ${programm.depenencies.length} dependencies`)
		}

        // Reset mode to default
        this.mode = SourceMode.global;
        return programm;
    }


    /**
     * Parses a line expecting global symbols
     */
    private parseGlobal(line: string, lineIdx: number, programm: Programm) {
        // Use line a string stream
        this.currentLine = new StringStream(line);
        this.currentLine.eatWhitespaces();

        // Ingnore empty lines and pure comments
        if (this.currentLine.eol()) return;
        if (this.currentLine.eat(';')) return;

        // Capture global markers
        if (this.currentLine.eat(".")) {
            // Switch context to data
            if (this.currentLine.match("data:", true)) {
                this.mode = SourceMode.data
                return
            }

            // Switch context to text
            if (this.currentLine.match("text:", true)) {
                this.mode = SourceMode.text;
                return;
            }

            // Throw at unkown global symbol
            throw new CompilerError(
                CompilerErrorCode.invalidGlobalSymbol,
                null,
                lineIdx,
                { from: this.currentLine.position - 1 }
            );
        } else if (this.currentLine.rest().startsWith("#include")) {
            // Skip Include statement
            this.currentLine.skip(8);
            this.currentLine.eatWhitespaces();

            // Check for end of line (invalid configuration)
            if (this.currentLine.eol())
                throw new CompilerError(
                    CompilerErrorCode.missingLibaryIdentifier, null , lineIdx, {
                    from: 0
                });

            // Also removes next symvol (if nothrow == ")
            if (this.currentLine.next() !== '"')
                throw new CompilerError(
                    CompilerErrorCode.missingLibaryIdentifier, null, lineIdx, {
                    from: this.currentLine.position
                });

            // Pin the strings start position (including ")
            let preIdx = this.currentLine.position - 1;
            let libName = this.currentLine.eatWhile(/[A-z0-9._/]/);

            // Check for terminating token
            if (this.currentLine.eol() || this.currentLine.peek() !== '"')
                throw new CompilerError(
                    CompilerErrorCode.missingLibaryIdentifier, null, lineIdx, {
                    from: preIdx,
                    to: this.currentLine.position
                });

            // Check if libarys exists
            if (this.libs[libName] === undefined)
                throw new CompilerError(
                    CompilerErrorCode.unkownLibaryIdentifier, libName, lineIdx, {
                    from: preIdx,
                    to: this.currentLine.position
                });

            // include (copyPaste) libary text into programm text (lineCorrection)
            programm.text.push(...this.libs[libName].text
                .map((instr) => {
                    instr.lineNumber = lineIdx;
                    return instr;
                })
            );

            // include (copyPaste) libary data into programm data (lineCorrection)
            programm.data.push(...this.libs[libName].data
                .map((dConst) => {
                    dConst.lineNumber = lineIdx;
                    return dConst;
                })
            );

            // Define dependency
            programm.depenencies.push(libName)

            // Debug information
            if (this.debugMode) console.info(`[Compiler] Including libary "${libName}" (${this.libs[libName].text.length} symbols & ${this.libs[libName].data.length} constants)`);
        } else {
            // Capture options definition
            const res = this.currentLine.match(syn_label_def) as RegExpMatchArray;
            if (res) {
                // Cature option
                const opt = res[0].substr(0, res[0].length - 1);

                // Cature raw text value (terminated by eol or comment)
                const value = this.currentLine.eatWhile((c) => c !== ";").trim();

                if (value === "") 
                    throw new CompilerError(
                        CompilerErrorCode.missingGlobalOptionsDefintion,
                        null,
                        lineIdx,
                        { from: 0 }
                    );

                // Define option in programm manifest
                programm.options[opt] = value;
            } else {
                // Undefined global symbol
                throw new CompilerError(
                    CompilerErrorCode.invalidGlobalSymbol,
                    null,
                    lineIdx,
                    { from: 0 }
                );
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

        // Ignore empty lines and pure comments
        if (this.currentLine.eol()) return;
        if (this.currentLine.eat(';')) return;

        // Capture symbol to switch to data mode
        if (this.currentLine.rest().startsWith(".data:")) {
            this.mode = SourceMode.data;
            return
        }

        // Flag @export labels
        let isExportLabel = this.currentLine.rest().startsWith('@export ');
        if (isExportLabel) this.currentLine.skip(8);

        {
            // Match the current line as label defintion
            const labelMatch = this.currentLine.match(syn_label_def, true) as RegExpMatchArray;
            if (labelMatch) {
                // Extract label descriptor from definition
                const label = labelMatch[0].substr(0, labelMatch[0].length - 1);

                // Catch illegal label descriptors __* and libmain
                if (label === 'libmain')
                    throw new CompilerError(
                        CompilerErrorCode.illegalLabel,
                        'libmain', lineIdx, {
                        from: 0,
                        to: this.currentLine.position
                    });
                if (label.startsWith('__'))
                    throw new CompilerError(
                        CompilerErrorCode.illegalLabel,
                        '__*', lineIdx, {
                        from: 0,
                        to: this.currentLine.position
                    });
                
                // Push lables to source (register as export if nessecary)
                programm.text.push({
                    label: label,
                    lineNumber: lineIdx
                });
                if (isExportLabel) exportLabels.push(label);
            }

            // Eat Whitespaces whenever possible
            this.currentLine.eatWhitespaces();
            if (this.currentLine.eol()) return;

            // Read instruction name (pin location for general debug errros)
            const preCN = this.currentLine.position;
            const commandName = this.currentLine.eatWhile(/[A-z_0-9]/).toLowerCase();
            
            // Operands of current command
            let params: Operand[] = [];

            // Test for valid keyword
            if (!syn_keywords.includes(commandName))
                throw new CompilerError(
                    CompilerErrorCode.invalidInstuction
                    ,commandName, lineIdx, {
                    from: preCN,
                    to: this.currentLine.position
                });

            // Read Operands (max 4)
            let i = 0;
            while (!this.currentLine.eol() && i < 4) {
                
                // Eat all whitspacing characters
                this.currentLine.eat(',');
                this.currentLine.eatWhitespaces();

                if (this.currentLine.peek() === ';') break;

                // Pin location for operand specific debug errors
                let preOpParse = this.currentLine.position;

                // Identify operand by prefix
                if (this.currentLine.peek() === '[') {
                    // Expect some memory oerpadn
                    this.currentLine.next();
                    this.currentLine.eatWhitespaces();

                    // Test for raw number at next symbol
                    if (!isNaN(parseInt(this.currentLine.peek()))) {
                        // Expect: Direct Memory, Read raw number until terminator ]
                        let matches = this.currentLine.match(
                            /((0x[\dabcdef]+)|(0b[01]+)|([\d]+))[ ]*]/
                        ) as RegExpMatchArray;

                        // Catch missing results
                        if (!matches)
                            throw new CompilerError(
                                CompilerErrorCode.invalidTokenDirectMemory,
                                null,
                                lineIdx,
                                { from: preOpParse }
                            );

                        // Parse raw extracted string to number (not including last char "]")
                        let number = this.parseNumber(matches[0].substr(0, matches[0].length - 1), lineIdx, preOpParse, this.currentLine.position);

                        // register operand as direct memory [<number>]
                        params.push(new Operand(OperandTypes.mDirect, number));
                    } else {
                        // Expect some indirect memory form (read first [...])
                        let contents = this.currentLine.eatWhile((c) => c !== ']');
                        if (this.currentLine.peek() !== ']')
                            throw new CompilerError(
                                CompilerErrorCode.missingToken, ']', lineIdx, {
                                from: preOpParse,
                                to: this.currentLine.position
                            });
                        this.currentLine.next();
                        contents = contents.trim();

                        // Check for +/- operantions (indicates indexed memory) 
                        if (contents.includes('+') || contents.includes('-')) {
                            // EXPECT: Indexed Memory Access
                            let idx = contents.indexOf('+');
                            if (idx === -1) idx = contents.indexOf('-');
                            
                            // Expect first operand to be register
                            let regString = contents.substr(0, idx).trim().toLowerCase();
                            if (!syn_registers.test(regString))
                                throw new CompilerError(
                                    CompilerErrorCode.invalidTokenRegister,
                                    regString,
                                    lineIdx,
                                    {
                                        from: preOpParse,
                                        to: this.currentLine.position
                                    }
                                );

                            // Expect second operand to be number (const)
                            let offsetStr = contents.substr(idx + 1).trim();
                            let offset = this.parseNumber(offsetStr, lineIdx, preOpParse, this.currentLine.position)

                            // register indexed memory acces operand
                            params.push(
                                new Operand(OperandTypes.mIndexed, [
                                    regString,
                                    contents.charAt(idx) == '+' ? offset : -offset
                                ])
                            );
                        } else {
                            // Expect either indirect or dynamic indexed memory
                            // Extract first [...] content (register or dConst)
                            const fReg = contents.toLowerCase();
                            if (!syn_registers.test(fReg)) {
                                // Expect: dConst ref

                                params.push(new Operand(OperandTypes.dataMReference, fReg))
                            } else {
                                this.currentLine.eatWhitespaces();
                            
                                // Check for second [...] opernad 
                                let preSecondParse = this.currentLine.position;
                                if (this.currentLine.peek() === '[') {
                                    // Expect: DIndexed
                                    this.currentLine.next();
    
                                    // Read second [...] operand (register)
                                    let sReg = this.currentLine.eatWhile((c) => c !== ']');
                                    if (this.currentLine.peek() !== ']')
                                        throw new CompilerError(
                                            CompilerErrorCode.missingToken, "]", lineIdx, {
                                            from: preSecondParse,
                                            to: this.currentLine.position
                                        });
                                    this.currentLine.next();
                                    sReg = sReg.toLowerCase();
    
                                    if (!syn_registers.test(sReg))
                                        throw new CompilerError(
                                            CompilerErrorCode.invalidTokenRegister,
                                            sReg,
                                            lineIdx,
                                            {
                                                from: preSecondParse,
                                                to: this.currentLine.position
                                            }
                                        );
    
                                    // Register dynamic indexed memory
                                    params.push(new Operand(OperandTypes.mDIndexed, [ fReg, sReg ]));
                                } else {
                                    // Expect: Indirect (all done, just register)
                                    params.push(new Operand(OperandTypes.mIndirect, fReg));
                                }
                            }
                        }
                    }
                } else {
                    // Expect direct symbol
                    // Check for next char (number => Operand const number)
                    if (!isNaN(parseInt(this.currentLine.peek()))) {
                        // Expect: Const Number (Extract from line)
                        let numStr = this.currentLine.eatWhile((c) => c !== ',' && c !== ' ' && c !== ";" && c !== "\t");

                        // Parse to Int (capture special 0b format)
                        let num = this.parseNumber(numStr, lineIdx, preOpParse, this.currentLine.position);
                       
                        // Register Const Number operand
                        params.push(new Operand(OperandTypes.const, num));
                    } else if (this.currentLine.peek() === '"') {
                        // Expect: Const String
                        // Eat first "
                        this.currentLine.next(); 

                        // Eat until terminator "
                        const desc = this.currentLine.eatWhile((c) => c !== '"');
                        if (this.currentLine.eol()) 
                            throw new CompilerError(
                                CompilerErrorCode.missingToken,
                                '"',
                                lineIdx,
                                { from: preOpParse, to: this.currentLine.position }
                            );
                        
                        // Eat second "
                        this.currentLine.next();

                        // Register Const String operand
                        params.push(new Operand(OperandTypes.string, desc));
                    } else if (this.currentLine.rest().toLowerCase().startsWith("offset ")) {
                        // Expect: Data Offset (skip keyword)
                        this.currentLine.skip(7);

                        // Extract label like descriptor
                        let desc = this.currentLine.eatWhile((c) => c !== "," && c !== ";");

                        // Register Data Offset operand
                        params.push(new Operand(OperandTypes.dataOffset, desc));
                    } else {
                        // Expect: Register or Label
                        // Extract descriptor
                        let desc = this.currentLine.eatWhile((c) => c !== ',' && c !== ';').trim().toLowerCase();
                        
                        // Check if register
                        if (syn_registers.test(desc)) {
                            params.push(new Operand(OperandTypes.register, desc));
                        } else {
                            // Default as label (if not existent, captured at post-parse tests)
                            params.push(new Operand(OperandTypes.label, desc));
                        }
                    }
                }

                // Continue to next operand
                this.currentLine.eatWhitespaces();
                i++;
            }

            // Check operand componsition (according to instruction definition)
            // Get checker function (if available)
            const checker = (x86 as any)['__' + commandName] as CommandOperandChecker | undefined;
            if (checker) {
                // Rethrow at any error (as Compiler Error)
                try { 
                    checker(params);
                } catch (e) {
                    throw new CompilerError(
                        CompilerErrorCode.illegalOperands, e.message, 
                        lineIdx, { from: preCN }
                    );
                }
            } else {
                // If not existent, assume correct composition
                if (this.debugMode) console.warn(`[Compiler ]Missing checker for instruction "${commandName}" `);
            }

            // Add Command with operands to programm text
            programm.text.push({ name: commandName, params: params, lineNumber: lineIdx });
        }
    }

    /**
     * Parses a line defined as data line.
     */
    private parseData(line: string, lineIdx: number, programm: Programm) {
        // Use line a string stream
        this.currentLine = new StringStream(line);
        this.currentLine.eatWhitespaces();
 
        // Ingnore empty lines and pure comments
        if (this.currentLine.eol()) return;
        if (this.currentLine.eat(';')) return;

        // Capture symbol to switch to text mode
        if (this.currentLine.match(".text:", true)) {
            this.mode = SourceMode.text;
            return;
        };

        // Eat first non-whitespace symbol (as constant name)
        const w = this.currentLine.eatWhile(/\w/);
        const matches = w.match(syn_label)
        if (!matches || matches[0] !== w)
            throw new CompilerError(
                CompilerErrorCode.illegalNamingScheme,
                w, lineIdx, { from: 0 });

        // Skip
        this.currentLine.eatWhitespaces();

        // Eat second non-whitespace symbol (as size definition)
        const def = this.currentLine.eatWhile(/\w/).toLowerCase();
        if (![ "dd", "db", "dw"].includes(def))
            throw new CompilerError(
                CompilerErrorCode.illegalSizeScheme,
                def, lineIdx
            )
        // Available symbols "DD"(4), "DW"(2), "DB"(1)
        const defSize: number = def === "dd" ? 4 : (def === "dw" ? 2 : 1)

        // Collect raw elements of defSize
        const raw: number[] = []
        while (!this.currentLine.eol()) {
            if (this.currentLine.peek() === ";") break;
            if (this.currentLine.peek() === ",") this.currentLine.next();

            // Clear to prevent triming
            this.currentLine.eatWhitespaces();
            const preEat = this.currentLine.position;

            // Capture strings as components
            if (this.currentLine.peek() === '"') {
                this.currentLine.next(); // Eat first "

                // Eat till terminator "
                const r = this.currentLine.eatWhile((c) => c !== '"');
                if (this.currentLine.eol()) 
                    throw new CompilerError(
                        CompilerErrorCode.missingToken,
                        '"',
                        lineIdx,
                        { from: preEat, to: this.currentLine.position }
                    );
                
                // CString only accepts utf8 1 byte
                if (defSize !== 1)
                    throw new CompilerError(
                        CompilerErrorCode.illegalStringSizeScheme, defSize.toString(10), 
                        lineIdx, { from: preEat, to: this.currentLine.position }
                    );

                // Cast to number (to be interpreted as UInt8)
                raw.push(...Array.from(r).map((c) => Math.min(c.charCodeAt(0), 255)).concat(0));
                this.currentLine.next(); // Eat last "
            } else {
                // Eat till next relevant terminator symbol (triming required)
                const r = this.currentLine.eatWhile((c) => c !== ";" && c !== ",").trim();

                // Break at last ","
                if (r === "") break;
                if (r === "?") {
                    // Undefined memory space
                    raw.push(null);
                } else if (r.includes("*")) {
                    // Expect <number>*<number or ?>
                    const sp = r.split("*");
                    if (sp.length !== 2)
                        throw new CompilerError(
                            CompilerErrorCode.unexpectedToken,
                            r,
                            lineIdx, 
                            { from: preEat, to: this.currentLine.position }
                        );

                    // Cast as int or null (not NaN)
                    const n = this.parseNumber(sp[0], lineIdx, preEat, this.currentLine.position);
                    const v = sp[1] === '?' ? null : this.parseNumber(sp[1], lineIdx, preEat, this.currentLine.position);

                    raw.push(...Array(n).fill(v));
                } else {
                    // In case of emerency, capture as number
                    const asInt = this.parseNumber(r, lineIdx, preEat, this.currentLine.position);

                    raw.push(asInt);
                }
            }
        }

        // Push new constant to memory (no uniq! tested at end)
        programm.data.push(
            new DataConstant(w, defSize, raw, lineIdx)
        );
    }

    /**
     * Parses string to number
     */
    private parseNumber(str: string, lineIdx: number, fromIndex: number, toIndex?: number): number {
        // Test for any valid string format
        str = str.toLowerCase().trim();
        if (str.match(syn_number) === null || str.match(syn_number)[0] !== str) 
            throw new CompilerError(
                CompilerErrorCode.invalidTokenNumber,
                str,
                lineIdx,
                { from: fromIndex, to: toIndex }
            );

        // Use default parse at start
        let num = parseInt(str) || 0;

        // Capture 0b[01]+ format
        if (str.startsWith("0b") && !str.endsWith("h")) 
            num = parseInt(str.substr(2), 2);
        // Capture [01]+B format
        if (str.endsWith("b") && str.substr(0, str.length - 2).match(/[01]+/)[0] === str.substr(0, str.length -2 )) 
            num = parseInt(str, 2);
        // Capture [0-9a-f]+H format
        if (str.endsWith("h"))
            num = parseInt(str, 16)

        if (isNaN(num))
            throw new CompilerError(
                CompilerErrorCode.invalidTokenNumber,
                str,
                lineIdx,
                {
                    from: fromIndex, to: toIndex
                }
            );

        return num;
    }
}
