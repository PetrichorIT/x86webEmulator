import { createInterface } from 'readline';
import { Parser } from './parsers';
import { Command } from './App';

const rl = createInterface(process.stdin, process.stdout);

rl.on('line', (l) => {
	let psd = new Parser().parse(l)[0] as Command;
	console.log(psd.name, psd.params);
});

rl.on('SIGINT', () => {
	console.log('Closing Parser');
	process.exit(0);
});
