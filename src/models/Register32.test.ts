import Register32 from './Register32';

describe('@Test Register Core', () => {
	let reg = new Register32(0);

	it('32 Bit', () => {
		expect(reg._32).toEqual(0);
		reg._32 = 0x0ff00ff0;
		expect(reg._32).toEqual(0x0ff00ff0);
	});

	it('16 Bit', () => {
		expect(reg._16).toEqual(0x0ff0);
		reg._16 = 0;
		expect(reg._16).toEqual(0);
		expect(reg._32).toEqual(0x0ff00000);
	});

	it('8 Bit (H)', () => {
		expect(reg._8H).toEqual(0);
		reg._8H = 0xff;
		expect(reg._8H).toEqual(0xff);
		expect(reg._16).toEqual(0xff00);
	});

	it('8 Bit (L)', () => {
		expect(reg._8L).toEqual(0);
		reg._8L = 0xff;
		expect(reg._8L).toEqual(0xff);
		expect(reg._16).toEqual(0xffff);
	});
});
