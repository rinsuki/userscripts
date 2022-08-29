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