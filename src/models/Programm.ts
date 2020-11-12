import { App, Command, Label } from "../App";
import Operand, { OperandTypes } from "./Operand";

export class Programm {

    private text: (Command | Label)[];
    private data: DataConstant[];

    constructor(text: (Command | Label)[], data: DataConstant[]) {
        this.text = text;
        this.data = data;
    }

    /**
     * Writes the programm into the memory of the given application.
     * Uses memory from the given space downwards.
     */
    public write(app: App, memoryPosition: number) {

        let pos;

        /// RESOLVE INSTRUCTIONS
        let labelPositions: { [key:string]: number} = {};
        let relPos: number = 0;

        // Extract relative label position from source
        for (let i = 0; i < this.text.length; i++) {
            const element = this.text[i];
            if ((element as Label).label) {
                labelPositions[(element as Label).label] = relPos
            } else {
                relPos += 4;
            }
        }

        // Cut out labels & calulcate required spaec
        const commands: Command[] = this.text.filter((v: Label) => v.label === undefined) as Command[]
        const textPos = memoryPosition - 4*commands.length;                            
        
        /// RESOLVE DATA
        const dataPos = textPos - this.data.reduce((p, dc) => p + dc.totalRequiredMemSpace, 0)
        let dataPositions: { [key: string]: number } = {};
        pos = dataPos;

        // Writes constants to memory
        for (let i = 0; i < this.data.length; i++) {
            const dc = this.data[i];
            dataPositions[dc.name] = pos;
            for (const val of dc.raw) {
                if (dc.memSpace === 1) app.memory.writeUInt8(val || 0, pos);
                if (dc.memSpace === 2) app.memory.writeUInt16LE(val || 0, pos);
                if (dc.memSpace === 4) app.memory.writeUInt32LE(val || 0, pos);

                pos += dc.memSpace;
            }
        }

        // Replace label Operands
        for (let i = 0; i < commands.length; i++) {
            for (let j = 0; j < commands[i].params.length; j++) {
                // Replace label operands with direct jumps
                if (commands[i].params[j].type === OperandTypes.label) {
                    commands[i].params[j] = new Operand(OperandTypes.const, labelPositions[commands[i].params[j].value] + textPos);
                }
                
                // Replace offsets with direct memory addresses
                if (commands[i].params[j].type === OperandTypes.dataOffset) {
                    commands[i].params[j] = new Operand(OperandTypes.const, dataPositions[commands[i].params[j].value]);
                }
            }
        }

        // Writes instructions into application memory
        let idx = app.instructions.length;
        for (const command of commands) {
            app.instructions.push(command);
            app.memory.writeUInt32LE(idx++, pos);
            pos += 4;
        }
    }
}

export class DataConstant {

    public name: string;
    public memSpace: number;
    public raw: number[];

    public get totalRequiredMemSpace(): number {
        return this.memSpace * this.raw.length;
    }

    constructor(name: string, memSpace: number, raw: number[]) {
        this.name = name;
        this.memSpace = memSpace;
        this.raw = raw;
    }
}