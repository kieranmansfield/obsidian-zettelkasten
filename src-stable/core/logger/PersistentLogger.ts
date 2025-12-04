import type { Plugin } from "obsidian";
export type LogType = "info"|"rename"|"reorder"|"conflict"|"undo"|"error";
export interface ZkLogEntry{ id:string; type:LogType; ts:number; msg:string; data?:Record<string,unknown>; }
export interface ZkLogStore{ entries: ZkLogEntry[]; }
export class PersistentLogger {
  private store: ZkLogStore = { entries: [] };
  constructor(private plugin: Plugin){}
  async load(): Promise<void>{ const raw=await this.plugin.loadData(); this.store = raw?.zklogs ?? { entries: [] }; }
  async save(): Promise<void>{ const raw=await this.plugin.loadData() ?? {}; raw.zklogs = this.store; await this.plugin.saveData(raw); }
  private makeId(){ return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2); }
  add(type:LogType,msg:string,data?:Record<string,unknown>){ this.store.entries.push({ id:this.makeId(), type, ts:Date.now(), msg, data }); }
  getAll(){ return this.store.entries; }
  clear(){ this.store.entries = []; }
}
export default PersistentLogger
