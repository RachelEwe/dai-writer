class SelectCharacter {
    constructor() {
        this._characters = [];
        self = this;
        fetch("/api/character/name/")
        .then(response => response.json())
        .then(data => {
            if (data === null) {
                return
            }
            data.forEach(character => {
                self._characters.push(character);
                self._options += `<option value="${character.id}">${character.name}</option>`
            });
        });
    }

    code(id) {
        return `<select id="${id}" class="custom-select">${this._options}</select>`
    }

    name(id) {
        var result = "";
        this._characters.forEach(character => {
            if (character.id === id) {
                result = character.name;
            }
        });
        return result
    }
}

const selectCharacter = new SelectCharacter();

export default selectCharacter;