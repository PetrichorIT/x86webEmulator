import Operand, { OperandTypes } from './Operand';

describe('@Test Operand Core', () => {
	it('Int to UInt passing', () => {
		let op = new Operand(OperandTypes.const, -1);
		expect((op as any).value).not.toEqual(-1);
	});
});
