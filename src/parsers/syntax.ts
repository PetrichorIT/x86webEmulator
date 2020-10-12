import * as CodeMirror from 'codemirror';
import { Lib } from '../lib/lib';
import { syn_number, syn_registers, syn_label, syn_keywords, syn_include, syn_string, syn_export } from './const';

export function initSyntax() {
	CodeMirror.defineMode('x86', function(_config: CodeMirror.EditorConfiguration, parserOptions: any) {
		return {
			startState: () => {
				return { context: 0 };
			},
			token: (stream, state) => {
				if (stream.eatSpace()) return null;

				let isAfterInclude = state.context === 1;
				state.context = 0;

				let w;
				if (stream.eatWhile(/\w/)) {
					w = stream.current().toLowerCase();

					if (w === '@export') return 'def';
					if (syn_keywords.includes(w)) return 'keyword';
					if (syn_number.test(w)) return 'number';
					if (syn_registers.test(w)) return 'var2';
					if (syn_label.test(w)) return 'def';
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
					state.context = 1;
					return 'def';
				} else if (stream.match(syn_export, true)) {
					return 'def';
				} else if (stream.match(syn_string, true)) {
					let token = stream.current();
					token = token.substr(1, token.length - 2);
					if (Lib.libs.includes(token) || !isAfterInclude) {
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
