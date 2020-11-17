import { CompilerError, CompilerErrorCode } from "./Common";
import { Compiler } from "./Compiler";

describe("@Test Compiler:parse(_:)", () => {

    let compiler: Compiler = new Compiler(undefined);

    it("#1 (only text, valid)", () => {
        try {
            let res = compiler.parse(`
            .text:
                MOV EAX, 123
                MOV EBX, 123
                MOV [1], ECX
                ADD EAX, EBX
            a:
                SHR EBX, 1
                JNE a
                RET
            `)
            expect(res.text).toHaveLength(8)
            expect(res.text[4]).toHaveProperty("label", "a");
        } catch (e) {
            fail(e);
        }
    })

    it("#2 (only text, valid)", () => {
        try {
            let res = compiler.parse(`
            .text:
                BT EAX, 13
                CLC
                SBB [1], ECX
                ADD EAX, EBX
            b:
                SHR EBX, 0x00123123
                JNE b
                RET
            `)
            expect(res.text).toHaveLength(8)
            expect(res.text[4]).toHaveProperty("label", "b");
        } catch (e) {
            fail(e);
        }
    })

    it("#3 (only text, invalid operand)", () => {
        try {
            let res = compiler.parse(`
            .text:
                BT EAX, 133
                CLC
                SBB [1], ECX
                ADD EAX, EBX
            b:
                SHR EBX, 0x00123123
                JNE b
                RET
            `)
            fail();
        } catch (e) {
            expect(e.code === CompilerErrorCode.illegalOperands).toBe(true);
        }
    })

    it("#4 (only text, invalid operand)", () => {
        try {
            let res = compiler.parse(`
            .text:
                BT EAX, 12
                CLC EAX, 1, 1
                SBB [1], ECX
                ADD EAX, EBX
            b:
                SHR EBX, 0x00123123
                JNE b
                RET
            `)
            fail();
        } catch (e) {
            expect(e.code === CompilerErrorCode.illegalOperands).toBe(true);
        }
    })

    it("#5 (only text, invalid operand)", () => {
        try {
            let res = compiler.parse(`
            .text:
                BT EAX, 3
                CLC
                SBB [1], ECX
                ADD EAX, EBX
            b:
                SHR EBX, 0x00123123
                JNE a
                RET
            `)
            fail();
        } catch (e) {
            expect(e.code === CompilerErrorCode.undefinedLabel).toBe(true);
        }
    })
})