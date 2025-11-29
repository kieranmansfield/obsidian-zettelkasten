/* eslint-disable @typescript-eslint/no-explicit-any */

import { ReorderModal } from '../ui/modal/ReorderModal'


import { BoxManager } from '../core/box/BoxManager'

import { ZettelFilesystem } from '../core/ZettelFilesystem'

import { ZettelRefactor } from '../core/zettel/ZettelRefactor'

export default class ReorderCommand {
  static register(plugin: any) {
    plugin.addCommand({
      id: 'zk-open-reorder',
      name: 'Zettel: Open Reorder Modal (default box)',
      callback: async () => {
        const bm = new BoxManager(plugin)
        await bm.load()
        const box = bm.getBoxes()[0]
        const fs = new ZettelFilesystem(plugin.app)
        const forest = await fs.buildForestForFolder(box.folder)
        const modal = new ReorderModal(plugin.app, forest, box, async (compaction) => {
          const refactor = new ZettelRefactor(plugin.app, bm, {} as any, {} as any)
          await refactor.applyRenameMap(compaction.filePathRenameMap, 'Reorder apply')
        })
        modal.open()
      },
    })
  }
}
