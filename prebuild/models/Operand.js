"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Operand = exports.OperandTypes = void 0;
var OperandTypes;
(function (OperandTypes) {
    OperandTypes[OperandTypes["const"] = 0] = "const";
    OperandTypes[OperandTypes["register"] = 1] = "register";
    OperandTypes[OperandTypes["mDirect"] = 2] = "mDirect";
    OperandTypes[OperandTypes["mIndirect"] = 3] = "mIndirect";
})(OperandTypes = exports.OperandTypes || (exports.OperandTypes = {}));
var Operand = /** @class */ (function () {
    function Operand(type, value) {
        this.type = type;
        this.value = value;
        if (type === OperandTypes.const && typeof value === 'number' && value < 0) {
            var buf = Buffer.alloc(4);
            buf.writeInt32LE(value);
            this.value = buf.readUInt32LE();
        }
    }
    Object.defineProperty(Operand.prototype, "isMemory", {
        get: function () {
            return !(this.type === OperandTypes.register || this.type === OperandTypes.const);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Operand.prototype, "requiredMemSize", {
        get: function () {
            if (this.type === OperandTypes.register) {
                if (this.value[0].toLowerCase() === 'e')
                    return 4;
                if (this.value[1].toLowerCase() === 'x')
                    return 2;
                if (this.value[1].toLowerCase() === 'h')
                    return 1;
                if (this.value[1].toLowerCase() === 'l')
                    return 1;
                throw new Error('Unidenified register');
            }
            return undefined;
        },
        enumerable: false,
        configurable: true
    });
    Operand.prototype.getValue = function (app, memSize) {
        if (this.type === OperandTypes.const)
            return this.value;
        if (this.type === OperandTypes.register) {
            if (this.value[0].toLowerCase() === 'e')
                return app.registers[this.value]._32;
            if (this.value[1].toLowerCase() === 'x')
                return app.registers['e' + this.value]._16;
            if (this.value[1].toLowerCase() === 'h')
                return app.registers['e' + this.value[0] + 'x']._8H;
            if (this.value[1].toLowerCase() === 'l')
                return app.registers['e' + this.value[0] + 'x']._8L;
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
    };
    Operand.prototype.getValueInt = function (app, memSize) {
        if (this.type === OperandTypes.const)
            return this.value;
        if (this.type === OperandTypes.register) {
            if (this.value[0].toLowerCase() === 'e')
                return app.registers[this.value]._32;
            if (this.value[1].toLowerCase() === 'x')
                return app.registers['e' + this.value]._16;
            if (this.value[1].toLowerCase() === 'h')
                return app.registers['e' + this.value[0] + 'x']._8H;
            if (this.value[1].toLowerCase() === 'l')
                return app.registers['e' + this.value[0] + 'x']._8L;
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
    };
    Operand.prototype.setValue = function (app, memSize, newValue) {
        if (this.type === OperandTypes.const)
            throw new Error('CONST Cant be set');
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
    };
    return Operand;
}());
exports.Operand = Operand;
exports.default = Operand;
//# sourceMappingURL=Operand.js.map