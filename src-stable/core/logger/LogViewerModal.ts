import { Modal, Setting, ButtonComponent } from "obsidian";
import type PersistentLogger from "./PersistentLogger";
export class LogViewerModal extends Modal {
  constructor(app:any, private logger: PersistentLogger){ super(app); }
  onOpen(){ const { contentEl } = this; contentEl.empty(); contentEl.createEl("h2",{text:"Zettel Plugin Log"}); const entries = this.logger.getAll(); const wrap = contentEl.createEl("div"); wrap.style.maxHeight = "60vh"; wrap.style.overflow = "auto"; for(const e of entries.slice().reverse()){ const row = wrap.createEl("div"); row.createEl("div",{text:`[${new Date(e.ts).toLocaleString()}] ${e.type}: ${e.msg}`}); if(e.data){ const pre = row.createEl("pre"); pre.textContent = JSON.stringify(e.data,null,2); } } new Setting(contentEl).addButton((b:ButtonComponent)=>b.setButtonText("Close").onClick(()=>this.close())).addButton((b:ButtonComponent)=>b.setButtonText("Clear").onClick(async()=>{ this.logger.clear(); await this.logger.save(); this.close(); })); }
  onClose(){ this.contentEl.empty(); }
}
export default LogViewerModal
