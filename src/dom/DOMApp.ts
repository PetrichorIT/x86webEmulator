import * as CodeMirror from 'codemirror';

import { App } from '../App';
import DOMRegister from './DOMRegister';
import DOMMemory from './DOMMemory';
import DOMFlag from './DOMFlag';
import { initSyntax } from '../parsers/syntax';
import SemiPersistentStorage from './common';
import { CompilerError } from '../parsers/const';
import { Lib } from '../lib/lib';
import { DOMSettings } from './DOMSettings';
import { DOMLibaryController } from './DOMLibaryController';
import { LEDRow } from '../io/LEDRow';
import { LeverRow } from '../io/LeverRow';
import { SevenSegmentDisplay } from '../io/SevenSegementDisplay';
import { MatrixKeyboard } from '../io/MatrixKeyboard';
import { PIT } from '../io/PIT';

/**
 * Indicates if a DOMApp is the initial build
 */
let _firstBuild: boolean = true;

export class DOMApp {
	public app: App;
	private registers: { [key: string]: DOMRegister };
	private flags: { [key: string]: DOMFlag };
	private memory: DOMMemory;

	public editor: CodeMirror.EditorFromTextArea;
	private debugBox: HTMLDivElement;

	private compileButton: HTMLButtonElement;
	private pauseButton: HTMLButtonElement;
	private stepButton: HTMLButtonElement;
	private runButton: HTMLButtonElement;

	private fileInputButton: HTMLInputElement;
	private fileDownloadButton: HTMLButtonElement;

	private running: boolean;
	private preferredFilename = 'code.txt';

	// Configguarzion Options
	public instructionDelay: number = 100;
	public speedUpLibaryCode: boolean = true;

	public libaryViewActive: boolean = false;
	public libaryViewSourceBackup: string;
	private libaryViewCloseButton: HTMLButtonElement;

	private subscribers: (() => void)[];
	/**
	 * Creates a DOMApp object that links the given application to the DOM
	 */
	constructor(app: App) {
		this.app = app;
		this.registers = {};
		this.flags = {};
		this.running = false;
		this.subscribers = [];

		// Load libaries first since they are needed on GUI build
		Lib.loadDefaultLibs(this.app);
		Lib.loadLocalLibs(this.app);

		this.buildDebug();
		this.build();
	}

	/**
	 * Adds a new RX like subscriber to the update cycle initialted by change in the app state
	 */
	public subscribe(newSubscriber: () => void) {
		this.subscribers.push(newSubscriber);
	}

	/**
	 * Links the console functions to the debug component
	 */
	private buildDebug() {
		(console as any)._info = console.info;
		console.info = (message?: string, ...optionalParams: any[]): void => {
			this.debug(message, 'info');
			(console as any)._info(message, ...optionalParams);
		};

		(console as any)._error = console.error;
		console.error = (message?: string, ...optionalParams: any[]): void => {
			this.debug(message || '', 'error');
			(console as any)._error(message, ...optionalParams);
		};
	}

	/**
	 * Prints debug output to the debug component in the DOM
	 */
	private debug(message: string, type?: 'error' | 'info') {
		type = type || 'info';
		const art = document.createElement('article');
		art.classList.add(type);
		art.innerHTML =
			`<i class="fas ${type === 'error'
				? 'fa-exclamation-circle'
				: 'fa-info-circle'}" style="padding-right: 10px;"></i>` + message;
		this.debugBox.appendChild(art);

		setTimeout(() => art.remove(), type === 'error' ? 30000 : 10000);
	}

