/* eslint-disable @typescript-eslint/no-explicit-any */
import { Notice } from 'obsidian'
import { ZettelService } from '../services/ZettelService'

export default class CreateZettelCommand {
  static register(plugin: any) {
    const service = new ZettelService(plugin.app, plugin.settings)

    plugin.addCommand({
      id: 'zk-create-zettel',
      name: 'Zettel: Create new note in default box',
      callback: async () => {
        const boxes = plugin.boxManager.getBoxes()
        const box = boxes[0]
        if (!box) return new Notice('No box configured')

        const id = await service.generateZettelId()
        const title = `${id} New note`
        const path = `${box.folder}/${title}.md`

        try {
          await plugin.app.vault.create(path, `# ${title}\n`)
          new Notice(`Created ${title}`)
        } catch (err) {
          console.error(err)
          new Notice('Failed to create zettel')
        }
      },
    })
  }
}
