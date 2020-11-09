export type ConfirmationFunction = (string: string) => boolean;

export class StringStream {
	string: string;
	position: number;

	constructor(string: string) {
		this.string = string;
		this.position = 0;
	}

	/**
	 * Indicates if stream has reached end of line.
	 */
	eol(): boolean {
		return this.position >= this.string.length;
	}

	/**
	 * Indicates if stream is currently at the start of a line.
	 */
	sol(): boolean {
		return this.position === 0;
	}

	/**
	 * Pops the next character in the stream (undefined if not available).
	 */
	next(): string {
		if (this.position < this.string.length) return this.string.charAt(this.position++);
	}

	/**
	 * Returns (not pops) the next character in the stream (undefined of not available).
	 */
	peek(): string | undefined {
		return this.string.charAt(this.position) || undefined;
	}

	/**
	 * Pops (but not returns) the next n charcaters.
	 * Returns if there were n charcaters to be deleted.
	 */
	skip(numberOfChars: number): boolean {
		for (let i = 0; i < numberOfChars; i++) {
			if (this.position < this.string.length) {
				this.position++;
			} else {
				return false;
			}
		}
		return true;
	}

	/**
	 * Consums prefix matching the given Regex and returns the consumed string.
	 */
	eat(match: string | RegExp | ConfirmationFunction): string | undefined {
		let char = this.string.charAt(this.position);
		let ok = false;
		if (typeof match === 'string') {
			ok = char === match;
		} else {
			if (typeof match === 'function') {
				ok = char && match(char);
			} else {
				ok = char && (match.test ? match.test(char) : false);
			}
		}

		if (ok) {
			this.position++;
			return char;
		}
	}

	/**
	 * Kleene iterated eat.
	 */
	eatWhile(match: string | RegExp | ConfirmationFunction): string | undefined {
		let str = '';
		while (this.eat(match) !== undefined) {
			str += this.string.charAt(this.position - 1);
		}
		return str;
	}

	/**
	 * Consums all leading whitespaces.
	 */
	eatWhitespaces() {
		let start = this.position;
		while (/[\s\u00a0]/.test(this.string.charAt(this.position))) ++this.position;
		return this.position > start;
	}

	/**
	 * Matches a regex in the current string an returns a indication of the success.
	 */
	match(pattern: string | RegExp, consume?: boolean, caseInsensitive?: boolean) {
		if (typeof pattern == 'string') {
			let cased = (str: string) => (caseInsensitive ? str.toLowerCase() : str);
			let substr = this.string.substr(this.position, pattern.length);
			if (cased(substr) == cased(pattern)) {
				if (consume !== false) this.position += pattern.length;
				return true;
			}
		} else {
			let match = this.string.slice(this.position).match(pattern);
			if (match && match.index > 0) return null;
			if (match && consume !== false) this.position += match[0].length;
			return match;
		}
	}

	/**
	 * Returns the allready consumed string.
	 */
	current(): string {
		return this.string.slice(0, this.position);
	}

	/**
	 * Returns the remainig string.
	 */
	rest(): string {
		return this.string.substr(this.position);
	}
}
