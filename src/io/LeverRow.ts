import IODevice from "./io";

export default LeverRow;
export class LeverRow implements IODevice {

    public ports: number[];
    private levers: HTMLInputElement[] = [];

    constructor(port: number, domSelector: string) {
        this.ports = [ port ];
        this.build(domSelector);
    }

    private build(domSelector: string) {
        const container = document.querySelector(domSelector);
        container.classList.add("leverRow");

        for (let i = 7; i >= 0; i--) {
            const label = document.createElement("label")
            label.classList.add("checkboxContainer")

            const box = document.createElement("input");
            box.type = "checkbox";
            box.checked = false;
            box.classList.add("lever");
            this.levers.push(box)

            const span = document.createElement("span")
            span.classList.add("checkmark");

            label.append(box, span);
            container.append(label);
        }
    }

    public onInput(port: number): number {
        let res = 0;
        for (let i = 0; i < this.levers.length; i++) {
            if (this.levers[i].checked) res += Math.pow(2, 7 - i);   
        }
        return res;
    }

    public onOutput(port: number, value: number): void {
        throw new Error("Runtime Execption(IO): LeverRow does not accept output");
    }
}