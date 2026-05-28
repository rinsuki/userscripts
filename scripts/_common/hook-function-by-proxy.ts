export function hookFunctionReturnValueByProxy<K extends string, O extends Record<K, (...args: any[]) => any>>(
    obj: O,
    funcName: K,
    hook: (value: ReturnType<O[K]>, thisObj: O, args: Parameters<O[K]>) => ReturnType<O[K]>
) {
    obj[funcName] = new Proxy(obj[funcName], {
        apply(target, thisArg, argArray) {
            const res = Reflect.apply(target, thisArg, argArray)
            return hook.call(thisArg, res, thisArg as O, argArray as Parameters<O[K]>)
        }
    }) as O[K]
}
