import { App } from './App';
import { Operand, OperandTypes } from './models/Operand';
import * as x86 from './x86';

const app = new App(x86);

app.runProgram(
	[
		{ name: 'mov', params: [ new Operand(OperandTypes.register, 'eax'), new Operand(OperandTypes.const, 0xff) ] },
		{ name: 'mov', params: [ new Operand(OperandTypes.register, 'ebx'), new Operand(OperandTypes.const, 0x01) ] },

		{
			name: 'dec',
			params: [ new Operand(OperandTypes.register, 'eax') ]
		}
	],
	0x4
);

app.instructionCycle();
app.instructionCycle();
app.instructionCycle();
console.log(app);
