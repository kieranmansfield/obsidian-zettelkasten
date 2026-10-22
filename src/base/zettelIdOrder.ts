import { deepSplitSegment } from './zettelId'

/**
 * Zettel ID rules: a 17-digit timestamp, then segments alternating letters (index 0, 2, …)
 * and numbers (index 1, 3, …). Hierarchy and order are segment-wise, never string-wise:
 * `a10` is a sibling of `a1`, and sorts after `a9`.
 */

export interface ParsedZettelId {
  id: string
  timestamp: string
  segments: string[]
}

type SegmentKind = 'letter' | 'number'

const ID_PATTERN = /^(?:[a-z]+)?(\d{17})((?:[a-z]+|\d+)*)/

/** Parse a filename or bare ID: optional lowercase prefix, the ID, then anything (e.g. a title) */
export function parseZettelId(basename: string): ParsedZettelId | null {
  const match = basename.match(ID_PATTERN)
  if (!match) return null
  return { id: match[1] + match[2], timestamp: match[1], segments: deepSplitSegment(match[2]) }
}

/** Kind of the segment at a given index: letters first, then alternating */
const segmentKind = (index: number): SegmentKind => (index % 2 === 0 ? 'letter' : 'number')

/** Numbers by value; letters in bijective base 26 (a=1 … z=26, aa=27) */
export function segmentOrdinal(seg: string): number {
  if (/^\d+$/.test(seg)) return Number(seg)
  return [...seg].reduce((n, c) => n * 26 + c.charCodeAt(0) - 96, 0)
}

export function ordinalToSegment(n: number, kind: SegmentKind): string {
  if (kind === 'number') return String(n)
  let seg = ''
  for (; n > 0; n = Math.floor((n - 1) / 26)) seg = String.fromCharCode(97 + ((n - 1) % 26)) + seg
  return seg
}

/** Timestamp, then segment by segment by ordinal; a parent sorts before its descendants */
export function compareZettelIds(a: string, b: string): number {
  const pa = parseZettelId(a)
  const pb = parseZettelId(b)
  if (!pa || !pb) return a.localeCompare(b)
  if (pa.timestamp !== pb.timestamp) return pa.timestamp < pb.timestamp ? -1 : 1
  for (let i = 0; i < Math.min(pa.segments.length, pb.segments.length); i++) {
    const d = segmentOrdinal(pa.segments[i]) - segmentOrdinal(pb.segments[i])
    if (d) return d
  }
  return pa.segments.length - pb.segments.length
}

/** Sort files by the ID in their basename; files without one go last, by name */
export function compareZettelFiles(a: { basename: string }, b: { basename: string }): number {
  const ia = parseZettelId(a.basename)?.id
  const ib = parseZettelId(b.basename)?.id
  if (ia && ib) return compareZettelIds(ia, ib)
  if (ia || ib) return ia ? -1 : 1
  return a.basename.localeCompare(b.basename)
}

/** `id` lies under `ancestor` (same timestamp, element-wise segment prefix, longer) */
export function isDescendantOf(id: string, ancestor: string): boolean {
  const c = parseZettelId(id)
  const a = parseZettelId(ancestor)
  return (
    !!c &&
    !!a &&
    c.timestamp === a.timestamp &&
    c.segments.length > a.segments.length &&
    a.segments.every((seg, i) => seg === c.segments[i])
  )
}

export function isChildOf(id: string, parent: string): boolean {
  return (
    isDescendantOf(id, parent) &&
    parseZettelId(id)!.segments.length === parseZettelId(parent)!.segments.length + 1
  )
}

/** Parent ID (one segment fewer), or null for a root */
export function parentZettelId(id: string): string | null {
  const p = parseZettelId(id)
  if (!p || !p.segments.length) return null
  return p.timestamp + p.segments.slice(0, -1).join('')
}

/** Next child of `parentId` after its highest existing child; gaps are not refilled */
export function nextFreeChildId(parentId: string, existingIds: Iterable<string>): string {
  const depth = parseZettelId(parentId)?.segments.length ?? 0
  let max = 0
  for (const id of existingIds) {
    if (isChildOf(id, parentId))
      max = Math.max(max, segmentOrdinal(parseZettelId(id)!.segments[depth]))
  }
  return parentId + ordinalToSegment(max + 1, segmentKind(depth))
}

export interface SubtreeRename {
  path: string
  oldId: string
  newId: string
}

/**
 * Plan moving `fromId` and all its descendants to `toId`. Each descendant keeps its segments
 * relative to `fromId`, re-emitted with the kind for its new depth (so `Tb1` under `Ta11` becomes
 * `Ta11a`, not `Ta111`). `conflicts` lists target IDs already used outside the subtree.
 */
export function planSubtreeMove(
  zettels: Array<{ path: string; id: string }>,
  fromId: string,
  toId: string
): { renames: SubtreeRename[]; conflicts: string[] } {
  const fromDepth = parseZettelId(fromId)?.segments.length ?? 0
  const toDepth = parseZettelId(toId)?.segments.length ?? 0
  const inTree = (id: string) => id === fromId || isDescendantOf(id, fromId)

  const renames = zettels
    .filter((z) => inTree(z.id))
    .sort((a, b) => compareZettelIds(a.id, b.id))
    .map((z) => {
      const relative = parseZettelId(z.id)!.segments.slice(fromDepth)
      const moved = relative.map((seg, i) =>
        ordinalToSegment(segmentOrdinal(seg), segmentKind(toDepth + i))
      )
      return { path: z.path, oldId: z.id, newId: toId + moved.join('') }
    })

  const newIds = new Set(renames.map((r) => r.newId))
  const conflicts = zettels.filter((z) => !inTree(z.id) && newIds.has(z.id)).map((z) => z.id)
  return { renames, conflicts }
}

/** Plan moving `fromId` and its descendants to the end of `parentId`'s children */
export function planMoveUnder(
  zettels: Array<{ path: string; id: string }>,
  fromId: string,
  parentId: string
): { renames: SubtreeRename[]; conflicts: string[] } | { error: string } {
  if (parentId === fromId || isDescendantOf(parentId, fromId)) {
    return { error: "Can't move a zettel under itself or one of its descendants" }
  }
  return planSubtreeMove(
    zettels,
    fromId,
    nextFreeChildId(
      parentId,
      zettels.map((z) => z.id)
    )
  )
}
