import { App } from '../App';

export class DOMFlag {
	private flagDOM: HTMLInputElement;
	private flagName: string;
	private app: App;

	constructor(app: App, flagName: string) {
		// CREATE DOM

		this.flagName = flagName;
		this.app = app;

		const registerDOM = document.createElement('div');
		registerDOM.classList.add('flag');

		const label = document.createElement('span');
		label.classList.add('label');
		label.innerHTML = flagName.toUpperCase();
		registerDOM.appendChild(label);

		this.flagDOM = document.createElement('input');
		this.flagDOM.type = 'checkbox';
		this.flagDOM.value = 'false';
		this.flagDOM.classList.add('checkbox');
		this.flagDOM.addEventListener('change', () => this.domUpdate());
		registerDOM.appendChild(this.flagDOM);

		document.querySelector('.flags-box').appendChild(registerDOM);

		this.update(app.flags[flagName]);
		app.subscribe(() => this.update(app.flags[flagName]));
	}

	/**
	 * User initiated change of the registers content
	 */
	private domUpdate() {
		this.app.flags[this.flagName] = this.flagDOM.checked;
	}

	/**
	 * Application initiated change due to the end of one instruction cycle
	 */
	private update(value: boolean) {
		this.flagDOM.checked = value;
	}
}

export default DOMFlag;
