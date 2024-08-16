type ReactInternalContainer = {
    memoizedState: {
        element: {
            props: any
        }
    }
}

export function getReactContainer(elem: Element): ReactInternalContainer | undefined {
    const properties = Object.getOwnPropertyNames(elem)
    const name = properties.find(x => x.startsWith("__reactContainer$"))
    if (name != null) return (elem as any)[name] as ReactInternalContainer
}

type ReactInternalFiber = {
    memoizedProps: {}
}

export function getReactFiber(elem: Element): ReactInternalFiber | undefined {
    const properties = Object.getOwnPropertyNames(elem)
    const name = properties.find(x => x.startsWith("__reactFiber$"))
    if (name != null) return (elem as any)[name] as ReactInternalFiber
}

export function getReactProps(elem: Element): any {
    const properties = Object.getOwnPropertyNames(elem)
    const name = properties.find(x => x.startsWith("__reactProps$"))
    if (name != null) return (elem as any)[name] as any
}