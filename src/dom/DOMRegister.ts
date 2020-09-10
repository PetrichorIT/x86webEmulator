import Register32 from '../models/Register32';
import { App } from '../App';

export class DOMRegister {
	private byte3: HTMLInputElement;
	private byte2: HTMLInputElement;
	private byte1: HTMLInputElement;
	private byte0: HTMLInputElement;

	private register: Register32;

	constructor(app: App, registerName: string) {
		// CREATE DOM

		this.register = app.registers[registerName];

		const registerDOM = document.createElement('div');
		registerDOM.classList.add('register');

		const label = document.createElement('span');
		label.classList.add('label');
		label.innerHTML = registerName.toUpperCase();
		registerDOM.appendChild(label);

		this.byte3 = document.createElement('input');
		this.byte3.type = 'text';
		this.byte3.value = '00';
		this.byte3.classList.add('byte');
		this.byte3.addEventListener('input', () => this.domUpdate());
		registerDOM.appendChild(this.byte3);

		this.byte2 = document.createElement('input');
		this.byte2.type = 'text';
		this.byte2.value = '00';
		this.byte2.classList.add('byte');
		this.byte2.addEventListener('input', () => this.domUpdate());
		registerDOM.appendChild(this.byte2);

		this.byte1 = document.createElement('input');
		this.byte1.type = 'text';
		this.byte1.value = '00';
		this.byte1.classList.add('byte');
		this.byte1.addEventListener('input', () => this.domUpdate());
		registerDOM.appendChild(this.byte1);

		this.byte0 = document.createElement('input');
		this.byte0.type = 'text';
		this.byte0.value = '00';
		this.byte0.classList.add('byte');
		this.byte0.addEventListener('input', () => this.domUpdate());
		registerDOM.appendChild(this.byte0);

		document.querySelector('.registers-box').appendChild(registerDOM);
		// LINK DOM

		this.update(this.register._32);
		app.subscribe(() => this.update(app.registers[registerName]._32));
	}

	private domUpdate() {
		const b3 = this.byte3.value.substr(this.byte3.value.length - 2, 2);
		const b2 = this.byte2.value.substr(this.byte2.value.length - 2, 2);
		const b1 = this.byte1.value.substr(this.byte1.value.length - 2, 2);
		const b0 = this.byte0.value.substr(this.byte0.value.length - 2, 2);

		let num = parseInt(b3 + b2 + b1 + b0, 16);
		if (isNaN(num)) throw new Error('A');

		this.register._32 = num;
	}

	private update(value: number) {
		const hex = value.toString(16);
		const filledString = '0'.repeat(8 - hex.length) + hex;

		this.byte3.value = filledString.substr(0, 2);
		this.byte2.value = filledString.substr(2, 2);
		this.byte1.value = filledString.substr(4, 2);
		this.byte0.value = filledString.substr(6, 2);
	}
}

export default DOMRegister;
