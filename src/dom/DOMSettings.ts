import { App } from "../App";
import SemiPersistentStorage from "./common";
import { DOMApp } from "./DOMApp";

export class DOMSettings {
 
    private app: App;
    private domApp: DOMApp;

    private renderCycleDuration: number = 5; 

    private emulatorFreqency: Setting<number> = new Setting("emulatorFreqency");
    private speedUpLibCode: Setting<boolean> = new Setting("speedUpLibCode");
    private debugCompiler: Setting<boolean> = new Setting("debugCompiler");

    constructor(app: App, domApp: DOMApp) {
        this.app = app;
        this.domApp = domApp;

        this.build();

        setInterval(async () => {
            const d = new Date();
            await new Promise(r => setTimeout(r));
            const duration = new Date().getTime() - d.getTime();

            if (duration < this.renderCycleDuration*5) {
                this.renderCycleDuration = 0.9*this.renderCycleDuration + 0.1*duration;
            }
        }, 5000)
    }

    /**
     * Builds the required UI for the settings component
     */
    private build() {
        const container = document.querySelector(".settings");

        {
            const label = document.createElement("label")
            label.innerHTML = "Emulator CPU Frequency";

            const freqencySlide = document.createElement("input");
            freqencySlide.type = "range";
            freqencySlide.min = "0";
            freqencySlide.max = "100";
            freqencySlide.step = "1";

            const resLabel = document.createElement("span");
            resLabel.textContent = " 10Hz";

            this.emulatorFreqency.subscribe((v) => {
                /*
                Freq = (Max - (Min - 1))^perc + (Min - 1)
                */
                const baseFreq = 1000/this.renderCycleDuration
                const freq = Math.floor(Math.pow(2_000_000 - 9, v / 100)  + 9);
                
                const instructionDelay = Math.floor(freq > baseFreq ? 0 : 1000/freq);
                const batchSize = Math.floor(freq > baseFreq ? freq / baseFreq : 1);

                resLabel.innerHTML = freqencyToString(freq);

                this.domApp.instructionDelay = instructionDelay;
                this.domApp.batchSize = batchSize;

                if (instructionDelay === 0 && this.domApp.editor)
                    this.domApp.editor.getDoc().getAllMarks().forEach((m) => m.clear());
            });

            freqencySlide.addEventListener("change", () => {
                this.emulatorFreqency.set(parseInt(freqencySlide.value));
            });

            freqencySlide.value = ""+this.emulatorFreqency.init(10);

            const group = document.createElement("div");
            group.classList.add("form-group");
            group.append(label, freqencySlide, resLabel);

            container.append(group);
        }
        // Speed up component
        {
            const label = document.createElement("label");
            label.innerHTML = "Speed up libary code execution";

            const speedUpCheckBox = document.createElement("input");
            speedUpCheckBox.type = "checkbox";

            this.speedUpLibCode.subscribe((v) => {
                this.domApp.speedUpLibaryCode = v;
            })

            speedUpCheckBox.addEventListener("change", () => {
                this.speedUpLibCode.set(speedUpCheckBox.checked);
            })

            speedUpCheckBox.checked = this.speedUpLibCode.init(true);

            const group = document.createElement("div");
            group.classList.add("form-group")
            group.append(label, speedUpCheckBox);

            container.append(group);
        }

        // Debug Compiler
        {
            const label = document.createElement("label");
            label.innerHTML = "Enable debug output for compiler";

            const debugCompilerCheckBox = document.createElement("input");
            debugCompilerCheckBox.type = "checkbox";

            this.debugCompiler.subscribe((v) => {
                this.app.compiler.debugMode = v;
            })

            debugCompilerCheckBox.addEventListener("change", () => {
                this.debugCompiler.set(debugCompilerCheckBox.checked);
            })

            debugCompilerCheckBox.checked = this.debugCompiler.init(false);

            const group = document.createElement("div");
            group.classList.add("form-group")
            group.append(label, debugCompilerCheckBox);

            container.append(group);
        }
    }
}

class Setting<T> {

    private name: string;
    private handler: (value: T) => void;

    constructor(name: string) {
        this.name = name;
    }

    public subscribe(handler: (value: T) => void) {
        this.handler = handler;
    }

    public set(newValue: T) {
        SemiPersistentStorage.setData("settings:" + this.name, JSON.stringify(newValue));
        this.handler(newValue);
    }

    public init(defaultValue: T): T {
        let sV: any = SemiPersistentStorage.getData("settings:" + this.name);
        if (sV !== "") { 
            sV = JSON.parse(sV);
        } else {
            sV = defaultValue;
        }
        this.set(sV);
        return sV;
    }
}

function freqencyToString(freq:number):string {
    if (freq < 1000) return freq + "Hz";
    if (freq < 1_000_000) return Math.floor(freq / 1000) + "kHz";
    return Math.floor(freq / 1000000) + "MHz";
}