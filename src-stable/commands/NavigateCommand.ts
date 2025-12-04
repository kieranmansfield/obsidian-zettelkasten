import { ContextNavigator } from "../ui/navigation/ContextNavigator";
export class NavigateCommand {
  static register(plugin:any){
    const fs = new (require('../core/ZettelFilesystem').ZettelFilesystem)(plugin.app);
    const nav = new ContextNavigator(plugin.app, fs);
    plugin.addCommand({ id:'zk-goto-parent', name:'Zettel: Go to Parent', callback: async()=>{ const file = plugin.app.workspace.getActiveFile(); if(!file) return; await nav.gotoParent(file); }});
    plugin.addCommand({ id:'zk-goto-first-child', name:'Zettel: Go to First Child', callback: async()=>{ const file = plugin.app.workspace.getActiveFile(); if(!file) return; await nav.gotoFirstChild(file); }});
    plugin.addCommand({ id:'zk-goto-next-sibling', name:'Zettel: Go to Next Sibling', callback: async()=>{ const file = plugin.app.workspace.getActiveFile(); if(!file) return; await nav.gotoNextSibling(file); }});
    plugin.addCommand({ id:'zk-goto-prev-sibling', name:'Zettel: Go to Prev Sibling', callback: async()=>{ const file = plugin.app.workspace.getActiveFile(); if(!file) return; await nav.gotoPrevSibling(file); }});
  }
}
export default NavigateCommand
