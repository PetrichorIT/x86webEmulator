// Time interval that a edit is stored if not loaded in between
const _storageTimeToLife = 60 * 60 * 1000;

// Check if sessionStorage is avilable
function storageAvaiable() {
	if (typeof sessionStorage !== 'undefined') {
		try {
			sessionStorage.setItem('__storage_test', 'yes');
			if (sessionStorage.getItem('__storage_test') === 'yes') {
				sessionStorage.removeItem('__storage_test');
				return true;
			}
		} catch (e) {}
	}
	return false;
}

function setData(key: string, value: string): void {
	if (storageAvaiable()) {
		sessionStorage.setItem(key + '_timestamp', Date.now().toString());
		sessionStorage.setItem(key, value);
	} else {
		var d = new Date();
		d.setTime(d.getTime() + _storageTimeToLife);
		var expires = 'expires=' + d.toUTCString();
		document.cookie = key + '=' + value + ';' + expires + ';path=/';
	}
}

function getData(key: string): string {
	if (storageAvaiable()) {
		let d = parseInt(sessionStorage.getItem(key + '_timestamp'));

		if (Date.now() - d > _storageTimeToLife) {
			sessionStorage.removeItem(key);
			sessionStorage.removeItem(key + '_timestamp');
			return '';
		} else {
			// Update timestamp
			sessionStorage.setItem(key + '_timestamp', Date.now().toString());
		}

		return sessionStorage.getItem(key) || '';
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

export const PersistentStorage = {
	/**
	 * Stores a string in a local persistent storage container.
	 * Expires after 1h
	 */
	setData: setData,
	/**
	 * Loads a string from a local persisten storage container
	 * Returns "" if not existent
	 */
	getData: getData
};

export default PersistentStorage;
