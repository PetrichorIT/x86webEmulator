import * as CodeMirror from 'codemirror';
import { syn_label_def, syn_label, syn_keywords, syn_number, syn_registers, syn_string, SourceMode, syn_datasize} from './Common'
import { Lib } from '../lib/lib'

/**
 * Initializes codemirror syntax highlighter:
 * Requires:
 * - Loaded commands
 * - Loaded Libs
 */
export function initCodemirrorSyntax () {
    CodeMirror.defineMode('x86', function(_config: CodeMirror.EditorConfiguration, parserOptions: any) {
		return {
			startState: () => {
				return { mode: SourceMode.global, dataContext: 0, context: 0, gotKeyword: false };
			},
			token: (stream, state) => {
                switch (state.mode) {
                    case SourceMode.global:
                        return synModeGlobal(stream, state);
                    case SourceMode.text:
                        return synModeText(stream, state);
                    case SourceMode.data: 
                        return synModeData(stream, state);
                }
			}
		};
	});
}

function synModeGlobal(stream: CodeMirror.StringStream, state: any): string {
    if (stream.eatSpace()) return null;
    if (stream.eat(";")) {
        stream.skipToEnd();
        return "comment";
    }

    if (stream.match(syn_label_def, true)) {
        return "def";
    }

    if (stream.match(".text:", true)) {
        state.mode = SourceMode.text;
        return "global-marker";
    } 

    if (stream.match(".data:", true)) {
        state.mode = SourceMode.data;
        return "global-marker";
    }

    stream.next();
    return null;
}

function synModeText(stream: CodeMirror.StringStream, state: any): string {
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
            if (syn_label_def.test(w)) return 'def';
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
    } else if (stream.match(syn_label_def, true)) {
        return 'def';
    } else if (stream.match("#include", true)) {
        state.context = 1;
        return 'def';
    } else if (stream.match("@export", true)) {
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
        if (char === ".") {
            if (stream.match("data:", true)) {
                state.mode = SourceMode.data;
                return "global-marker";
            }
        }
    }

    return "syntax-error";
}

function synModeData(stream: CodeMirror.StringStream, state: any): string {

    if (stream.sol()) state.dataContext = 0;

    if (stream.eatSpace()) return null;
    if (stream.eat(";")) {
        stream.skipToEnd();
        return "comment";
    }

    switch (state.dataContext) {
        case 0:
            if (stream.match(syn_label, true)) {
                state.dataContext = 1;
                return "def";
            }
            break;
        case 1:
            if (stream.match(syn_datasize, true)) {
                state.dataContext = 2;
                return null;
            }

        case 2:
            if (stream.eat(",")) return null;
            if (stream.match(syn_number, true) || stream.eat("?")) return "number";
    }

    stream.next();
    return "syntax-error"
}