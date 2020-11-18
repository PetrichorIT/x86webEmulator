import { Command, Label } from "../App";
import { OperandTypes } from "../models/Operand";
import { CompilerError, CompilerErrorCode } from "./Common";
import { Compiler } from "./Compiler";

describe("@Test Compiler:parse(_:) (core)", () => {

    let compiler: Compiler;

    it("#1 Compiler Init", () => {
        expect(() => compiler = new Compiler(undefined)).not.toThrow();
    })

    it("#2 Compiler (core) state", () => {
        expect(compiler.libs).toStrictEqual({});
        expect(compiler.debugMode).toBe(false);
    })

    /// ERROR CODE TESTING

    it("#03 Invalid (C001 - Invalid instruction)", () => {
        try {
            compiler.parse(`
            .text:
                MOV EAX, 123
                WRONG 123, EAX
                SUB EAX, EBX
            `);
            fail("Expected CompilerError");
        } catch (e) {
            let err = e as CompilerError;
            expect(err.code).toBe(CompilerErrorCode.invalidInstuction);
            expect(err.line).toBe(3);
        }
    });

    it("#04 Invalid (C002 - Invalid token - direct memory)", () => {
        try {
            compiler.parse(`
            .text:
                MOV EAX, 123
                MOV [123hsd], 123
                SUB EAX, EBX
            `);
            fail("Expected CompilerError");
        } catch (e) {
            let err = e as CompilerError;
            expect(err.code).toBe(CompilerErrorCode.invalidTokenDirectMemory);
            expect(err.line).toBe(3);
        }
    });

    it("#05 Invalid (C003 - Invalid token number)", () => {
        try {
            compiler.parse(`
            .text:
                MOV EAX, 123
                MOV 123hsd, EAX
                SUB EAX, EBX
            `);
            fail("Expected CompilerError");
        } catch (e) {
            let err = e as CompilerError;
            expect(err.code).toBe(CompilerErrorCode.invalidTokenNumber);
            expect(err.line).toBe(3);
        }
    });

    it("#06 Invalid (C004 - Invalid token register)", () => {
        try {
            compiler.parse(`
            .text:
                MOV EAX, 123
                MOV EAX, [EAX][NOREG]
                SUB EAX, EBX
            `);
            fail("Expected CompilerError");
        } catch (e) {
            let err = e as CompilerError;
            expect(err.code).toBe(CompilerErrorCode.invalidTokenRegister);
            expect(err.line).toBe(3);
        }
    });

    it("#07 Invalid (C005 - Unexpected Token)", () => {
        try {
            compiler.parse(`
            .data:
                verzoe DD ?
                try DD 2*2*?
                ; Comment
            `);
            fail("Expected CompilerError");
        } catch (e) {
            let err = e as CompilerError;
            expect(err.code).toBe(CompilerErrorCode.unexpectedToken);
            expect(err.line).toBe(3);
        }
    });

    it("#08 Invalid (C009 - Missing Token)", () => {
        try {
            compiler.parse(`
            .text:
                BT EAX, 12
                MOV EAX, [EDX
            `);
            fail("Expected CompilerError");
        } catch (e) {
            let err = e as CompilerError;
            expect(err.code).toBe(CompilerErrorCode.missingToken);
            expect(err.line).toBe(3);
        }
    });

    it("#09 Invalid (C010 - Missing Libary Idefentifier)", () => {
        try {
            compiler.parse(`
            #include
            .text:
            `);
            fail("Expected CompilerError");
        } catch (e) {
            let err = e as CompilerError;
            expect(err.code).toBe(CompilerErrorCode.missingLibaryIdentifier);
            expect(err.line).toBe(1);
        }
    });

    it("#10 Invalid (C011 - Unkown Libary Idefentifier)", () => {
        try {
            compiler.parse(`
            #include "noLibsLoadedInThisCompilerAnyway"
            .text:
            `);
            fail("Expected CompilerError");
        } catch (e) {
            let err = e as CompilerError;
            expect(err.code).toBe(CompilerErrorCode.unkownLibaryIdentifier);
            expect(err.line).toBe(1);
        }
    });

    it("#11 Invalid (C020 - Illegal label redefintion)", () => {
        try {
            compiler.parse(`
            .text:
                a:
                    MOV EAX, 123
                a:
                    MOV EBX, 123
            `);
            fail("Expected CompilerError");
        } catch (e) {
            let err = e as CompilerError;
            expect(err.code).toBe(CompilerErrorCode.illegalLabelRedefintion);
            expect(err.line).toBe(4);
        }
    });

    it("#12 Invalid (C021 - Missing label defintion)", () => {
        try {
            compiler.parse(`
            .text:
                a:
                    MOV EAX, 123
                    JMP b
            `);
            fail("Expected CompilerError");
        } catch (e) {
            let err = e as CompilerError;
            expect(err.code).toBe(CompilerErrorCode.undefinedLabel);
            expect(err.line).toBe(4);
        }
    });

    it("#13 Invalid (C022 - Illegal label)", () => {
        try {
            compiler.parse(`
            .text:
                __someLabel:
                    MOV EAX, 123
                    JMP b
            `);
            fail("Expected CompilerError");
        } catch (e) {
            let err = e as CompilerError;
            expect(err.code).toBe(CompilerErrorCode.illegalLabel);
            expect(err.line).toBe(2);
        }
    });

    it("#14 Invalid (C030 - Illegal constant redefintion)", () => {
        try {
            compiler.parse(`
            .data:
                a DD ?
                a DD ?
            `);
            fail("Expected CompilerError");
        } catch (e) {
            let err = e as CompilerError;
            expect(err.code).toBe(CompilerErrorCode.illegalConstantRedefintion);
            expect(err.line).toBe(3);
        }
    });

    it("#15 Invalid (C031 - Missing constant defintion)", () => {
        try {
            compiler.parse(`
            .text:
                MOV EDI, OFFSET b
            .data:
                a DD ?
            `);
            fail("Expected CompilerError");
        } catch (e) {
            let err = e as CompilerError;
            expect(err.code).toBe(CompilerErrorCode.undefinedConstant);
            expect(err.line).toBe(2);
        }
    });

    it("#16 Invalid (C032 - Illegal naming scheme)", () => {
        try {
            compiler.parse(`
            .data:
                123a DD ?
            `);
            fail("Expected CompilerError");
        } catch (e) {
            let err = e as CompilerError;
            expect(err.code).toBe(CompilerErrorCode.illegalNamingScheme);
            expect(err.line).toBe(2);
        }
    });

    it("#17 Invalid (C033 - Illegal size scheme)", () => {
        try {
            compiler.parse(`
            .data:
                a DA ?
            `);
            fail("Expected CompilerError");
        } catch (e) {
            let err = e as CompilerError;
            expect(err.code).toBe(CompilerErrorCode.illegalSizeScheme);
            expect(err.line).toBe(2);
        }
    });

    it("#18 Invalid (C034 - Illegal string scheme)", () => {
        try {
            compiler.parse(`
            .data:
                a DD "string"
            `);
            fail("Expected CompilerError");
        } catch (e) {
            let err = e as CompilerError;
            expect(err.code).toBe(CompilerErrorCode.illegalStringSizeScheme);
            expect(err.line).toBe(2);
        }
    });

    it("#19 Invalid (C040 - Illegal operands)", () => {
        try {
            compiler.parse(`
            .text:
                BT EAX, 123
            `);
            fail("Expected CompilerError");
        } catch (e) {
            let err = e as CompilerError;
            expect(err.code).toBe(CompilerErrorCode.illegalOperands);
            expect(err.line).toBe(2);
        }
    })

    it("#20 Invalid (C090 - Invalid global symbol)", () => {
        try {
            compiler.parse(`
            .asdasdads
            `);
            fail("Expected CompilerError");
        } catch (e) {
            let err = e as CompilerError;
            expect(err.code).toBe(CompilerErrorCode.invalidGlobalSymbol);
            expect(err.line).toBe(1);
        }
    });

    it("#21 Invalid (C090 - Missing global value defintion)", () => {
        try {
            compiler.parse(`
            name: 
            .text:
            `);
            fail("Expected CompilerError");
        } catch (e) {
            let err = e as CompilerError;
            expect(err.code).toBe(CompilerErrorCode.missingGlobalOptionsDefintion);
            expect(err.line).toBe(1);
        }
    });

    /// VALID

    it("#22 Valid (text: core instructions)", () => {
        try {
            const res = compiler.parse(`
            .text:
                MOV EAX, 123
                SUB EBX, EAX
                MOV DX, AX
                MOV EAX, 123
                ADD AH, BH
            `);
            expect(res.text).toHaveLength(5);
            expect(res.data).toHaveLength(0);
            expect((res.text[4] as Command).name === "add");
        } catch (e) {
            fail("Unexpected Error: " + e);
        }
    })

    it("#23 Valid (text: core instructions & label)", () => {
        try {
            const res = compiler.parse(`
            .text:
            a:
                MOV EAX, 123
                SUB EBX, EAX
                MOV DX, AX
                MOV EAX, 123
                ADD AH, BH
                JMP a
            `);
            expect(res.text).toHaveLength(7);
            expect(res.data).toHaveLength(0);
            expect((res.text[5] as Command).name === "add");
            expect((res.text[6] as Command).params[0].type === OperandTypes.label);
            expect((res.text[0] as Label).label === "a");
        } catch (e) {
            fail("Unexpected Error: " + e);
        }
    });

    it("#24 Valid (text: all instructions & label)", () => {
        try {
            const res = compiler.parse(`
            .text:
            a:
                MOV EAX, 123
                SUB EBX, EAX
                MOV DX, AX
                MOV EAX, 123
                OUT 0x66, AL
                JMP a
            `);
            expect(res.text).toHaveLength(7);
            expect(res.data).toHaveLength(0);
            expect((res.text[5] as Command).name === "out");
            expect((res.text[6] as Command).params[0].type === OperandTypes.label);
            expect((res.text[0] as Label).label === "a");
        } catch (e) {
            fail("Unexpected Error: " + e);
        }
    });

    it("#25 Valid (text: all instructions & memory)", () => {
        try {
            const res = compiler.parse(`
            .text:
            a:
                MOV EAX, 123
                SUB EAX, EAX
                MOV [DX][CX], AX
                MOV [EAX], 123
                MOV [0x66], AL
                JMP a
            `);
            expect(res.text).toHaveLength(7);
            expect(res.data).toHaveLength(0);
            expect((res.text[3] as Command).params[0].type === OperandTypes.mDIndexed);
            expect((res.text[4] as Command).params[0].type === OperandTypes.mIndirect);
            expect((res.text[5] as Command).params[0].type === OperandTypes.mDirect);
            expect((res.text[6] as Command).params[0].type === OperandTypes.label);
            expect((res.text[0] as Label).label === "a");
        } catch (e) {
            fail("Unexpected Error: " + e);
        }
    });

    it("#26 Valid (data: defined constants)", () => {
        try {
            const res = compiler.parse(`
            .data:
                a DB 0x67
                aa DB 0x55, 0x56, 0x57
                b DW 0x12
                c DD 0x12
            `);
            expect(res.text).toHaveLength(0);
            expect(res.data).toHaveLength(4);

            expect(res.data[0].raw).toStrictEqual([ 0x67 ]);
            expect(res.data[0].memSpace).toBe(1);

            expect(res.data[1].raw).toStrictEqual([ 0x55, 0x56, 0x57 ]);
            expect(res.data[1].memSpace).toBe(1);

            expect(res.data[2].raw).toStrictEqual([ 0x12 ]);
            expect(res.data[2].memSpace).toBe(2);

            expect(res.data[3].raw).toStrictEqual([ 0x12 ]);
            expect(res.data[3].memSpace).toBe(4);
        } catch (e) {
            fail("Unexpected Error: " + e);
        }
    });

    it("#27 Valid (data: varying defined constants)", () => {
        try {
            const res = compiler.parse(`
            .data:
                a DB ?
                b DB 2*?
                c DW ?
                d DD ?
            `);
            expect(res.text).toHaveLength(0);
            expect(res.data).toHaveLength(4);

            expect(res.data[0].raw).toStrictEqual([ null ]);
            expect(res.data[0].memSpace).toBe(1);

            expect(res.data[1].raw).toStrictEqual([ null, null ]);
            expect(res.data[1].memSpace).toBe(1);

            expect(res.data[2].raw).toStrictEqual([ null ]);
            expect(res.data[2].memSpace).toBe(2);

            expect(res.data[3].raw).toStrictEqual([ null ]);
            expect(res.data[3].memSpace).toBe(4);
        } catch (e) {
            fail("Unexpected Error: " + e);
        }
    });

    it("#28 Valid (data: varying defined constants)", () => {
        try {
            const res = compiler.parse(`
            .data:
                a DB "Hello World"
            `);
            expect(res.text).toHaveLength(0);
            expect(res.data).toHaveLength(1);

            expect(res.data[0].raw).toStrictEqual(Array.from("Hello World").map((c) => c.charCodeAt(0)).concat(0));
            expect(res.data[0].memSpace).toBe(1);
        } catch (e) {
            fail("Unexpected Error: " + e);
        }
    });

    it("#29 Valid (data & text: OFFSET)", () => {
        try {
            const res = compiler.parse(`
            .text:
                MOV EDI , OFFSET a
            .data:
                a DB "Hello World"
            `);
            expect(res.text).toHaveLength(1);
            expect(res.data).toHaveLength(1);

            expect(res.data[0].raw).toStrictEqual(Array.from("Hello World").map((c) => c.charCodeAt(0)).concat(0));
            expect(res.data[0].memSpace).toBe(1);

            expect((res.text[0] as Command).params[1].type).toBe(OperandTypes.dataOffset);
        } catch (e) {
            fail("Unexpected Error: " + e);
        }
    });

    it("#30 Valid (data & text: REFRENCE)", () => {
        try {
            const res = compiler.parse(`
            .text:
                MOV [a], 0x123
            .data:
                a DB "Hello World"
            `);
            expect(res.text).toHaveLength(1);
            expect(res.data).toHaveLength(1);

            expect(res.data[0].raw).toStrictEqual(Array.from("Hello World").map((c) => c.charCodeAt(0)).concat(0));
            expect(res.data[0].memSpace).toBe(1);

            expect((res.text[0] as Command).params[0].type).toBe(OperandTypes.dataMReference);
        } catch (e) {
            fail("Unexpected Error: " + e);
        }
    });
})