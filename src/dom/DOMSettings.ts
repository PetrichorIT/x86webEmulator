import { App } from "../App";
import SemiPersistentStorage from "./common";
import { DOMApp } from "./DOMApp";

export class DOMSettings {
 
    private app: App;
    private domApp: DOMApp;

    private instuctionDelay: Setting<number> = new Setting("instructionDelay");
    private speedUpLibCode: Setting<boolean> = new Setting("speedUpLibCode");
    private debugParser: Setting<boolean> = new Setting("debugParser");

    constructor(app: App, domApp: DOMApp) {
        this.app = app;
        this.domApp = domApp;

        this.build();
    }

    /**
     * Builds the required UI for the settings component
     */
    private build() {
        const container = document.querySelector(".settings");

        // Instruction Delay component
        {
            const label = document.createElement("label");
            label.innerHTML = "Delay between instructions";

            const instructionDelaySilde = document.createElement("input");
            instructionDelaySilde.type = "range";
            instructionDelaySilde.min = "0";
            instructionDelaySilde.max = "1000";
            instructionDelaySilde.step = "1";


            this.instuctionDelay.subscribe((v) => {
                this.app.instructionDelay = v;
            })

            instructionDelaySilde.addEventListener("change", () => {
                this.instuctionDelay.set(parseInt(instructionDelaySilde.value));
            })

            instructionDelaySilde.value = ""+this.instuctionDelay.init(100);

            const group = document.createElement("div");
            group.classList.add("form-group")
            group.append(label, instructionDelaySilde);

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

        // Debug Parser
        {
            const label = document.createElement("label");
            label.innerHTML = "Enable debug output for parser";

            const debugParserCheckBox = document.createElement("input");
            debugParserCheckBox.type = "checkbox";

            this.debugParser.subscribe((v) => {
                this.app.parser.debugMode = v;
            })

            debugParserCheckBox.addEventListener("change", () => {
                this.debugParser.set(debugParserCheckBox.checked);
            })

            debugParserCheckBox.checked = this.debugParser.init(false);

            const group = document.createElement("div");
            group.classList.add("form-group")
            group.append(label, debugParserCheckBox);

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