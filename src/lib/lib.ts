import { App } from '../App';
import { FullPersistentStorage } from '../dom/common';

import fib from './fib';
import { string, stringEntryPoints } from './string';

class LibController {
	private localLibs: string[] = [];
	get libs(): string[] {
		return [ 'fib', 'string' ].concat(this.localLibs);
	}

	private loadLib(app: App, libName: string, libCode: string, libEntryPoints?: string[]) {
		libEntryPoints = libEntryPoints || [ libName ];
		app.parser.parseLib(libName, libCode, libEntryPoints);
	}

	/**
	 * Loads the defaults libaries to the given app component
	 */
	loadDefaultLibs(app: App) {
		try {
			this.loadLib(app, 'fib', fib, [ 'fib' ]);
			console.info('Loaded default lib "fib"');

			this.loadLib(app, 'string', string, stringEntryPoints);
			console.info('Loaded default lib "string"');
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
					FullPersistentStorage.removeData('_lib_' + lib + '_entry_points');
					this.localLibs.filter((libName) => libName !== lib);

					continue;
				}

				let entryPointsStr = FullPersistentStorage.getData('_lib_' + lib + '_entry_points');
				let entryPoints;
				if (entryPointsStr !== '') {
					entryPoints = JSON.parse(entryPointsStr);
				}

				this.loadLib(app, lib, str, entryPoints);
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
	setLib(app: App, libName: string, libCode: string, libEntryPoints?: string[]) {
		this.loadLib(app, libName, libCode, libEntryPoints);

		if (!this.localLibs.includes(libName)) this.localLibs.push(libName);

		FullPersistentStorage.setData('_libs_list', JSON.stringify(this.localLibs));
		FullPersistentStorage.setData('_lib_' + libName, libCode);
		FullPersistentStorage.setData('_lib_' + libName + '_entry_points', JSON.stringify(libEntryPoints));
	}
}

export const Lib = new LibController();
