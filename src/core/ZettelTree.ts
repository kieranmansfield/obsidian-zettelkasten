import type { ZettelNode } from './zettel/ZettelNode'

export class ZettelTree {
  constructor(
    public root: ZettelNode,
    public nodes: Map<string, ZettelNode>
  ) {}
}
