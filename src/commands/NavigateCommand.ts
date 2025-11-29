/* eslint-disable @typescript-eslint/no-explicit-any */
import { NavigationService } from '../services/NavigationService'
import { ZettelService } from '../services/ZettelService'

export default class NavigateCommand {
  static register(plugin: any) {
    const service = new ZettelService(plugin.app, plugin.settings)
    const nav = new NavigationService(plugin.app, service)

    const commands = [
      { id: 'zk-goto-parent', name: 'Go to Parent', action: nav.gotoParent },
      { id: 'zk-goto-first-child', name: 'Go to First Child', action: nav.gotoFirstChild },
      { id: 'zk-goto-next-sibling', name: 'Go to Next Sibling', action: nav.gotoNextSibling },
      { id: 'zk-goto-prev-sibling', name: 'Go to Prev Sibling', action: nav.gotoPrevSibling },
    ]

    for (const cmd of commands) {
      plugin.addCommand({
        id: cmd.id,
        name: `Zettel: ${cmd.name}`,
        callback: async () => {
          const file = plugin.app.workspace.getActiveFile()
          if (!file) return
          await cmd.action.call(nav, file)
        },
      })
    }
  }
}
