export class Register32 {
	number: number;

	constructor(number: number) {
		this.number = number;
	}

	set _32(value) {
		this.number = value;
	}
	get _32() {
		return this.number;
	}

	set _16(value) {
		console.log(this.number.toString(2), value.toString(2));
		this.number = (this.number & 0xffff0000) | (value & 0x0000ffff);
	}
	get _16() {
		return this.number & 0xffff;
	}

	set _8H(value) {
		this.number = (this.number & 0xffff00ff) | ((value << 8) & 0x0000ff00);
	}
	get _8H() {
		return (this.number & 0xffff) >> 8;
	}

	set _8L(value) {
		this.number = (this.number & 0xffffff00) | (value & 0x000000ff);
	}
	get _8L() {
		return this.number & 0xff;
	}
}

export default Register32;