	/**
	 * Links & Creates the DOM Components at first init(_:)
	 */
	private build() {
		// Builds Registers in a dedicated box
		for (const regName in this.app.registers) {
			this.registers[regName] = new DOMRegister(this, regName);
		}

		// Builds Flags in a decdicated box
		for (const flgName in this.app.flags) {
			this.flags[flgName] = new DOMFlag(this, flgName);
		}

		// Builds Memory if not allready done
		if (!this.memory) this.memory = new DOMMemory(this);

		// Initializes the syntax checker for codemirror
		if (_firstBuild) initSyntax();

		// Loads other components
		new DOMSettings(this.app, this);
		new DOMLibaryController(this);

		this.app.ioDevices.push(
			new LEDRow(0x5C, "#leftLED"),
			new LEDRow(0x5D, "#rightLED"),
			new LeverRow(0x58, "#leftLevers"),
			new LeverRow(0x59, "#rightLevers"),
			new SevenSegmentDisplay(0xb0, 0xbb, ".sevenSegmentDisplay"),
			new MatrixKeyboard(0x5a, 0x5b, ".matrixKeyboard"),
			new PIT(0x54, ".pit")
		);

		// Last build step of the info panel.
		// Requires allready build UI to determine the required dropdown height
		this.buildDropdowns()

		// Builds the codemirror editor (with color-scheme matching themes)
		const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
		const textArea = document.getElementById('editor') as HTMLTextAreaElement;
		this.editor = CodeMirror.fromTextArea(textArea, {
			mode: 'x86',
			theme: darkMode ? 'material-darker' : "default",
			lineNumbers: true,
			indentUnit: 4,
			lineNumberFormatter: (i) => '0x' + i.toString(16)
		});

		// Launches the editor with the last snapshot from SessionStorage
		// Primes the editor to remove marks on editing
		this.editor.getDoc().setValue(SemiPersistentStorage.getData('editor:snapshot') || '');
		this.editor.on('inputRead', () => this.onEditorChange());

		// Initilizes and primes the action buttons

		this.compileButton = document.getElementById('compile') as HTMLButtonElement;
		this.compileButton.addEventListener('click', () => this.onCompile());

		this.pauseButton = document.getElementById('pause') as HTMLButtonElement;
		this.pauseButton.addEventListener('click', () => this.onPause());

		this.stepButton = document.getElementById('step') as HTMLButtonElement;
		this.stepButton.addEventListener('click', () => this.onStep());

		this.runButton = document.getElementById('run') as HTMLButtonElement;
		this.runButton.addEventListener('click', async () => await this.onRun());

		this.fileInputButton = document.getElementById('fileInput') as HTMLInputElement;
		this.fileInputButton.addEventListener('change', () => this.onFileInput());

		this.fileDownloadButton = document.getElementById('downloadButton') as HTMLButtonElement;
		this.fileDownloadButton.addEventListener('click', () => this.onDownload());

		this.debugBox = document.getElementById('debug-box') as HTMLDivElement;

		// Build Libary View Button
		this.libaryViewCloseButton = document.getElementById("closeLibaryView") as HTMLButtonElement;
		this.libaryViewCloseButton.hidden = true;
		this.libaryViewCloseButton.addEventListener("click", () => this.libaryViewCloseButtonPressed());

		// Subscribes to the application callback on change
		this.app.onInstructionCycle = () => this.onInstructionCycle();

		_firstBuild = false;
	}

	/**
	 * Handles Dropdowns
	 */
	private buildDropdowns() {		
		// Dropdowns require a ".dropdown" class and an id
		// Header must have id : "id:Header ""
		// Body mist have id : "id:Body"
		document.querySelectorAll(".dropdown").forEach((node) => {
			const id = node.id;
			if (!id) return;

			const storageID = "dropdown:" + id

			// If not set extened is false (after initial configuration)
			let extened = SemiPersistentStorage.getData(storageID) !== "true";
			let header = document.getElementById(id + ":header");
			let body = document.getElementById(id + ":body");

			let title = header.innerHTML;
			let height = body.offsetHeight;

			if (header && body) 
				header.addEventListener("click", () => {

					body.style.paddingTop = extened ? "0px" : "15px";
					body.style.paddingBottom = extened ? "0px" : "5px";
					body.style.height = extened ? "0px" : (height + "px");
					header.innerHTML = extened ? "►" + title : "▼" + title
					extened = !extened;

					height = body.scrollHeight;

					SemiPersistentStorage.setData(storageID, extened ? "true" : "false");
				})

				// Initial configuration
				header.click();
		})
	}

	/**
	 * Shows the libary in the editor (readonly).
	 */
	public libaryViewShowLibary(libaryName: string) {

		if (!this.libaryViewActive) this.libaryViewSourceBackup = this.editor.getValue();

		this.editor.setValue(Lib.getLibCode(libaryName));
		this.editor.setOption("readOnly", true)
		this.libaryViewCloseButton.hidden = false;
		this.libaryViewActive = true;

		{
			this.compileButton.disabled = true;
			this.runButton.disabled = true;
			this.stepButton.disabled = true;
			this.pauseButton.disabled = true;
			this.fileInputButton.disabled = true;
		}
	}

	/**
	 * Returns the editor to edit state.
	 */
	private libaryViewCloseButtonPressed() {
		this.editor.setValue(this.libaryViewSourceBackup)
		this.editor.setOption("readOnly", false);
		this.libaryViewActive = false;
		this.libaryViewCloseButton.hidden = true;

		{
			this.compileButton.disabled = false;
			this.runButton.disabled = false;
			this.stepButton.disabled = false;
			this.pauseButton.disabled = false;
			this.fileInputButton.disabled = false;
		}
	}

	/**
	 * Handels debug / editor updates after the end of an instrcution cycle
	 */
	private onInstructionCycle() {
		
		
		// Only apply markings in step mode or with instruction delay
		if (this.instructionDelay > 0 || this.running === false) {
			this.updateUI();
		}
	}

