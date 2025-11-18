import { Plugin } from "obsidian";
import { CommandManager } from "./src/commands/CommandManager";
import {
	ZettelkastenPluginSettings,
	DEFAULT_SETTINGS,
} from "./src/settings/PluginSettings";
import { ZettelkastenSettingTab } from "./src/settings/SettingsTab";
import {
	ZettelkastenExplorerView,
	ZETTELKASTEN_EXPLORER_VIEW_TYPE,
} from "./src/views/ZettelkastenExplorerView";

export default class ZettelkastenPlugin extends Plugin {
	settings: ZettelkastenPluginSettings;
	private commandManager: CommandManager;

	async onload() {
		await this.loadSettings();

		// Register custom view
		this.registerView(
			ZETTELKASTEN_EXPLORER_VIEW_TYPE,
			(leaf) => new ZettelkastenExplorerView(leaf, this),
		);

		// Add ribbon icon to open the view
		this.addRibbonIcon("network", "Open Zettelkasten Explorer", () => {
			this.activateView();
		});

		// Add command to open the view
		this.addCommand({
			id: "open-zettelkasten-explorer",
			name: "Open Zettelkasten Explorer",
			callback: () => {
				this.activateView();
			},
		});

		// Initialize and register commands
		this.commandManager = new CommandManager(this);
		this.commandManager.registerCommands();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ZettelkastenSettingTab(this.app, this));
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf = workspace.getLeavesOfType(
			ZETTELKASTEN_EXPLORER_VIEW_TYPE,
		)[0];

		if (!leaf) {
			// Create new leaf in right sidebar
			leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({
				type: ZETTELKASTEN_EXPLORER_VIEW_TYPE,
				active: true,
			});
		}

		// Reveal the leaf
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
		console.log("Loaded settings:", JSON.stringify(this.settings, null, 2));
	}

	async saveSettings() {
		await this.saveData(this.settings);
		console.log("Saved settings:", JSON.stringify(this.settings, null, 2));
	}
}
