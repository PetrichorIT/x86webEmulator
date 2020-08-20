"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pop = exports.push = exports.mov = void 0;
function mov(app, params) {
    var dest = params[0];
    var src = params[1];
    if (dest.isMemory && src.isMemory)
        throw new Error('Mem2Mem');
    var memSize = dest.requiredMemSize || src.requiredMemSize;
    var val = src.getValue(app, memSize);
    dest.setValue(app, memSize, val);
}
exports.mov = mov;
function push(app, params) {
    var src = params[0];
    if (src.isMemory)
        throw new Error('Mem2Mem');
    if (src.requiredMemSize !== 4)
        throw new Error('No');
    app.registers.esp._32 -= 4;
    app.memory.writeUInt32LE(src.getValue(app, 4), app.registers.esp._32);
}
exports.push = push;
function pop(app, params) {
    var src = params[0];
    if (src.isMemory)
        throw new Error('Mem2Mem');
    if (src.requiredMemSize !== 4)
        throw new Error('No');
    var val = app.memory.readUInt32LE(app.registers.esp._32);
    src.setValue(app, 4, val);
    app.registers.esp._32 += 4;
}
exports.pop = pop;
//# sourceMappingURL=transport.js.map