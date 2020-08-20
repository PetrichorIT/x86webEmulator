"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adc = exports.add = void 0;
function bitMask(memSize) {
    switch (memSize) {
        case 1:
            return 0xff;
        case 2:
            return 0xffff;
        case 4:
            return 0xffffffff;
    }
}
function add(app, params) {
    var dest = params[0];
    var src = params[1];
    if (dest.isMemory && src.isMemory)
        throw new Error('Mem2Mem');
    var memSize = dest.requiredMemSize || src.requiredMemSize;
    console.log(memSize);
    var lhs = src.getValueInt(app, memSize);
    var rhs = dest.getValueInt(app, memSize);
    var res = lhs & +rhs;
    var resT = (lhs + rhs) & bitMask(memSize);
    app.flags.ZF = resT === 0;
    app.flags.CF = resT !== res;
    var resTNeg = resT < 0;
    app.flags.SF = resTNeg;
    // app.flags.OF = ()
    dest.setValue(app, memSize, resT);
}
exports.add = add;
function adc(app, params) {
    var dest = params[0];
    var src = params[1];
    if (dest.isMemory && src.isMemory)
        throw new Error('Mem2Mem');
    var memSize = dest.requiredMemSize || src.requiredMemSize;
    var lhs = src.getValueInt(app, memSize);
    var rhs = dest.getValueInt(app, memSize);
    var res = lhs & +rhs & +(app.flags.CF ? 1 : 0);
    var resT = (lhs + rhs) & bitMask(memSize);
    app.flags.ZF = resT === 0;
    app.flags.CF = resT !== res;
    app.flags.SF = resT < 0;
    // app.flags.OF = ()
    dest.setValue(app, memSize, resT);
}
exports.adc = adc;
//# sourceMappingURL=arithmetic.js.map