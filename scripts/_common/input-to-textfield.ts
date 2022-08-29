export function inputToTextfield(input: HTMLInputElement, text: string, replace: true) {
    input.value = ""
    input.dispatchEvent(new InputEvent("input", {
        data: "null",
        inputType: "deleteContentBackward",
    }))
    if (text.length) {
        input.value = text
        input.dispatchEvent(new InputEvent("input", {
            data: text,
            inputType: "insertFromPaste",
        }))
    }
}