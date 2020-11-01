import { App } from "../App";
import { DOMApp } from "./DOMApp";

export class DOMSettings {
 
    app: App;
    domApp: DOMApp;

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
            instructionDelaySilde.value = "100";
            instructionDelaySilde.step = "1";

            instructionDelaySilde.addEventListener("change", () => {
                this.app.instructionDelay = parseInt(instructionDelaySilde.value);
            })

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
            speedUpCheckBox.checked = true;

            speedUpCheckBox.addEventListener("change", () => {
                this.domApp.speedUpLibaryCode = speedUpCheckBox.checked;
            })

            const group = document.createElement("div");
            group.classList.add("form-group")
            group.append(label, speedUpCheckBox);

            container.append(group);
        }
    }
}