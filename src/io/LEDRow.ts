import IODevice from "./io";

export default LEDRow;
export class LEDRow implements IODevice {

    public ports: number[];
    
    private output: number = 0;
    private ledDOMs: HTMLElement[] = [];

    constructor(port: number, domSelector: string) {
        this.ports = [ port ];
        this.build(domSelector);
    }

    private build(domSelector: string) {

        const container = document.querySelector(domSelector);
        container.classList.add("led-list");

        for (let i = 0; i < 8; i++) {
            const led = document.createElement("div")
            led.classList.add("led");
            this.ledDOMs.push(led);
            container.append(led);
        }
    }


    public onInput(port: number): number {
        return this.output;
    };
    public onOutput(port: number, value: number): void {
        this.output = value;
        for (let i = 7; i >= 0; i--) {
            let isOn = (0b01 & value) !== 0;
            this.ledDOMs[i].style.backgroundColor = isOn ? "red" : "gray";
            value = value >>> 1;
        }
    }
}

