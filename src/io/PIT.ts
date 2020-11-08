import IODevice from "./io";

export default PIT;
export class PIT implements IODevice {

    public ports: number[];

    private cfnTime: Date;

    private mode: number;
    private binary: boolean; 
    private channel: number;
    private lsb: boolean;
    private msb: boolean;
    private ch1Freq: number;

    private input: number;
    private gotInput: boolean = false;

    private divOut: HTMLDivElement[] = [];

    constructor(ch0port: number, domSelector: string) {
        this.ports = [ ch0port, ch0port+1, ch0port+2, ch0port+3 ];

        this.build(domSelector);
    }

    private build(domSelector: string) {
        const container = document.querySelector(domSelector);
        container.innerHTML = "<div>PIT 8255A</div>"

        for (let i = 0; i < 3; i++) {
            const div = document.createElement("div")
            div.innerHTML = "CH" + i + ": 0Hz";
            this.divOut.push(div);
            container.append(div);
        }
    }

    public onInput(port: number): number {
        throw new Error("Runtime Error(IO): PIT does not provide input.")
    }

    public onOutput(port: number, value: number): void {
        switch (port) {
            case this.ports[0]:
                if (this.channel !== 0) return;
                if (this.mode !== 3) throw new Error("Runtimer Error(IO): PIT only mode 3 available.")

                if (this.readInput(value)) {
                    let freq = Math.round(2_000_000 / this.input);
                    this.divOut[0].innerHTML = "CH0: " + freq + "Hz"
                }

                break
            case this.ports[1]:
                if (this.channel !== 1) return;
                if (this.mode !== 3) throw new Error("Runtimer Error(IO): PIT only mode 3 available.")

                if (this.readInput(value)) {
                    let freq = Math.round(2_000_000 / this.input);
                    this.ch1Freq = freq;
                    this.divOut[1].innerHTML = "CH1: " + freq + "Hz"
                }

                break
            case this.ports[2]:
                if (this.channel !== 2) return;
                if (this.mode !== 3) throw new Error("Runtimer Error(IO): PIT only mode 3 available.")

                if (this.readInput(value) && this.ch1Freq !== undefined) {
                    let freq = Math.round(this.ch1Freq / this.input);
                    this.divOut[2].innerHTML = "CH2: " + freq + "Hz"
                }

                break
            case this.ports[3]:
                // Config
                this.channel = (value & 0b11000000) >>> 6;
                this.lsb = (value & 0b00100000) !== 0;
                this.msb = (value & 0b00010000) !== 0;
                this.mode = (value & 0b00001110) >>> 1;
                this.binary = (value & 0b00000001) !== 0;

                this.cfnTime = new Date();
                this.gotInput = false;
                this.input = 0;

                break
        }
    }

    private readInput(value: number): boolean {
        if (this.gotInput) {
            if (!this.msb) throw new Error("Runtime Error(IO): PIT internal error");
            this.input = this.input | ((value << 8) & 0xff00)
            return true;
        } else {
            if (this.lsb) {
                this.gotInput = true;
                this.input = value & 0xff;
                return !this.msb
            } else if (this.msb) {
                this.gotInput = true;
                this.input = (value << 8) & 0xff00;
                return true;
            } else {
                throw new Error("Runtimer Error(IO): PIT got unexpected input.");
            }
        }
    }
}