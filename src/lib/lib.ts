import { App } from '../App';
import { FullPersistentStorage } from '../dom/common';

import { fib } from './fib';
import { string } from './string';

class LibController {

	/**
	 * User generated libaries.
	 * Loaded from Presistent Storage (LocalStorage or Cookies).
	 */
	private localLibs: string[] = [];

	/**
	 * Indicates if a Lib is local or default static.
	 */
	public isLocalLib(libName: string): boolean {
		return this.localLibs.includes(libName);
	}

	/**
	 * All available libaries including the default libaries.
	 */
	public get libs(): string[] {
		return [ 'fib.h', 'string.h' ].concat(this.localLibs);
	}

	/**
	 * Loads a libary into compiler storage. Retuns LibName
	 */
	private loadLib(app: App, libName: string | null, libCode: string): string {
		const res = app.compiler.parseLib(libName, libCode);

		// If only LibLabel and JMP LibLabel are included
		if (res.text.length === 2 && res.data.length === 0) {			
			FullPersistentStorage.removeData('_lib_' + libName);
			this.localLibs.filter((ln) => ln !== libName);
			delete app.compiler.libs[libName];
		} 
		return res.options["name"];
	}

	/**
	 * Loads the defaults libaries to the given app component.
	 */
	public loadDefaultLibs(app: App) {
		try {
			this.loadLib(app, 'fib.h', fib);
			console.info('Loaded default lib "fib.h"');
		} catch (e) {
			console.error(e);
		}

		try {
			this.loadLib(app, 'string.h', string);
			console.info('Loaded default lib "string.h"');
		} catch (e) {
			console.error(e);
		}
	}

	/**
	 * Loads the custom dynamic libaries from Local storage (or Cookies).
	 */
	public loadLocalLibs(app: App) {
		// Load custom libaries list from storage
		let libListStr = FullPersistentStorage.getData('_libs_list');
		if (libListStr === '') libListStr = '[]';

		try {
			// Parse loaded string to Array<String>
			const parsed = JSON.parse(libListStr)
			if (!Array.isArray(parsed)) throw new Error("Invalid stored raw value for key \"_libs_list\"")
			this.localLibs = parsed;
		} catch (e) {
			// Correct stored local libary codes
			console.error(e);
			FullPersistentStorage.setData('_libs_list', '[]');
			this.localLibs = [];
		}

		for (const lib of this.localLibs) {
			try {
				// Extract libary code from storage
				const str = FullPersistentStorage.getData('_lib_' + lib);
				if (str === '') {
					// Remove empty libaries from storage
					FullPersistentStorage.removeData('_lib_' + lib);
					this.localLibs.filter((libName) => libName !== lib);
					continue;
				}

				// Intergrate raw loaded libary into application
				this.loadLib(app, lib, str);
				console.info(`Loaded local lib "${lib}"`);
			} catch (e) {
				console.error(e);
			}
		}

		// Rewrite libaries list if empty libaries were deleted
		FullPersistentStorage.setData('_libs_list', JSON.stringify(this.localLibs));
	}

	/**
	 * Updates or creates a local libary and stores it. Retuns libName
	 */
	public setLib(app: App, libName: string | null, libCode: string): string {
		libName = this.loadLib(app, libName, libCode);

		if (!this.localLibs.includes(libName)) this.localLibs.push(libName);

		FullPersistentStorage.setData('_libs_list', JSON.stringify(this.localLibs));
		FullPersistentStorage.setData('_lib_' + libName, libCode);

		return libName;
	}

	/**
	 * Removes a usergenerated libary from the application.
	 */
	public removeLib(app: App, libName: string): void {
		if (!this.localLibs.includes(libName)) return;

		delete app.compiler.libs[libName];
		this.localLibs.splice(this.localLibs.findIndex((l) => l === libName), 1);

		FullPersistentStorage.setData("_libs_list", JSON.stringify(this.localLibs));
		FullPersistentStorage.removeData("_lib_" + libName);
	}

	/**
	 * Returns the raw source code of the given libary (either from local storage or from default consts).
	 */
	public getLibCode(libName: string): string {
		if (this.localLibs.includes(libName))
			return FullPersistentStorage.getData("_lib_" + libName);
		if (libName === "string.h")
			return string;
		if (libName === "fib.h")
			return fib;
	}
}

export const Lib = new LibController();
