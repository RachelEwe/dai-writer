import prefix from "../../config.js";;
import { DWMovableComponent } from "./dw-movable-component.js";
import { EventBus } from "./framework.js";
import selectCharacter from "./select-character.js";

class SceneComponent extends DWMovableComponent {
    constructor(id, parameters, callbacks) {
        super(id, parameters, callbacks);
        if (this.characters === undefined) {
            this.characters = [];
        }
        let addId = "add-" + parameters.id;
        this._addCallbacks({
            [addId]: {"click":this._handleAdd.bind(this)},
        });
        this._uri = prefix + '/api/scene/' + this.book_id + '/';
        if ((this.lines === undefined) || (this.lines === null)) {
            this.lines = [];
        }
        this.numLines = this.lines.length;
        this._genCharaList();
        this._init();
        this.backupChar = this.characters;
        EventBus.register("refresh-order", this._saveOrder.bind(this));
    }

    _save() {
        let scene = {
            "id": this.id,
            "book_id": this.book_id,
            "displayed": this._displayed,
            "name": this.name,
            "description": this.description,
            "characters": this.characters,
            "lines": this.lines,
        };
        fetch(this._uri + this.id, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scene)
        });
    }

    _handleOpen(event) {
        super._handleOpen(event);
        if (this.id === 0) {
            return
        }
        this._save();
    }

    _handleEdit(event) {
        super._handleEdit(event);
        if (this.id === 0) {
            return
        }
        this._save();
    }

    _saveOrder(event) {
        if (typeof event !== "undefined") {
            if (this.id !==0) {
                return;
            } else {
                this["name"] = "";
                this["description"] = "";
                this["characters"] = [];
                this._genCharaList();
            }
        }
        let sceneList = [];
        let container = document.getElementById("container");
        let scenes = container.children;
        for (var i = 0; i < scenes.length; i++) {
            var scene = scenes[i];
            let decoded = scene.id.split("-");
            if (decoded.length !== 2) {
                throw "Scene id, wrong format"
            }
            sceneList.push(parseInt(decoded[1]));
        }
        fetch(prefix + "/api/book/"+ this.book_id)
        .then(response => response.json())
        .then(book => {
            book.scenes = sceneList;
            fetch(prefix + "/api/book/"+ this.book_id, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(book)
            });
        });
    }

    _genCharaList() {
        this.charaList = "";
        this.charaListB = "";
        if (this.characters !== undefined) {
            this.characters.forEach(character => {
                let buttonId = "remove-"+this.id+"-"+character;
                this.charaList += `<li title="${selectCharacter.infos(character)}">${selectCharacter.name(character)}</li>`;
                this.charaListB += `<li title="${selectCharacter.infos(character)}">${selectCharacter.name(character)}<button id="${buttonId}" class="button-close"><i class="fa-regular fa-circle-xmark"></i></button></li>`;
                if (!(buttonId in this._callbacks)) {
                    this._addCallbacks({
                        [buttonId]: {"click":this._handleRemove.bind(this)},
                    });
                }
            });
            this.charaList = `<ul class="mt0">${this.charaList}</ul>`;
            this.charaListB = `<ul class="mt0">${this.charaListB}</ul>`;
        }
    }

    _handleAdd(event) {
        event.preventDefault();
        let element = document.getElementById("character-"+this.id);
        var charId = parseInt(element.value)
        if (this.characters.indexOf(charId) === -1) {
            this.characters.push(charId);
            this._genCharaList();
            var form = document.getElementById("form-"+this.id);
            var formData = new FormData(form);
            this["name"] = formData.get("name");
            this["description"] = formData.get("description");
            this.render();
            this._handleInput();
        }
    }

    _handleRemove(event) {
        event.preventDefault();
        let buttonId = event.target.parentNode.id;
        if (buttonId.length === 0) {
            buttonId = event.target.id;
        }
        let decoded = buttonId.split("-");
        if (decoded.length !== 3) {
            throw "Button id, wrong format"
        }
        let charaId = parseInt(decoded[2]);
        this.characters = this.characters.filter(item => item !== charaId);
        this._removeCallback(buttonId);
        this._genCharaList();
        var form = document.getElementById("form-"+this.id);
        var formData = new FormData(form);
        this["name"] = formData.get("name");
        this["description"] = formData.get("description");
        this.render();
        this._handleInput();
    }

    _template() {
        if (this.id === 0) {
            var linkLines = "";
            var arrows = "";
        } else {
            var linkLines = `<a href="${prefix}/line/${this.book_id}/${this.id}/" class="custom-button button-link ml2 mt2 mb2">Generate content</a>`;
            var arrows = `
            <div class="buttons buttons-center">
                <button id="up-${this.id}"><i class="fa-solid fa-chevron-up"></i></button>
                <button id="down-${this.id}"><i class="fa-solid fa-chevron-down"></i></button>
            </div>`;
        }
        if (this._edition) {
            return `
            <div class="element">
                <div class="content">
                    <form id="form-${this.id}" method="POST" action="${prefix}/api/scene/${this.book_id}/${this.id}">
                        <input type="hidden" name="id" value="${this.id}">
                        <input type="hidden" name="book_id" value="${this.book_id}">
                        <input type="hidden" name="displayed" value="${this._displayed}">
                        <div>
                            <p>Title : </p><input type="text" value="${this.name}" name="name" class="custom-input w100">
                        </div>
                        <div class="mt2">
                            <label>Description: </label><textarea name="description" placeholder="Will replace character scenario if not empty" class="custom-textarea">${this.description}</textarea>
                            <label>Characters : </label>${this.charaListB}
                            <label>Add a character to the scene: </label>${selectCharacter.all("character-"+this.id)}
                            <button id="add-${this.id}" class="custom-button">Add</button>
                        </div>
                        <input type="hidden" name="characters" value="${this.characters}">
                        <input type="hidden" name="lines" value="${this.lines}">
                        <button id="save-${this.id}" type="submit" class="custom-button ml2 mt2">Save</button>
                        <button id="cancel-${this.id}" type="button" class="custom-button mt2">Cancel</button>
                    </form>
                    ${arrows}
                </div>
                <div class="buttons buttons-right">
                    <button id="edit-${this.id}"><i class="fa-regular fa-rectangle-xmark"></i></button>
                    <button  id="open-${this.id}"><i class="fa-regular fa-eye"></i></button>
                </div>
            </div>
            `
        }
        if (this.id === 0) {
            return `
                <div class="element">
                    <div class="content">
                        <div>
                            <p>Create a new scene</p>
                        </div>
                    </div>
                    <div class="buttons buttons-right">
                        <button id="edit-${this.id}"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button  id="open-${this.id}"><i class="fa-regular fa-eye"></i></button>
                    </div>
                </div>
                `
        }
        if (this._displayed) {
                return `
                    <div class="element">
                        <div class="content">
                            <div>
                                <p>Title : ${this.name}</p>
                            </div>
                            <div>
                                <p>Description : ${this.description}</p>
                                <p class="mb0">Characters : </p>
                                ${this.charaList}
                                <p>Lines : ${this.numLines}</p>
                            </div>
                            ${linkLines}
                            <div class="buttons buttons-center">
                                <button id="up-${this.id}"><i class="fa-solid fa-chevron-up"></i></button>
                                <button id="down-${this.id}"><i class="fa-solid fa-chevron-down"></i></button>
                            </div>
                        </div>
                        <div class="buttons buttons-right">
                            <button id="edit-${this.id}"><i class="fa-solid fa-pen-to-square"></i></button>
                            <button  id="open-${this.id}"><i class="fa-regular fa-eye"></i></button>
                        </div>
                    </div>
                    `
        }
        return `
            <div class="element">
                <div class="content">
                    <div>
                        <p>Title : ${this.name}</p>
                    </div>
                </div>
                <div class="buttons buttons-right">
                    <button id="edit-${this.id}"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button  id="open-${this.id}"><i class="fa-regular fa-eye-slash"></i></button>
                </div>
            </div>
            `
    }
}

export { SceneComponent }