	/**
	 * Causes UI Updates.
	 */
	private updateUI() {
		this.editor.getDoc().getAllMarks().forEach((m) => m.clear());

		// Current Line Marking 
		let nextInstrIdx = this.app.memory.readUInt32LE(this.app.registers.eip._32);
		if (nextInstrIdx < this.app.instructions.length && nextInstrIdx !== 0) {
			let line = this.app.instructions[nextInstrIdx].lineNumber;
			this.editor.markText({ line, ch: 0 }, { line, ch: 255 }, { css: 'background-color: rgba(17, 165, 175, 0.5);' });
		};

		// Update Components
		this.subscribers.forEach((s) => s());
	}

	/**
	 * Remove markings if editor is changed
	 */
	private onEditorChange() {
		this.editor.getDoc().getAllMarks().forEach((m) => m.clear());
	}

	/**
	 * Handles actions if the compile button is pressed
	 */
	private onCompile() {
		this.editor.getDoc().getAllMarks().forEach((m) => m.clear());

		// Get timestamp of compilation process
		const tsmp = new Date().getMilliseconds() & 0xff;

		try {
			let p = this.app.parser.parse(this.editor.getDoc().getValue());

			this.app.runProgram(p);
			this.updateUI();

			// Save a valid programm in SessionStorage
			SemiPersistentStorage.setData('editor:snapshot', this.editor.getDoc().getValue());
			console.info(`[Parser] Done ... Snapshot $${tsmp} with EIP 0x${this.app.registers.eip._32.toString(16)}`);
		} catch (e) {
			// Catch compiler errors
			if (e.line !== undefined && e.position !== undefined) {
				// Mark faulty code
				let err = e as CompilerError;
				this.editor.markText(
					{ line: err.line, ch: err.position.from },
					{ line: err.line, ch: err.position.to || 255 },
					{ css: 'background-color: rgba(200, 50, 30, 0.5);' }
				);

				console.error(e.message);
			} else {
				// Throw other errors (should not happen)
				throw e;
			}
		}
	}

	/**
	 * Handles actions if the run button is pressed
	 */
	private async onRun() {
		if (this.running) return;
		this.running = true;

		console.info(`Starting run loop at EIP 0x${this.app.registers.eip._32.toString(16)}`);
		
		// Remove markings if in 0ms mode
		if (this.instructionDelay === 0)
			this.editor.getDoc().getAllMarks().forEach((m) => m.clear());

		try {
			// Run programm until stoped / finished (~5ms per cycle on no delay, no lib), (<1ms on lib)
			while (this.running && this.app.instructionCycle()) {
				// If not in lib code or lib code does not required speed up => delay
				if (!this.app.isInLibMode || !this.speedUpLibaryCode) await new Promise((r) => setTimeout(r, this.instructionDelay));
			}
			this.updateUI();
			if (this.running) {
				console.info(`Ended run loop at EIP 0x${this.app.registers.eip._32.toString(16)}`);
			}
		} catch (e) {
			// Catch NOP Error to determine end of run loop
			if (e.message === 'NOP') {
				if (this.running) {
					console.info(`Ended run loop at EIP 0x${this.app.registers.eip._32.toString(16)}`);
				}
			} else {
				console.error(`Runtime error: ${e}`);
			}
		} finally {
			this.running = false;
		}
	}

	/**
	 * Handles actions if the pause button is pressed
	 */
	private onPause() {
		console.info(`Paused run loop at EIP 0x${this.app.registers.eip._32.toString(16)}`);
		this.running = false;

		this.updateUI();
	}

	/**
	 * Handles actions if the step button is pressed
	 */
	private onStep() {
		if (this.running) return;
		console.info(`Stepping to instruction at EIP 0x${this.app.registers.eip._32.toString(16)}`);
		this.app.instructionCycle();
	}

	/**
	 * Reads and intergrates a given file as code input for the editor.
	 */
	private onFileInput() {
		const file = this.fileInputButton.files[0];

		const fr = new FileReader();
		fr.onloadend = (e) => {
			console.info(`Loaded Snapshot from file Client:${file.name}`);
			const content = fr.result;
			this.editor.getDoc().setValue(content as string);
		};

		fr.onerror = (e) => {
			console.error(`Failed to load Snapshot from Client: ${fr.error}`);
		};
		this.preferredFilename = file.name;
		fr.readAsText(file);
	}

	/**
	 * Exports the current content of the editor as textfile, to be downloaded by the user.
	 */
	private onDownload() {
		const prefix = `; x86 Assembler Export\n; Exported from ${location.origin}\n\n`;
		let text = this.editor.getDoc().getValue();
		if (!text.startsWith(prefix)) text = prefix + text;

		const url = URL.createObjectURL(new Blob([ text ], { type: 'octet/stream' }));
		const a = document.createElement('a');
		a.href = url;
		a.download = this.preferredFilename;
		a.click();
		URL.revokeObjectURL(url);
	}
}
