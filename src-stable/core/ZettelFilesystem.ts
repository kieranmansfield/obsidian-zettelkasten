import { App, TFile } from "obsidian";
import { ZettelId } from "./ZettelID";
import ZettelTreeImmutable from "./ZettelTreeImmutable";

export class ZettelFilesystem {
  constructor(private app: App) {}
  public async listMarkdownFiles(folder?: string): Promise<TFile[]> {
    const files = this.app.vault.getMarkdownFiles();
    if(!folder) return files;
    return files.filter(f=>f.path.startsWith(folder+'/'));
  }
  public toFileRecords(files: TFile[]) {
    return files.map(f=>({ idString: f.basename, path: f.path, basename: f.basename })).filter(r=>{ try{ new ZettelId(r.idString); return true;}catch{return false;}});
  }
  public async buildForestForFolder(folder?: string) {
    const files = await this.listMarkdownFiles(folder);
    const recs = this.toFileRecords(files);
    return ZettelTreeImmutable.buildForestFromFiles(recs);
  }
  public getFileByPath(path:string): TFile|null {
    const f = this.app.vault.getAbstractFileByPath(path); return f && f instanceof TFile ? f : null;
  }
}
export default ZettelFilesystem
