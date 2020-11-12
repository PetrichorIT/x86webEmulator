import * as CodeMirror from 'codemirror';
import { Lib } from '../lib/lib';
import { syn_number, syn_registers, syn_label, syn_keywords, syn_include, syn_string, syn_export } from './const';

export function initSyntax() {
	CodeMirror.defineMode('x86', function(_config: CodeMirror.EditorConfiguration, parserOptions: any) {
		return {
			startState: () => {
				return { context: 0, gotKeyword: false };
			},
			token: (stream, state) => {
				// Reset on each line
				if (stream.sol()) state.gotKeyword = false;

				// Eat unnessary lines
				if (stream.eatSpace()) return null;

				// Prepare string check if is libary include
				let isAfterInclude = state.context === 1;
				state.context = 0;

				// Extract word till whitespace
				let w;
				if (stream.eatWhile(/\w/)) {
					w = stream.current().toLowerCase();

					// Check for label definition
					if (stream.peek() === ":") {
						w += stream.next();
						if (syn_label.test(w)) return 'def';
						return null;
					}

					// Check for preprocessor
					if (w === '@export') return 'def';
					
					// Check for keyword (set flag if found)
					if (syn_keywords.includes(w)) {
						state.gotKeyword = true;
						return 'keyword';
					}

					// Check for string like
					if (/[A-z][A-z0-9_]*/.test(w)) {
						// Capture prefixed numbers
						if (w.startsWith("0b") || w.startsWith("0x")) return "number"
						// Capture registers
						if (syn_registers.test(w)) return 'var2';
						// Assume label reference if in Operand (= keyword in line)
						return state.gotKeyword === true ? "def" : "syntax-error";
					}

					// Capture noprefix numbers
					if (syn_number.test(w)) return 'number';

					return "syntax-error"
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
					// Extract string and cut delimitors
					let token = stream.current();
					token = token.substr(1, token.length - 2);
					// prepare for error if #include "noLib"
					if (Lib.libs.includes(token) || !isAfterInclude) {
						return 'string';
					} else {
						return 'string-error';
					}
				} else {
					// Allways eat something, to prevent endless loops
					const char = stream.next();
					if (char === ",") return null;
				}

				return "syntax-error";
			}
		};
	});
}
