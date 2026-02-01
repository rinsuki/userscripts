export function inputToReactManagedElement<T extends HTMLInputElement>(input: T, value: string) {
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "value")?.set?.call(input, value)
    input.dispatchEvent(new InputEvent("input", { bubbles: true } ))
}
