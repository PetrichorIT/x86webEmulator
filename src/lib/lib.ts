import { App } from '../App';
import { FullPersistentStorage } from '../dom/common';

import fib from './fib';
import { string } from './string';

class LibController {
	private localLibs: string[] = [];
	get libs(): string[] {
		return [ 'fib.h', 'string.h' ].concat(this.localLibs);
	}

	private loadLib(app: App, libName: string, libCode: string) {
		app.parser.parseLib(libName, libCode);
	}

	/**
	 * Loads the defaults libaries to the given app component
	 */
	loadDefaultLibs(app: App) {
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
	 * Loads the custom dynamic libaries from local storage (or cookies)
	 */
	loadLocalLibs(app: App) {
		let libListStr = FullPersistentStorage.getData('_libs_list');
		if (libListStr === '') libListStr = '[]';

		try {
			this.localLibs = JSON.parse(libListStr);
		} catch (e) {
			console.error(e);
			FullPersistentStorage.setData('_libs_list', '[]');
			this.localLibs = [];
		}

		for (const lib of this.localLibs) {
			try {
				const str = FullPersistentStorage.getData('_lib_' + lib);
				if (str === '') {
					// Remove Lib
					FullPersistentStorage.removeData('_lib_' + lib);
					this.localLibs.filter((libName) => libName !== lib);

					continue;
				}

				this.loadLib(app, lib, str);
				console.info(`Loaded local lib "${lib}"`);
			} catch (e) {
				console.error(e);
			}
		}

		FullPersistentStorage.setData('_libs_list', JSON.stringify(this.localLibs));
	}

	/**
	 * Updates or creates a local libary and stores it
	 */
	setLib(app: App, libName: string, libCode: string) {
		this.loadLib(app, libName, libCode);

		if (!this.localLibs.includes(libName)) this.localLibs.push(libName);

		FullPersistentStorage.setData('_libs_list', JSON.stringify(this.localLibs));
		FullPersistentStorage.setData('_lib_' + libName, libCode);
	}
}

export const Lib = new LibController();
