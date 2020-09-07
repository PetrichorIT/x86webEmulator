import * as CodeMirror from 'codemirror';

export function initSyntax() {
	CodeMirror.defineMode('x86', function(_config: CodeMirror.EditorConfiguration, parserOptions: any) {
		let keywords = /^(mov|pop|push|dec|inc|neg|adc|add|sbc|sub|cmp|mul|div|and|not|x?or|shr|shl|nop|call|jmp|jz|jnz|je|jne)/i;
		let registers = /^(eax|ax|ah|al|ebx|bx|bh|bl|ecx|cx|ch|cl|edx|dx|dh|dl|esp|ebp|edi|eip)/i;
		let label = /[A-z]{1,255}:/;
		let number = /(0x[0-9a-fA-F]+|0b[01]+|[\d]+)/;

		return {
			startState: () => {
				return { context: 0 };
			},
			token: (stream, state) => {
				if (stream.eatSpace()) return null;

				let w;
				if (stream.eatWhile(/\w/)) {
					w = stream.current();

					if (number.test(w)) return 'number';
					if (registers.test(w)) return 'var2';
					if (label.test(w)) return 'def';
					if (keywords.test(w)) return 'keyword';
				} else if (stream.match(registers, true)) {
					return 'var2';
				} else if (stream.eat(';')) {
					stream.skipToEnd();
					return 'comment';
				} else if (stream.match(number, true)) {
					return 'number';
				} else if (stream.match(label, true)) {
					stream.skipToEnd();
					return 'def';
				} else {
					stream.next();
				}

				return null;
			}
		};
	});
}
