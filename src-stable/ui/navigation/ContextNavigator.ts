import { App, TFile } from "obsidian";
import ZettelFilesystem from "../../core/ZettelFilesystem";
import type { ZettelNode } from "../../core/ZettelTreeImmutable";
export class ContextNavigator {
  constructor(private app: App, private fs: ZettelFilesystem, private boxFolder?: string){}
  private async getForest(): Promise<ZettelNode[]>{ return await this.fs.buildForestForFolder(this.boxFolder); }
  private findNode(forest: ZettelNode[], idStr: string): ZettelNode|null{ const stack=[...forest]; while(stack.length){ const n = stack.pop()!; if(n.id.toString()===idStr) return n; stack.push(...n.children);} return null; }
  private findParent(forest: ZettelNode[], target: ZettelNode): ZettelNode|null{ const stack = forest.map(n=>({node:n,parent:null as ZettelNode|null})); while(stack.length){ const cur = stack.pop()!; if(cur.node.id.toString()===target.id.toString()) return cur.parent; for(const c of cur.node.children) stack.push({node:c,parent:cur.node}); } return null; }
  private async openFileById(idStr:string){ if(!this.boxFolder) return; const path = `${this.boxFolder}/${idStr}.md`; const f = this.app.vault.getAbstractFileByPath(path); if(f && f instanceof TFile){ const leaf = this.app.workspace.getLeaf(); await leaf.openFile(f); } }
  public async gotoParent(file: TFile){ if(!file) return; const idStr = file.basename.replace(/\.md$/i,""); const forest = await this.getForest(); const node = this.findNode(forest,idStr); if(!node) return; const parent = this.findParent(forest,node); if(parent) await this.openFileById(parent.id.toString()); }
  public async gotoFirstChild(file: TFile){ if(!file) return; const idStr = file.basename.replace(/\.md$/i,""); const forest = await this.getForest(); const node = this.findNode(forest,idStr); if(!node||node.children.length===0) return; await this.openFileById(node.children[0].id.toString()); }
  public async gotoNextSibling(file: TFile){ if(!file) return; const idStr = file.basename.replace(/\.md$/i,""); const forest = await this.getForest(); const node = this.findNode(forest,idStr); if(!node) return; const parent = this.findParent(forest,node); const siblings = parent ? parent.children : forest; const idx = siblings.findIndex(s=>s.id.toString()===node.id.toString()); if(idx<0||idx===siblings.length-1) return; await this.openFileById(siblings[idx+1].id.toString()); }
  public async gotoPrevSibling(file: TFile){ if(!file) return; const idStr = file.basename.replace(/\.md$/i,""); const forest = await this.getForest(); const node = this.findNode(forest,idStr); if(!node) return; const parent = this.findParent(forest,node); const siblings = parent ? parent.children : forest; const idx = siblings.findIndex(s=>s.id.toString()===node.id.toString()); if(idx<=0) return; await this.openFileById(siblings[idx-1].id.toString()); }
}
export default ContextNavigator
