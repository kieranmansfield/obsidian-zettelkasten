/* eslint-disable @typescript-eslint/no-explicit-any */
import { Notice } from 'obsidian'
import { ZettelService } from '../services/ZettelService'
import { FileCreator } from '../services/file/FileCreator'

export default class CreateSiblingCommand {
  static register(plugin: any) {
    const service = new ZettelService(plugin.app, plugin.settings)

    plugin.addCommand({
      id: 'zk-create-sibling',
      name: 'Create Sibling Zettel',
      callback: async () => {
        const activeFile = plugin.app.workspace.getActiveFile()
        if (!activeFile) return new Notice('No active zettel')

        const parentId = service.getParentId(service.extractZettelId(activeFile.basename) || '')
        if (parentId === null) return new Notice('Cannot determine parent for active zettel')

        const siblingFiles = await service.getChildFiles(parentId)
        const lastSibling = siblingFiles[siblingFiles.length - 1]
        const lastId = lastSibling ? service.extractZettelId(lastSibling.basename) || '' : parentId

        const siblingId = await service.generateChildId(parentId, plugin.app.vault.getRoot())
        const title = `${siblingId} New sibling`
        const path = `${plugin.app.vault.getRoot().path}/${title}.md`

        const creator = new FileCreator(
          plugin.app,
          path,
          title,
          () => {
            new Notice(`Created sibling zettel: ${siblingId}`)
          },
          plugin.settings.noteTemplatePath
        )

        await creator.create()
      },
    })
  }
}
