import IODevice from "./io";

export default MatrixKeyboard;
export class MatrixKeyboard implements IODevice {

    public ports: number[];

    private boxes: HTMLInputElement[][] = [];
    private rowSelect: number;

    constructor(rowPort: number, colPort: number, domSelector: string) {
        this.ports = [rowPort, colPort];

        this.build(domSelector);
    }

    private build(domSelector: string) {
        const container = document.querySelector(domSelector);
        container.classList.add("matrixKeyboard")

        for (let i = 0; i < 4; i++) {
            this.boxes.push([]);
            const row = document.createElement("div");
            row.classList.add("matrixKeyboardRow");

            for (let j = 0; j < 4 ;j++) {
                const label = document.createElement("label")
                label.classList.add("checkboxContainer")

                const box = document.createElement("input");
                box.type = "checkbox";
                box.checked = false;
                box.classList.add("matrixBox");
                this.boxes[i].push(box)

                const span = document.createElement("span")
                span.classList.add("checkmark");

                label.append(box, span);
                row.append(label);           
            }
            container.append(row)            
        }
    }

    public onInput(port: number): number {
        if (port !== this.ports[1]) throw new Error("Runtime Error(IO): Matrix Keyboard (RowPort) dose not provide input")

        let rSelect = this.rowSelect;
        let res = 0;
        for (let i = 0; i < 4; i++) {
            const isRead = (rSelect & 0b1) === 1
            rSelect = rSelect >>> 1;
            if (isRead) {
                res |= this.rowRead(i);
            }
        }
        return res;
    }

    private rowRead(row: number): number {
        let res = 0;
        for (let i = 0; i < 4; i++) {
            res = res << 1;
            if (this.boxes[row][i].checked) res |= 0b1
        }
        return res;
    }

    public onOutput(port: number, value: number): void {
        if (port !== this.ports[0]) throw new Error("Runtime Error(IO): Matrix Keyboard (ColPort) dose not accept output")
        this.rowSelect = value;
    }

}