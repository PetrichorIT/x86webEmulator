import * as CodeMirror from 'codemirror';

export const syn_keywords = /^(exit|mov|pop|push|dec|inc|neg|adc|add|sbc|sub|cmp|mul|div|and|not|x?or|shr|shl|nop|call|ret|jmp|jz|jnz|je|jne)/i;
export const syn_registers = /^(eax|ax|ah|al|ebx|bx|bh|bl|ecx|cx|ch|cl|edx|dx|dh|dl|esp|ebp|edi|eip)/i;

export function initSyntax() {
	CodeMirror.defineMode('x86', function(_config: CodeMirror.EditorConfiguration, parserOptions: any) {
		let label = /[A-z]+:/g;
		let include = /#include/;
		let string = /"[A-z.]+"/;
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
					if (syn_registers.test(w)) return 'var2';
					if (label.test(w)) return 'def';
					if (syn_keywords.test(w)) return 'keyword';
				} else if (stream.match(syn_registers, true)) {
					return 'var2';
				} else if (stream.eat(';')) {
					stream.skipToEnd();
					return 'comment';
				} else if (stream.match(number, true)) {
					return 'number';
				} else if (stream.match(label, true)) {
					return 'def';
				} else if (stream.match(include, true)) {
					return 'def';
				} else if (stream.match(string, true)) {
					return 'string';
				} else {
					stream.next();
				}

				return null;
			}
		};
	});
}
