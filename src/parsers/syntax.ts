import * as CodeMirror from 'codemirror';
import { Lib } from '../lib/lib';
import { syn_number, syn_registers, syn_label, syn_keywords, syn_include, syn_string } from './const';

export function initSyntax() {
	CodeMirror.defineMode('x86', function(_config: CodeMirror.EditorConfiguration, parserOptions: any) {
		return {
			startState: () => {
				return undefined;
			},
			token: (stream) => {
				if (stream.eatSpace()) return null;

				let w;
				if (stream.eatWhile(/\w/)) {
					w = stream.current().toLowerCase();

					if (syn_number.test(w)) return 'number';
					if (syn_registers.test(w)) return 'var2';
					if (syn_label.test(w)) return 'def';
					if (syn_keywords.includes(w)) return 'keyword';
				} else if (stream.match(syn_registers, true)) {
					return 'var2';
				} else if (stream.eat(';')) {
					stream.skipToEnd();
					return 'comment';
				} else if (stream.match(syn_number, true)) {
					return 'number';
				} else if (stream.match(syn_label, true)) {
					return 'def';
				} else if (stream.match(syn_include, true)) {
					return 'def';
				} else if (stream.match(syn_string, true)) {
					let token = stream.current();
					token = token.substr(1, token.length - 2);

					console.log(token);
					if (Lib.libs.includes(token)) {
						return 'string';
					} else {
						return 'underline-error';
					}
				} else {
					stream.next();
				}

				return null;
			}
		};
	});
}
