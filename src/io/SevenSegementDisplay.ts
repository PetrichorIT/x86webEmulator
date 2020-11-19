import IODevice from "./io";

export default SevenSegmentDisplay;
export class SevenSegmentDisplay implements IODevice {

    public ports: number[];

    private segments: Segement[] = [];

    constructor(startPort: number, endPort: number, domSelector: string) {
        this.ports = (() => {
            let p: number[] = []
            for (let i = startPort; i <= endPort; i++) {
                p.push(i);
            }
            return p;
        })();
        this.build(domSelector);
    }

    private build(domSelector: string) {
        const container = document.querySelector<HTMLElement>(domSelector);

        for (const port of this.ports) {
     
            this.segments.push(
                new Segement("ssd:" + port.toString(16), container)
            );
        }
    }

    public onInput(port: number): number {
        throw new Error("Runtime Execption(IO): SevenSegmentDisplay does not provide input");
    }

    public onOutput(port: number, value: number): void {
        const id = "ssd:" + port.toString(16);
        for (let i = 0; i < 7; i++) {
            const isOn = (value & 0b1) === 1;
            isOn ?
                document.getElementById(id + ":" + i).classList.add("sevenSeg-segOn") :
                document.getElementById(id + ":" + i).classList.remove("sevenSeg-segOn")
                value = value >>> 1;
        }
    }
}

class Segement {
    private id: string;

    constructor(id: string, container: HTMLElement) {
        this.id = id;


        container.innerHTML += `
        <svg class="sevenSegDigit" viewBox="0 0 50 100" id="${id}">
            <defs>
                <polyline id="v-seg" points="0 11, 5 6, 10 11, 10 34, 5 39, 0 39"></polyline>
                <polyline id="h-seg" points="11 0, 37 0, 42 5, 37 10, 11 10, 6 5"></polyline>
            </defs>
            <g class="sevenSegDigit-G">
                <use id="${id}:0" xlink:href="#v-seg" x="-48" y="0" transform="scale(-1,1)" ></use>
                <use id="${id}:1" xlink:href="#v-seg" x="-48" y="-80" transform="scale(-1,-1)" ></use>
                <use id="${id}:2" xlink:href="#h-seg" x="0" y="70" ></use>
                <use id="${id}:3" xlink:href="#v-seg" x="0" y="-80" transform="scale(1,-1)" ></use>
                <use id="${id}:4" xlink:href="#v-seg" x="0" y="0" ></use>
                <use id="${id}:5" xlink:href="#h-seg" x="0" y="0" ></use>
                <use id="${id}:6" xlink:href="#h-seg" x="0" y="35" ></use>
            </g>
        </svg>
        `
    }
}