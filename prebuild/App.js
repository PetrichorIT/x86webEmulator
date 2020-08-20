"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
var Register32_1 = require("./models/Register32");
var App = /** @class */ (function () {
    function App() {
        this.registers = {
            eax: new Register32_1.default(0),
            ebx: new Register32_1.default(0),
            ecx: new Register32_1.default(0),
            edx: new Register32_1.default(0),
            esi: new Register32_1.default(0),
            edi: new Register32_1.default(0),
            esp: new Register32_1.default(0),
            ebp: new Register32_1.default(0)
        };
        this.flags = {
            CF: false,
            PF: false,
            AF: false,
            ZF: false,
            SF: false,
            OF: false
        };
        // 16 bit memory
        this.memory = Buffer.alloc(0xffff);
    }
    App.prototype.writeMemoryBytes = function (adresse, bytes) {
        for (var _i = 0, bytes_1 = bytes; _i < bytes_1.length; _i++) {
            var byte = bytes_1[_i];
            this.memory.writeUInt8(byte, adresse++);
        }
    };
    return App;
}());
exports.App = App;
//# sourceMappingURL=App.js.map