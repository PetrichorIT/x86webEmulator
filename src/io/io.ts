export interface IODevice {

    ports: number[]

    onInput(port: number): number;
    onOutput(port: number, data: number):void
}

export default IODevice;