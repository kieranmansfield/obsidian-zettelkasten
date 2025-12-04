import { Plugin, Notice } from "obsidian";
import { BoxManager } from "./core/BoxManager";
import { ZettelFilesystem } from "./core/ZettelFilesystem";
import { PersistentLogger } from "./core/logger/PersistentLogger";
import { ZettelTreeImmutable } from "./core/ZettelTreeImmutable";
import { ContextNavigator } from "./ui/navigation/ContextNavigator";
import { ReorderModal } from "./ui/reorder/ReorderModal";
import { IDInspectorModal } from "./ui/inspector/IDInspectorModal";
import { registerAllCommands } from "./commands/registerCommands";

export default class ZkPlugin extends Plugin {
  logger!: PersistentLogger;
  fs!: ZettelFilesystem;
  async onload() {
    console.log("ZkPlugin loaded");
    this.logger = new PersistentLogger(this);
    await this.logger.load();
    this.fs = new ZettelFilesystem(this.app);
    registerAllCommands(this);
    this.addCommand({
      id: "zk-open-logs",
      name: "Zettel: Open Logs",
      callback: async () => {
        const { LogViewerModal } = await import("./core/logger/LogViewerModal");
        new LogViewerModal(this.app, this.logger).open();
      }
    });
    new Notice("Zettel plugin (generated) loaded — check console");
  }
  onunload() {
    console.log("ZkPlugin unloaded");
  }
}
