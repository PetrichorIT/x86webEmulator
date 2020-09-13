import { App } from '../App';
import { FullPersistentStorage } from '../dom/common';

import fib from './fib';
import { string, stringEntryPoints } from './string';

class LibController {
	localLibs: string[] = [];

	/**
	 * Loads a code snippet as Lib.
	 * This lib can than be used by using the #include statement.
	 * @param app
	 * @param name The name used to include the library (also prefix for internal labels)
	 * @param code The code that should be implemented
	 * @param entryPoints The internal labels that should NOT be prefixed
	 */
	private loadLib(app: App, libName: string, libCode: string, libEntryPoints?: string[]) {
		libEntryPoints = libEntryPoints || [ libName ];
		app.parser.parseLib(libName, libCode, libEntryPoints);
	}

	loadDefaultLibs(app: App) {
		try {
			this.loadLib(app, 'fib', fib, [ 'fib' ]);
			this.loadLib(app, 'string', string, stringEntryPoints);
		} catch (e) {
			console.error(e);
		}
	}

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
			} catch (e) {
				console.log(e);
			}
		}

		FullPersistentStorage.setData('_libs_list', JSON.stringify(this.localLibs));
	}

	setLib(app: App, libName: string, libCode: string, libEntryPoints?: string[]) {
		this.loadLib(app, libName, libCode, libEntryPoints);

		if (!this.localLibs.includes(libName)) this.localLibs.push(libName);

		FullPersistentStorage.setData('_libs_list', JSON.stringify(this.localLibs));
		FullPersistentStorage.setData('_lib_' + libName, libCode);
		FullPersistentStorage.setData('_lib_' + libName + '_entry_points', JSON.stringify(libEntryPoints));
	}
}

export const Lib = new LibController();
