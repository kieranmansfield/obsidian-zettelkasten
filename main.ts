import { Plugin } from "obsidian";
import { ZettelkastenPluginSettings, DEFAULT_SETTINGS } from "./src/settings/PluginSettings";
import { ZettelkastenSettingTab } from "./src/settings/SettingsTab";
import { CommandManager } from "./src/commands/CommandManager";
import { ZettelkastenView, VIEW_TYPE_ZETTELKASTEN } from "./src/ui/ZettelkastenView";
import { NoteSequencesView, VIEW_TYPE_NOTE_SEQUENCES } from "./src/ui/NoteSequencesView";

export default class ZettelkastenPlugin extends Plugin {
	settings: ZettelkastenPluginSettings;
	commandManager: CommandManager;

	async onload() {
		await this.loadSettings();

		// Register the Zettelkasten view
		this.registerView(
			VIEW_TYPE_ZETTELKASTEN,
			(leaf) => new ZettelkastenView(leaf, this)
		);

		// Register the Note Sequences view
		this.registerView(
			VIEW_TYPE_NOTE_SEQUENCES,
			(leaf) => new NoteSequencesView(leaf, this)
		);

		// Initialize command manager
		this.commandManager = new CommandManager(this);

		// Register all commands
		this.commandManager.registerCommands();

		// Add settings tab
		this.addSettingTab(new ZettelkastenSettingTab(this.app, this));

		// Activate the view if enabled in settings
		if (this.settings.enableZettelkastenPanel) {
			this.activateView();
		}
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf = workspace.getLeavesOfType(VIEW_TYPE_ZETTELKASTEN)[0];
		if (!leaf) {
			const newLeaf = workspace.getLeftLeaf(false);
			if (newLeaf) {
				await newLeaf.setViewState({
					type: VIEW_TYPE_ZETTELKASTEN,
					active: true,
				});
				leaf = newLeaf;
			}
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	async deactivateView() {
		const { workspace } = this.app;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_ZETTELKASTEN);
		for (const leaf of leaves) {
			leaf.detach();
		}
	}

	async loadSettings() {
		const loadedData = (await this.loadData()) as any;

		// Start with default settings
		this.settings = Object.assign({}, DEFAULT_SETTINGS);

		// Merge loaded data
		if (loadedData) {
			this.settings = Object.assign(this.settings, loadedData);

			// Migrate old MOCs/Indexes if needed
			if (loadedData.enableMocs !== undefined && loadedData.enableIndexes === undefined) {
				// Old data had separate MOCs and Indexes
				this.settings.enableStructureNotes = loadedData.enableMocs || loadedData.enableIndexes;
				this.settings.structureNoteMode = loadedData.enableMocs ? "moc" : "zettelkasten";

				// Use MOC settings if enabled, otherwise use index settings
				if (loadedData.enableMocs) {
					this.settings.structureNotesUseSeparateLocation = loadedData.mocsUseSeparateLocation;
					this.settings.structureNotesLocation = loadedData.mocsLocation || "";
					this.settings.mocTemplatePath = loadedData.mocsTemplatePath || "";
					this.settings.structureNotesUseZettelId = loadedData.mocsUseZettelId;
					this.settings.structureNotesFilenameFormat = loadedData.mocsFilenameFormat || "{{title}} Index";
					this.settings.structureNotesTag = loadedData.mocsTag || "index";
					this.settings.useStructureNotesPrefix = loadedData.useMocsPrefix;
					this.settings.structureNotesPrefix = loadedData.mocsPrefix || "i";
				}

				await this.saveSettings();
			}

			// Migrate enableIndexes to enableStructureNotes (new rename)
			if (loadedData.enableIndexes !== undefined && loadedData.enableStructureNotes === undefined) {
				this.settings.enableStructureNotes = loadedData.enableIndexes;
				this.settings.structureNoteMode = loadedData.indexMode || "moc";
				this.settings.structureNotesUseSeparateLocation = loadedData.indexesUseSeparateLocation;
				this.settings.structureNotesLocation = loadedData.indexesLocation || "";

				// Migrate template path based on mode
				if (loadedData.indexMode === "moc") {
					this.settings.mocTemplatePath = loadedData.indexesTemplatePath || "";
				} else {
					this.settings.zkIndexTemplatePath = loadedData.indexesTemplatePath || "";
				}

				this.settings.structureNotesUseZettelId = loadedData.indexesUseZettelId;
				this.settings.structureNotesFilenameFormat = loadedData.indexesFilenameFormat || "{{title}} Index";
				this.settings.structureNotesTag = loadedData.indexesTag || "index";
				this.settings.useStructureNotesPrefix = loadedData.useIndexesPrefix;
				this.settings.structureNotesPrefix = loadedData.indexesPrefix || "i";

				await this.saveSettings();
			}

			// Migrate enableFleetingNotes to enableInbox
			if (loadedData.enableFleetingNotes !== undefined && loadedData.enableInbox === undefined) {
				this.settings.enableInbox = loadedData.enableFleetingNotes;
				// Default to fleeting mode to preserve existing behavior
				this.settings.inboxMode = "fleeting";
				// Use fleeting notes location as inbox location if it was set
				if (loadedData.fleetingNotesUseSeparateLocation && loadedData.fleetingNotesLocation) {
					this.settings.inboxLocation = loadedData.fleetingNotesLocation;
				}
				await this.saveSettings();
			}

			// Migrate enableSequenceReorder to enableNoteSequence
			if (loadedData.enableSequenceReorder !== undefined && loadedData.enableNoteSequence === undefined) {
				this.settings.enableNoteSequence = loadedData.enableSequenceReorder;
				await this.saveSettings();
			}
		}

		console.log("Loaded settings:", JSON.stringify(this.settings, null, 2));
	}

	async saveSettings() {
		await this.saveData(this.settings);
		console.log("Saved settings:", JSON.stringify(this.settings, null, 2));

		// Refresh the panel view when settings change
		this.refreshPanelView();
	}

	refreshPanelView() {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_ZETTELKASTEN);
		leaves.forEach(leaf => {
			if (leaf.view instanceof ZettelkastenView) {
				leaf.view.refresh();
			}
		});
	}
}
