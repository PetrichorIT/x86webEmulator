import { Lib } from "../lib/lib";
import { FullPersistentStorage } from "./common";
import { DOMApp } from "./DOMApp";

export class DOMLibaryController {

    domApp: DOMApp;

    constructor(domApp: DOMApp) {
        this.domApp = domApp;

        this.build()
    }

    private build() {
        const container = document.querySelector(".libary-controller")

        {
            const ul = document.createElement("ul");
            ul.classList.add("libary-list")

            for (const lib of Lib.libs) {
                const li = document.createElement("li");
                li.innerHTML = lib;
                ul.append(li)
            }

            container.append(ul);
        }

        {
            const button = document.createElement("button")
            button.innerHTML = "Save code as libary"
            button.addEventListener("click", () => this.saveLibary());

            container.append(button);
        }

        {
            const button = document.createElement("button")
            button.innerHTML = "Show libary code"
            button.addEventListener("click", () => this.showLibaryCode());

            container.append(button);
        }
    }

    /**
	 * Handles the creation of a Lib from the current code of the editor
	 */
	private saveLibary() {
		const libName = prompt('Enter a libary name', 'myLib');
		Lib.setLib(this.domApp.app, libName, this.domApp.editor.getDoc().getValue());
    }
    
    private showLibaryCode() {
        const libName = prompt('Enter a libary name', 'string.h');
        this.domApp.editor.setValue(Lib.getLibCode(libName));
    }
}