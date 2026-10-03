type Obj = Record<string, unknown>

/** Read a dotted path ("zettel.enabled", "general.ignoredFolders.0") */
export function getIn(root: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o as Obj | undefined)?.[k], root)
}

/** Immutable dotted-path set, returns a new root */
export function setIn<T>(root: T, path: string, value: unknown): T {
  const walk = (obj: unknown, keys: string[]): unknown => {
    const [k, ...rest] = keys
    if (k === undefined) return value
    const copy: Obj | unknown[] = Array.isArray(obj) ? [...(obj as unknown[])] : { ...(obj as Obj) }
    ;(copy as Obj)[k] = walk((obj as Obj | undefined)?.[k], rest)
    return copy
  }
  return walk(root, path.split('.')) as T
}
