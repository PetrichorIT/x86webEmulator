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

                const span = document.createElement("span");
                span.innerHTML = lib;

                const showButton = document.createElement("button")
                showButton.classList.add("showButton");
                showButton.innerHTML = "Show";
                showButton.addEventListener("click", () => this.showLibaryCode(lib));

                li.append(showButton, span);
                ul.append(li)
            }

            container.append(ul);
        }

        {
            const button = document.createElement("button")
            button.classList.add("saveLibary")
            button.innerHTML = "Save code as libary"
            button.addEventListener("click", () => this.saveLibary());
            container.append(button);
        }
    }

    /**
	 * Handles the creation of a Lib from the current code of the editor
	 */
	private saveLibary() {
        const libName = prompt('Enter a libary name', 'myLib');
        if (!libName) return;
		Lib.setLib(this.domApp.app, libName, this.domApp.editor.getDoc().getValue());
    }
    
    /**
     * Shows the libary code in the editor
     */
    private showLibaryCode(libName: string) {
        this.domApp.editor.setValue(Lib.getLibCode(libName));
    }
}