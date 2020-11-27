// Time interval that a edit is stored if not loaded in between
const maxCookieLife = 60 * 60 * 1000;

// Check if sessionStorage is avilable
function storageAvaiable(storage: Storage) {
	if (typeof storage !== 'undefined') {
		try {
			storage.setItem('__storage_test', 'yes');
			if (storage.getItem('__storage_test') === 'yes') {
				storage.removeItem('__storage_test');
				return true;
			}
		} catch (e) {}
	}
	return false;
}

function setDataSemi(key: string, value: string): void {
	setData(key, value, sessionStorage);
}
function setDataFull(key: string, value: string): void {
	setData(key, value, localStorage);
}

function setData(key: string, value: string, st: Storage): void {
	if (storageAvaiable(st)) {
		st.setItem(key, value);
	} else {
		var d = new Date();
		d.setTime(d.getTime() + maxCookieLife);
		var expires = 'expires=' + d.toUTCString();
		document.cookie = key + '=' + value + ';' + expires + ';path=/';
	}
}

function getDataSemi(key: string): string {
	return getData(key, sessionStorage);
}

function getDataFull(key: string): string {
	return getData(key, localStorage);
}

function getData(key: string, st: Storage): string {
	if (storageAvaiable(st)) {
		return st.getItem(key) || '';
	} else {
		var name = key + '=';
		var decodedCookie = decodeURIComponent(document.cookie);
		var ca = decodedCookie.split(';');
		for (var i = 0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			}
		}
		return '';
	}
}

function removeDataSemi(key: string): void {
	removeData(key, sessionStorage);
}

function removeDataFull(key: string): void {
	removeData(key, localStorage);
}

function removeData(key: string, st: Storage) {
	if (storageAvaiable(st)) {
		st.removeItem(key);
		st.removeItem(key + '_timestamp');
	} else {
		document.cookie = key + '=; Max-Age=-99999999;';
	}
}

export const SemiPersistentStorage = {
	/**
	 * Stores a string in a local semi persistent storage container.
	 * Expires after 1h
	 */
	setData: setDataSemi,
	/**
	 * Loads a string from a local semi persistent storage container
	 * Returns "" if not existent
	 */
	getData: getDataSemi,
	/**
	 * Remove a string from local semi persistent storage container
	 */
	removeData: removeDataSemi
};

export const FullPersistentStorage = {
	/**
	 * Stores a string in a local persistent storage container.
	 * Expires after 1h
	 */
	setData: setDataFull,
	/**
	 * Loads a string from a local persistent storage container
	 * Returns "" if not existent
	 */
	getData: getDataFull,
	/**
	 * Remove a string from local persistent storage container
	 */
	removeData: removeDataFull
};

export default SemiPersistentStorage;
