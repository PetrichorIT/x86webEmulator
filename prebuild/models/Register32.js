"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Register32 = void 0;
var Register32 = /** @class */ (function () {
    function Register32(number) {
        this.number = number;
    }
    Object.defineProperty(Register32.prototype, "_32", {
        get: function () {
            return this.number;
        },
        set: function (value) {
            this.number = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Register32.prototype, "_16", {
        get: function () {
            return this.number & 0xffff;
        },
        set: function (value) {
            console.log(this.number.toString(2), value.toString(2));
            this.number = (this.number & 0xffff0000) | (value & 0x0000ffff);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Register32.prototype, "_8H", {
        get: function () {
            return (this.number & 0xffff) >> 8;
        },
        set: function (value) {
            this.number = (this.number & 0xffff00ff) | ((value << 8) & 0x0000ff00);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Register32.prototype, "_8L", {
        get: function () {
            return this.number & 0xff;
        },
        set: function (value) {
            this.number = (this.number & 0xffffff00) | (value & 0x000000ff);
        },
        enumerable: false,
        configurable: true
    });
    return Register32;
}());
exports.Register32 = Register32;
exports.default = Register32;
//# sourceMappingURL=Register32.js.map