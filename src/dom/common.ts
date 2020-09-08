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
		sessionStorage.setItem(key, value);
	} else {
		var d = new Date();
		// Store 1h
		d.setTime(d.getTime() + 1 * 60 * 60 * 1000);
		var expires = 'expires=' + d.toUTCString();
		document.cookie = key + '=' + value + ';' + expires + ';path=/';
	}
}
function getData(key: string): string {
	if (storageAvaiable()) {
		return sessionStorage.getItem(key);
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
	setData: setData,
	getData: getData
};

export default PersistentStorage;
