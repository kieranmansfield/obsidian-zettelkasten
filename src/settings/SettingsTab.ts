import { App, PluginSettingTab, Setting } from "obsidian";
import type ZettelkastenPlugin from "../../main";
import { FolderSuggest } from "../ui/FolderSuggest";
import { FileSuggest } from "../ui/FileSuggest";
import { TagSuggest } from "../ui/TagSuggest";
import { Box, BoxType } from "./PluginSettings";

// Settings tab for the Zettelkasten plugin

export class ZettelkastenSettingTab extends PluginSettingTab {
	plugin: ZettelkastenPlugin;
	private activeTab: string = "general";

	constructor(app: App, plugin: ZettelkastenPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// Create tab navigation
		this.createTabNavigation(containerEl);

		// Create container for tab content
		const contentEl = containerEl.createDiv(
			"zettelkasten-settings-content",
		);

		// Display the active tab content
		if (this.activeTab === "general") {
			this.displayGeneralSettings(contentEl);
		} else if (this.activeTab === "boxes") {
			this.displayBoxesSettings(contentEl);
		} else if (this.activeTab.startsWith("box-")) {
			// Handle individual box tabs
			const boxId = this.activeTab.substring(4);
			const box = this.plugin.settings.boxes.find((b) => b.id === boxId);
			if (box) {
				this.displayBoxConfiguration(contentEl, box);
			}
		} else {
			switch (this.activeTab) {
				case "zettel":
					this.displayZettelSettings(contentEl);
					break;
				case "fleeting":
					this.displayFleetingSettings(contentEl);
					break;
				case "moc":
					this.displayMocSettings(contentEl);
					break;
				case "index":
					this.displayIndexSettings(contentEl);
					break;
			}
		}
	}

	private createTabNavigation(containerEl: HTMLElement): void {
		const tabBar = containerEl.createDiv("zettelkasten-settings-tabs");

		const tabs = [
			{ id: "general", name: "General" },
			...(this.plugin.settings.enableBoxes
				? [{ id: "boxes", name: "Boxes" }]
				: []),
			...(this.plugin.settings.enableBoxes
				? this.plugin.settings.boxes.map((box) => ({
						id: `box-${box.id}`,
						name: box.name,
					}))
				: []),
			...(!this.plugin.settings.enableBoxes
				? [
						{ id: "zettel", name: "Zettel" },
						{ id: "fleeting", name: "Fleeting Notes" },
						{ id: "moc", name: "MOCs" },
						{ id: "index", name: "Indexes" },
					]
				: []),
		];
		tabs.forEach((tab) => {
			const tabEl = tabBar.createDiv("zettelkasten-settings-tab");
			if (this.activeTab === tab.id) {
				tabEl.addClass("is-active");
			}
			tabEl.setText(tab.name);
			tabEl.addEventListener("click", () => {
				this.activeTab = tab.id;
				this.display();
			});
		});
	}

	private displayGeneralSettings(containerEl: HTMLElement): void {
		containerEl.createEl("h2", { text: "General Settings" });
		containerEl.createEl("p", {
			text: "Configure general plugin behavior.",
			cls: "setting-item-description",
		});

		// New Note Location
		new Setting(containerEl)
			.setName("New note location")
			.setDesc(
				"Default folder path where new notes will be created (leave empty for vault root)",
			)
			.addText((text) => {
				const onSelect = async (value: string) => {
					text.setValue(value);
					this.plugin.settings.newNoteLocation = value;
					await this.plugin.saveSettings();
				};
				new FolderSuggest(this.app, text.inputEl, onSelect);
				text.setPlaceholder("path/to/folder")
					.setValue(this.plugin.settings.newNoteLocation)
					.onChange(async (value) => {
						this.plugin.settings.newNoteLocation = value;
						await this.plugin.saveSettings();
					});
			});

		// Ignored Folders
		const ignoredFoldersSetting = new Setting(containerEl)
			.setName("Ignored folders")
			.setDesc(
				"Folder paths to exclude from commands. Click + to add more.",
			);

		// Add button to create new folder input
		ignoredFoldersSetting.addButton((button) => {
			button
				.setButtonText("+")
				.setTooltip("Add folder")
				.onClick(async () => {
					this.plugin.settings.ignoredFolders.push("");
					await this.plugin.saveSettings();
					this.display();
				});
		});

		// Display existing ignored folders
		this.plugin.settings.ignoredFolders.forEach((folder, index) => {
			new Setting(containerEl)
				.setClass("zettelkasten-ignored-folder-item")
				.addText((text) => {
					const onSelect = async (value: string) => {
						text.setValue(value);
						this.plugin.settings.ignoredFolders[index] = value;
						await this.plugin.saveSettings();
					};
					new FolderSuggest(this.app, text.inputEl, onSelect);
					text.setPlaceholder("folder/path")
						.setValue(folder)
						.onChange(async (value) => {
							this.plugin.settings.ignoredFolders[index] = value;
							await this.plugin.saveSettings();
						});
				})
				.addButton((button) => {
					button
						.setIcon("trash")
						.setTooltip("Remove folder")
						.onClick(async () => {
							this.plugin.settings.ignoredFolders.splice(
								index,
								1,
							);
							await this.plugin.saveSettings();
							this.display();
						});
				});
		});

		// Enable Boxes
		new Setting(containerEl)
			.setName("Enable boxes (Beta)")
			.setDesc(
				"Enable multiple zettelkasten boxes within your vault. Each box can be folder-based or tag-based.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableBoxes)
					.onChange(async (value) => {
						const wasEnabled = this.plugin.settings.enableBoxes;
						this.plugin.settings.enableBoxes = value;

						if (value && !wasEnabled) {
							// Enabling boxes: migrate current settings to a default box if no boxes exist
							if (this.plugin.settings.boxes.length === 0) {
								const defaultBox: Box = {
									id: Date.now().toString(),
									name: "Default Box",
									type: "folder",
									folderPath:
										this.plugin.settings.zettelsLocation ||
										"",
									// Box prefix defaults
									useBoxPrefix: false,
									boxPrefix: "",
									// Copy zettel settings
									zettelIdFormat:
										this.plugin.settings.zettelIdFormat,
									useSeparatorFormat:
										this.plugin.settings.useSeparatorFormat,
									zettelIdSeparator:
										this.plugin.settings.zettelIdSeparator,
									zettelIdMatchingMode:
										this.plugin.settings
											.zettelIdMatchingMode,
									noteTemplatePath:
										this.plugin.settings.noteTemplatePath,
									zettelTag: this.plugin.settings.zettelTag,
									enableSequenceReorder:
										this.plugin.settings
											.enableSequenceReorder,
									useZettelPrefix:
										this.plugin.settings.useZettelPrefix,
									zettelPrefix:
										this.plugin.settings.zettelPrefix,
									// Copy fleeting notes settings
									enableFleetingNotes:
										this.plugin.settings
											.enableFleetingNotes,
									fleetingNotesUseSeparateLocation:
										this.plugin.settings
											.fleetingNotesUseSeparateLocation,
									fleetingNotesLocation:
										this.plugin.settings
											.fleetingNotesLocation,
									fleetingNotesTemplatePath:
										this.plugin.settings
											.fleetingNotesTemplatePath,
									fleetingNotesUseZettelId:
										this.plugin.settings
											.fleetingNotesUseZettelId,
									fleetingNotesFilenameFormat:
										this.plugin.settings
											.fleetingNotesFilenameFormat,
									fleetingNotesTag:
										this.plugin.settings.fleetingNotesTag,
									useFleetingNotesPrefix:
										this.plugin.settings
											.useFleetingNotesPrefix,
									fleetingNotesPrefix:
										this.plugin.settings
											.fleetingNotesPrefix,
									// Copy MOCs settings
									enableMocs: this.plugin.settings.enableMocs,
									mocsUseSeparateLocation:
										this.plugin.settings
											.mocsUseSeparateLocation,
									mocsLocation:
										this.plugin.settings.mocsLocation,
									mocsTemplatePath:
										this.plugin.settings.mocsTemplatePath,
									mocsUseZettelId:
										this.plugin.settings.mocsUseZettelId,
									mocsFilenameFormat:
										this.plugin.settings.mocsFilenameFormat,
									mocsTag: this.plugin.settings.mocsTag,
									useMocsPrefix:
										this.plugin.settings.useMocsPrefix,
									mocsPrefix: this.plugin.settings.mocsPrefix,
									// Copy indexes settings
									enableIndexes:
										this.plugin.settings.enableIndexes,
									indexesUseSeparateLocation:
										this.plugin.settings
											.indexesUseSeparateLocation,
									indexesLocation:
										this.plugin.settings.indexesLocation,
									indexesTemplatePath:
										this.plugin.settings
											.indexesTemplatePath,
									indexesUseZettelId:
										this.plugin.settings.indexesUseZettelId,
									indexesFilenameFormat:
										this.plugin.settings
											.indexesFilenameFormat,
									indexesTag: this.plugin.settings.indexesTag,
									useIndexesPrefix:
										this.plugin.settings.useIndexesPrefix,
									indexesPrefix:
										this.plugin.settings.indexesPrefix,
									// Command opt-in defaults
									enableIndividualCommands: {
										quickZettel: true, // Enabled by default
										openZettel: false,
										openParent: false,
										openChild: false,
										openSibling: false,
										navigator: false,
										reorderSequence: false,
										nextSequence: false,
										previousSequence: false,
										nextChild: false,
										previousChild: false,
										goUpLevel: false,
										goDownLevel: false,
										assignParent: false,
										assignChild: false,
										moveToRoot: false,
										createNote: false,
										createChild: false,
										createSibling: false,
										indent: false,
										outdent: false,
										openFleeting: false,
										createFleeting: false,
										openMoc: false,
										createMoc: false,
										openIndex: false,
										createIndex: false,
										moveToCorrectLocation: false,
										batchMoveToCorrectLocation: false,
										tagAsCorrectType: false,
										batchTagAsCorrectType: false,
										fixFilenames: false,
										batchFixFilenames: false,
										fixMocFilename: false,
										batchFixMocFilenames: false,
										fixIndexFilename: false,
										batchFixIndexFilenames: false,
									},
								};
								this.plugin.settings.boxes.push(defaultBox);
							}
						} else if (!value && wasEnabled) {
							// Disabling boxes: migrate first box settings back to global if exactly one box exists
							if (this.plugin.settings.boxes.length === 1) {
								const box = this.plugin.settings.boxes[0];
								// Copy zettel settings back
								this.plugin.settings.zettelIdFormat =
									box.zettelIdFormat;
								this.plugin.settings.zettelIdSeparator =
									box.zettelIdSeparator;
								this.plugin.settings.zettelIdMatchingMode =
									box.zettelIdMatchingMode;
								this.plugin.settings.noteTemplatePath =
									box.noteTemplatePath;
								this.plugin.settings.zettelTag = box.zettelTag;
								this.plugin.settings.enableSequenceReorder =
									box.enableSequenceReorder;
								if (box.type === "folder") {
									this.plugin.settings.zettelsUseSeparateLocation =
										!!box.folderPath;
									this.plugin.settings.zettelsLocation =
										box.folderPath || "";
								}
								// Copy fleeting notes settings back
								this.plugin.settings.enableFleetingNotes =
									box.enableFleetingNotes;
								this.plugin.settings.fleetingNotesUseSeparateLocation =
									box.fleetingNotesUseSeparateLocation;
								this.plugin.settings.fleetingNotesLocation =
									box.fleetingNotesLocation;
								this.plugin.settings.fleetingNotesTemplatePath =
									box.fleetingNotesTemplatePath;
								this.plugin.settings.fleetingNotesUseZettelId =
									box.fleetingNotesUseZettelId;
								this.plugin.settings.fleetingNotesFilenameFormat =
									box.fleetingNotesFilenameFormat;
								this.plugin.settings.fleetingNotesTag =
									box.fleetingNotesTag;
								// Copy MOCs settings back
								this.plugin.settings.enableMocs =
									box.enableMocs;
								this.plugin.settings.mocsUseSeparateLocation =
									box.mocsUseSeparateLocation;
								this.plugin.settings.mocsLocation =
									box.mocsLocation;
								this.plugin.settings.mocsTemplatePath =
									box.mocsTemplatePath;
								this.plugin.settings.mocsUseZettelId =
									box.mocsUseZettelId;
								this.plugin.settings.mocsFilenameFormat =
									box.mocsFilenameFormat;
								this.plugin.settings.mocsTag = box.mocsTag;
								// Copy indexes settings back
								this.plugin.settings.enableIndexes =
									box.enableIndexes;
								this.plugin.settings.indexesUseSeparateLocation =
									box.indexesUseSeparateLocation;
								this.plugin.settings.indexesLocation =
									box.indexesLocation;
								this.plugin.settings.indexesTemplatePath =
									box.indexesTemplatePath;
								this.plugin.settings.indexesUseZettelId =
									box.indexesUseZettelId;
								this.plugin.settings.indexesFilenameFormat =
									box.indexesFilenameFormat;
								this.plugin.settings.indexesTag =
									box.indexesTag;
							}
						}

						await this.plugin.saveSettings();

						// Reload the plugin to properly clear and re-register all commands
						const pluginId = this.plugin.manifest.id;
						const app = this.plugin.app as any;
						await app.plugins.disablePlugin(pluginId);
						await app.plugins.enablePlugin(pluginId);

						// Reopen settings after reload
						setTimeout(() => {
							app.setting.open();
							app.setting.openTabById(pluginId);
						}, 100);
					}),
			);
	}
	private displayBoxesSettings(containerEl: HTMLElement): void {
		containerEl.createEl("h2", { text: "Boxes" });
		containerEl.createEl("p", {
			text: "Configure multiple zettelkasten boxes within your vault.",
			cls: "setting-item-description",
		});

		containerEl.createEl("p", {
			text: "Each box can be folder-based or tag-based.",
			cls: "setting-item-description",
		});

		const maxBoxes = 5;
		const hasReachedLimit = this.plugin.settings.boxes.length >= maxBoxes;

		// Add Box button
		new Setting(containerEl)
			.setName("Add a new box")
			.setDesc(
				hasReachedLimit
					? `Maximum of ${maxBoxes} boxes reached`
					: "Create a new zettelkasten box",
			)
			.addButton((button) => {
				button
					.setButtonText("+ Add Box")
					.setCta()
					.setDisabled(hasReachedLimit)
					.onClick(async () => {
						const newBox: Box = {
							id: Date.now().toString(),
							name: "New Box",
							type: "folder",
							folderPath: "",
							// Box prefix defaults
							useBoxPrefix: false,
							boxPrefix: "",
							// Zettel settings defaults
							zettelIdFormat: "YYYYMMDDHHmmssSSS",
							useSeparatorFormat: false,
							zettelIdSeparator: "⁝ ",
							zettelIdMatchingMode: "separator",
							noteTemplatePath: "",
							zettelTag: "zettel",
							enableSequenceReorder: false,
							useZettelPrefix: false,
							zettelPrefix: "",
							// Fleeting notes defaults
							enableFleetingNotes: true,
							fleetingNotesUseSeparateLocation: false,
							fleetingNotesLocation: "",
							fleetingNotesTemplatePath: "",
							fleetingNotesUseZettelId: true,
							fleetingNotesFilenameFormat: "",
							fleetingNotesTag: "fleeting",
							useFleetingNotesPrefix: false,
							fleetingNotesPrefix: "",
							// MOCs defaults
							enableMocs: true,
							mocsUseSeparateLocation: false,
							mocsLocation: "",
							mocsTemplatePath: "",
							mocsUseZettelId: false,
							mocsFilenameFormat: "{{title}} MOC",
							mocsTag: "moc",
							useMocsPrefix: false,
							mocsPrefix: "",
							// Indexes defaults
							enableIndexes: true,
							indexesUseSeparateLocation: false,
							indexesLocation: "",
							indexesTemplatePath: "",
							indexesUseZettelId: false,
							indexesFilenameFormat: "{{title}} Index",
							indexesTag: "index",
							useIndexesPrefix: false,
							indexesPrefix: "",
							// Command opt-in defaults
							enableIndividualCommands: {
								quickZettel: true, // Enabled by default
								openZettel: false,
								openParent: false,
								openChild: false,
								openSibling: false,
								navigator: false,
								reorderSequence: false,
								nextSequence: false,
								previousSequence: false,
								nextChild: false,
								previousChild: false,
								goUpLevel: false,
								goDownLevel: false,
								assignParent: false,
								assignChild: false,
								moveToRoot: false,
								createNote: false,
								createChild: false,
								createSibling: false,
								indent: false,
								outdent: false,
								openFleeting: false,
								createFleeting: false,
								openMoc: false,
								createMoc: false,
								openIndex: false,
								createIndex: false,
								moveToCorrectLocation: false,
								batchMoveToCorrectLocation: false,
								tagAsCorrectType: false,
								batchTagAsCorrectType: false,
								fixFilenames: false,
								batchFixFilenames: false,
								fixMocFilename: false,
								batchFixMocFilenames: false,
								fixIndexFilename: false,
								batchFixIndexFilenames: false,
							},
						};
						this.plugin.settings.boxes.push(newBox);
						await this.plugin.saveSettings();
						this.display();
					});
			});

		// Display existing boxes
		if (this.plugin.settings.boxes.length === 0) {
			containerEl.createEl("p", {
				text: "No boxes configured yet. Click 'Add Box' to create your first box.",
				cls: "setting-item-description",
			});
		} else {
			this.plugin.settings.boxes.forEach((box, index) => {
				const boxContainer = containerEl.createDiv(
					"zettelkasten-box-item",
				);
				boxContainer.style.border =
					"1px solid var(--background-modifier-border)";
				boxContainer.style.borderRadius = "6px";
				boxContainer.style.padding = "16px";
				boxContainer.style.marginBottom = "16px";
				boxContainer.style.backgroundColor =
					"var(--background-primary-alt)";

				const boxHeader = boxContainer.createDiv();
				boxHeader.style.display = "flex";
				boxHeader.style.justifyContent = "space-between";
				boxHeader.style.alignItems = "center";
				boxHeader.style.marginBottom = "8px";

				const boxTitle = boxHeader.createEl("h3", { text: box.name });
				boxTitle.style.margin = "0";

				const boxType = boxContainer.createEl("p", {
					text: `Type: ${box.type === "folder" ? "Folder-based" : "Tag-based"}`,
					cls: "setting-item-description",
				});
				boxType.style.margin = "0 0 12px 0";

				if (box.type === "folder" && box.folderPath) {
					const folderInfo = boxContainer.createEl("p", {
						text: `Folder: ${box.folderPath}`,
						cls: "setting-item-description",
					});
					folderInfo.style.margin = "0 0 12px 0";
				} else if (box.type === "tag" && box.tagName) {
					const tagInfo = boxContainer.createEl("p", {
						text: `Tag: #${box.tagName}`,
						cls: "setting-item-description",
					});
					tagInfo.style.margin = "0 0 12px 0";
				}

				const buttonContainer = boxContainer.createDiv();
				buttonContainer.style.display = "flex";
				buttonContainer.style.gap = "8px";

				// Edit button
				const editButton = buttonContainer.createEl("button", {
					text: "Edit",
					cls: "mod-cta",
				});
				editButton.addEventListener("click", () => {
					this.activeTab = `box-${box.id}`;
					this.display();
				});

				// Delete button
				const deleteButton = buttonContainer.createEl("button", {
					text: "Delete",
					cls: "mod-warning",
				});
				deleteButton.addEventListener("click", async () => {
					const confirmMessage = `Are you sure you want to delete "${box.name}"? This will remove all box-specific settings but will not delete any notes.`;
					if (confirm(confirmMessage)) {
						this.plugin.settings.boxes.splice(index, 1);
						await this.plugin.saveSettings();
						this.display();
					}
				});
			});
		}
	}

	private displayBoxConfiguration(containerEl: HTMLElement, box: Box): void {
		const boxIndex = this.plugin.settings.boxes.findIndex(
			(b) => b.id === box.id,
		);
		if (boxIndex === -1) return;

		containerEl.createEl("h2", { text: `${box.name}` });

		// Box Basic Configuration Section
		containerEl.createEl("h3", { text: "Box Configuration" });

		// Box name
		new Setting(containerEl)
			.setName("Box name")
			.setDesc("A descriptive name for this box")
			.addText((text) =>
				text
					.setPlaceholder("My Zettelkasten")
					.setValue(box.name)
					.onChange(async (value) => {
						this.plugin.settings.boxes[boxIndex].name = value;
						await this.plugin.saveSettings();
						// Update tab name
						this.display();
					}),
			);

		// Box type selector
		new Setting(containerEl)
			.setName("Box type")
			.setDesc("Choose whether this box is folder-based or tag-based")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("folder", "Folder-based")
					.addOption("tag", "Tag-based")
					.setValue(box.type)
					.onChange(async (value: BoxType) => {
						this.plugin.settings.boxes[boxIndex].type = value;
						if (value === "folder") {
							this.plugin.settings.boxes[boxIndex].tagName =
								undefined;
						} else {
							this.plugin.settings.boxes[boxIndex].folderPath =
								undefined;
						}
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		// Folder path (shown when type is folder)
		if (box.type === "folder") {
			new Setting(containerEl)
				.setName("Folder path")
				.setDesc("The folder containing this box's notes")
				.addText((text) => {
					const onSelect = async (value: string) => {
						text.setValue(value);
						this.plugin.settings.boxes[boxIndex].folderPath = value;
						await this.plugin.saveSettings();
					};
					new FolderSuggest(this.app, text.inputEl, onSelect);
					text.setPlaceholder("path/to/box")
						.setValue(box.folderPath || "")
						.onChange(async (value) => {
							this.plugin.settings.boxes[boxIndex].folderPath =
								value;
							await this.plugin.saveSettings();
						});
				});
		}

		// Tag name (shown when type is tag)
		if (box.type === "tag") {
			new Setting(containerEl)
				.setName("Tag name")
				.setDesc("The tag identifying notes in this box (without #)")
				.addText((text) => {
					const onSelect = async (value: string) => {
						text.setValue(value);
						this.plugin.settings.boxes[boxIndex].tagName = value;
						await this.plugin.saveSettings();
					};
					new TagSuggest(this.app, text.inputEl, onSelect);
					text.setPlaceholder("box-name")
						.setValue(box.tagName || "")
						.onChange(async (value) => {
							this.plugin.settings.boxes[boxIndex].tagName =
								value;
							await this.plugin.saveSettings();
						});
				});
		}

		// Box Prefix Toggle
		new Setting(containerEl)
			.setName("Use box prefix")
			.setDesc(
				"Enable a prefix for all notes in this box (applies to all note types). This helps distinguish notes from different boxes.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(box.useBoxPrefix)
					.onChange(async (value) => {
						this.plugin.settings.boxes[boxIndex].useBoxPrefix = value;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		// Box Prefix (shown when enabled)
		if (box.useBoxPrefix) {
			new Setting(containerEl)
				.setName("Box prefix")
				.setDesc(
					"Prefix to add to all notes in this box (e.g., 'A', 'WORK', 'PERS')",
				)
				.addText((text) =>
					text
						.setPlaceholder("e.g., A, WORK, PERS")
						.setValue(box.boxPrefix || "")
						.onChange(async (value) => {
							this.plugin.settings.boxes[boxIndex].boxPrefix = value;
							await this.plugin.saveSettings();
						}),
				);
		}

		// Create sections for Zettel, Fleeting Notes, MOCs, and Indexes
		this.displayBoxZettelSettings(containerEl, box, boxIndex);
		this.displayBoxFleetingSettings(containerEl, box, boxIndex);
		this.displayBoxMocSettings(containerEl, box, boxIndex);
		this.displayBoxIndexSettings(containerEl, box, boxIndex);
		this.displayBoxCommandSettings(containerEl, box, boxIndex);
	}

	private displayBoxCommandSettings(
		containerEl: HTMLElement,
		box: Box,
		boxIndex: number,
	): void {
		containerEl.createEl("h3", { text: "Command Palette" });
		containerEl.createEl("p", {
			text: "By default, only the box command palette is shown. Enable individual commands below to expose them directly in the main command palette for quick access.",
			cls: "setting-item-description",
		});

		// Quick Actions Section
		const quickActionsDetails = containerEl.createEl("details");
		quickActionsDetails.style.backgroundColor =
			"var(--background-secondary)";
		quickActionsDetails.style.borderRadius = "var(--radius-s)";
		quickActionsDetails.style.padding = "12px";
		quickActionsDetails.style.marginTop = "1.5em";
		quickActionsDetails.style.marginBottom = "0.5em";
		const quickActionsSummary = quickActionsDetails.createEl("summary", {
			text: "Quick Actions",
		});
		quickActionsSummary.style.fontSize = "1.3em";
		quickActionsSummary.style.fontWeight = "600";
		quickActionsSummary.style.cursor = "pointer";
		quickActionsSummary.style.marginBottom = "8px";
		const quickActionsContent = quickActionsDetails.createDiv();

		new Setting(quickActionsContent)
			.setName("Quick Zettel")
			.setDesc(
				"Show 'Quick Zettel' command in main palette (instantly creates a zettel with template)",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.quickZettel)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.quickZettel = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);

		// Navigation Section
		const navigationDetails = containerEl.createEl("details");
		navigationDetails.style.backgroundColor = "var(--background-secondary)";
		navigationDetails.style.borderRadius = "var(--radius-s)";
		navigationDetails.style.padding = "12px";
		navigationDetails.style.marginTop = "1.5em";
		navigationDetails.style.marginBottom = "0.5em";
		const navigationSummary = navigationDetails.createEl("summary", {
			text: "Navigation",
		});
		navigationSummary.style.fontSize = "1.3em";
		navigationSummary.style.fontWeight = "600";
		navigationSummary.style.cursor = "pointer";
		navigationSummary.style.marginBottom = "8px";
		const navigationContent = navigationDetails.createDiv();

		new Setting(navigationContent)
			.setName("Open Zettel")
			.setDesc("Show 'Open Zettel' command in main palette")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.openZettel)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.openZettel = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);

		new Setting(navigationContent)
			.setName("Open Parent")
			.setDesc("Show 'Open Parent Zettel' command in main palette")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.openParent)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.openParent = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);

		new Setting(navigationContent)
			.setName("Open Child")
			.setDesc("Show 'Open Child Zettel' command in main palette")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.openChild)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.openChild = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);

		new Setting(navigationContent)
			.setName("Open Sibling")
			.setDesc("Show 'Open Sibling Zettel' command in main palette")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.openSibling)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.openSibling = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);

		new Setting(navigationContent)
			.setName("Navigator")
			.setDesc("Show 'Navigator' command in main palette")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.navigator)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.navigator = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);

		new Setting(navigationContent)
			.setName("Next Sequence")
			.setDesc("Show 'Next Sequence' command in main palette")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.nextSequence)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.nextSequence = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);

		new Setting(navigationContent)
			.setName("Previous Sequence")
			.setDesc("Show 'Previous Sequence' command in main palette")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.previousSequence)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.previousSequence = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);

		new Setting(navigationContent)
			.setName("Next Child")
			.setDesc("Show 'Next Child' command in main palette")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.nextChild)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.nextChild = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);

		new Setting(navigationContent)
			.setName("Previous Child")
			.setDesc("Show 'Previous Child' command in main palette")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.previousChild)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.previousChild = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);

		// Hierarchy Section
		const hierarchyDetails = containerEl.createEl("details");
		hierarchyDetails.style.backgroundColor = "var(--background-secondary)";
		hierarchyDetails.style.borderRadius = "var(--radius-s)";
		hierarchyDetails.style.padding = "12px";
		hierarchyDetails.style.marginTop = "1.5em";
		hierarchyDetails.style.marginBottom = "0.5em";
		const hierarchySummary = hierarchyDetails.createEl("summary", {
			text: "Hierarchy",
		});
		hierarchySummary.style.fontSize = "1.3em";
		hierarchySummary.style.fontWeight = "600";
		hierarchySummary.style.cursor = "pointer";
		hierarchySummary.style.marginBottom = "8px";
		const hierarchyContent = hierarchyDetails.createDiv();

		new Setting(hierarchyContent)
			.setName("Go Up Level")
			.setDesc("Show 'Go Up Level' command in main palette")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.goUpLevel)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.goUpLevel = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);

		new Setting(hierarchyContent)
			.setName("Go Down Level")
			.setDesc("Show 'Go Down Level' command in main palette")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.goDownLevel)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.goDownLevel = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);

		new Setting(hierarchyContent)
			.setName("Reorder Sequence")
			.setDesc("Show 'Reorder Sequence' command in main palette")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.reorderSequence)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.reorderSequence = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);

		new Setting(hierarchyContent)
			.setName("Assign Parent")
			.setDesc("Show 'Assign Parent' command in main palette")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.assignParent)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.assignParent = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);

		new Setting(hierarchyContent)
			.setName("Assign Child")
			.setDesc("Show 'Assign Child' command in main palette")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.assignChild)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.assignChild = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);

		new Setting(hierarchyContent)
			.setName("Indent")
			.setDesc("Show 'Indent Zettel' command in main palette")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.indent)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.indent = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);

		new Setting(hierarchyContent)
			.setName("Outdent")
			.setDesc("Show 'Outdent Zettel' command in main palette")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.outdent)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.outdent = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);

		// Creation Section
		const creationDetails = containerEl.createEl("details");
		creationDetails.style.backgroundColor = "var(--background-secondary)";
		creationDetails.style.borderRadius = "var(--radius-s)";
		creationDetails.style.padding = "12px";
		creationDetails.style.marginTop = "1.5em";
		creationDetails.style.marginBottom = "0.5em";
		const creationSummary = creationDetails.createEl("summary", {
			text: "Creation",
		});
		creationSummary.style.fontSize = "1.3em";
		creationSummary.style.fontWeight = "600";
		creationSummary.style.cursor = "pointer";
		creationSummary.style.marginBottom = "8px";
		const creationContent = creationDetails.createDiv();

		new Setting(creationContent)
			.setName("Create Note")
			.setDesc("Show 'Create Note' command in main palette")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.createNote)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.createNote = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);

		new Setting(creationContent)
			.setName("Create Child")
			.setDesc("Show 'Create Child Zettel' command in main palette")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.createChild)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.createChild = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);

		new Setting(creationContent)
			.setName("Create Sibling")
			.setDesc("Show 'Create Sibling Zettel' command in main palette")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.createSibling)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.createSibling = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);

		// Special Notes Section
		const specialNotesDetails = containerEl.createEl("details");
		specialNotesDetails.style.backgroundColor =
			"var(--background-secondary)";
		specialNotesDetails.style.borderRadius = "var(--radius-s)";
		specialNotesDetails.style.padding = "12px";
		specialNotesDetails.style.marginTop = "1.5em";
		specialNotesDetails.style.marginBottom = "0.5em";
		const specialNotesSummary = specialNotesDetails.createEl("summary", {
			text: "Special Notes",
		});
		specialNotesSummary.style.fontSize = "1.3em";
		specialNotesSummary.style.fontWeight = "600";
		specialNotesSummary.style.cursor = "pointer";
		specialNotesSummary.style.marginBottom = "8px";
		const specialNotesContent = specialNotesDetails.createDiv();
		new Setting(specialNotesContent)
			.setName("Open Fleeting Note")
			.setDesc("Show 'Open Fleeting Note' command in main palette")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.openFleeting)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.openFleeting = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);

		new Setting(specialNotesContent)
			.setName("Create Fleeting Note")
			.setDesc("Show 'Create Fleeting Note' command in main palette")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.createFleeting)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.createFleeting = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);

		new Setting(specialNotesContent)
			.setName("Open MOC")
			.setDesc("Show 'Open MOC' command in main palette")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.openMoc)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.openMoc = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);

		new Setting(specialNotesContent)
			.setName("Create MOC")
			.setDesc("Show 'Create MOC' command in main palette")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.createMoc)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.createMoc = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);

		new Setting(specialNotesContent)
			.setName("Open Index")
			.setDesc("Show 'Open Index' command in main palette")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.openIndex)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.openIndex = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);

		new Setting(specialNotesContent)
			.setName("Create Index")
			.setDesc("Show 'Create Index' command in main palette")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableIndividualCommands.createIndex)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableIndividualCommands.createIndex = value;
						await this.plugin.saveSettings();
						this.plugin.commandManager.reloadCommands();
					}),
			);
	}

	private displayBoxZettelSettings(
		containerEl: HTMLElement,
		box: Box,
		boxIndex: number,
	): void {
		containerEl.createEl("h3", { text: "Zettel Settings" });

		// Zettel ID Format
		new Setting(containerEl)
			.setName("Zettel ID format")
			.setDesc(
				"Date format for generating zettel IDs (e.g., YYYYMMDDHHmm, YYYYMMDD, YYYYMMDDHHmmss)",
			)
			.addText((text) =>
				text
					.setPlaceholder("YYYYMMDDHHmm")
					.setValue(box.zettelIdFormat)
					.onChange(async (value) => {
						this.plugin.settings.boxes[boxIndex].zettelIdFormat =
							value;
						await this.plugin.saveSettings();
					}),
			);

		// Zettel Template
		new Setting(containerEl)
			.setName("Note template")
			.setDesc("Template file to use when creating new zettel notes")
			.addText((text) => {
				const onSelect = async (value: string) => {
					text.setValue(value);
					this.plugin.settings.boxes[boxIndex].noteTemplatePath =
						value;
					await this.plugin.saveSettings();
				};
				new FileSuggest(this.app, text.inputEl, onSelect);
				text.setPlaceholder("path/to/template.md")
					.setValue(box.noteTemplatePath)
					.onChange(async (value) => {
						this.plugin.settings.boxes[boxIndex].noteTemplatePath =
							value;
						await this.plugin.saveSettings();
					});
			});

		// Zettel Tag
		new Setting(containerEl)
			.setName("Zettel tag")
			.setDesc("Tag used to identify zettel notes (without #)")
			.addText((text) => {
				const onSelect = async (value: string) => {
					text.setValue(value);
					this.plugin.settings.boxes[boxIndex].zettelTag = value;
					await this.plugin.saveSettings();
				};
				new TagSuggest(this.app, text.inputEl, onSelect);
				text.setPlaceholder("zettel")
					.setValue(box.zettelTag)
					.onChange(async (value) => {
						this.plugin.settings.boxes[boxIndex].zettelTag = value;
						await this.plugin.saveSettings();
					});
			});

		// Use Separator Format
		new Setting(containerEl)
			.setName("Use separator format")
			.setDesc(
				"Include title in filename with separator (e.g., z20241118123456789⁝ My Note Title)",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(box.useSeparatorFormat)
					.onChange(async (value) => {
						this.plugin.settings.boxes[boxIndex].useSeparatorFormat = value;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		// Zettel ID Separator (shown when separator format is enabled)
		if (box.useSeparatorFormat) {
			new Setting(containerEl)
				.setName("Zettel ID separator")
				.setDesc("Character(s) separating the zettel ID from the title")
				.addText((text) =>
					text
						.setPlaceholder("⁝ ")
						.setValue(box.zettelIdSeparator?.trim() ? box.zettelIdSeparator : "⁝ ")
						.onChange(async (value) => {
							this.plugin.settings.boxes[boxIndex].zettelIdSeparator = value;
							await this.plugin.saveSettings();
						}),
				);
		}

		// Zettel Prefix Toggle
		new Setting(containerEl)
			.setName("Use zettel prefix")
			.setDesc(
				"Enable a prefix specifically for zettel notes (added after box prefix if enabled)",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(box.useZettelPrefix)
					.onChange(async (value) => {
						this.plugin.settings.boxes[boxIndex].useZettelPrefix = value;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		// Zettel Prefix (shown when enabled)
		if (box.useZettelPrefix) {
			new Setting(containerEl)
				.setName("Zettel prefix")
				.setDesc(
					"Prefix for zettel notes (e.g., 'z', 'Z')",
				)
				.addText((text) =>
					text
						.setPlaceholder("e.g., z")
						.setValue(box.zettelPrefix || "")
						.onChange(async (value) => {
							this.plugin.settings.boxes[boxIndex].zettelPrefix = value;
							await this.plugin.saveSettings();
						}),
				);
		}

		// Enable Sequence Reorder
		const sequenceReorderSetting = new Setting(containerEl).setName(
			"Enable sequence reorder",
		);
		const descEl = sequenceReorderSetting.descEl;
		descEl.empty();
		descEl
			.createDiv()
			.setText(
				"Enable the command to reorder child notes within a sequence.",
			);
		descEl.createEl("br");
		descEl
			.createDiv()
			.setText("⚠️ Warning: This is an experimental feature.");

		sequenceReorderSetting.addToggle((toggle) =>
			toggle
				.setValue(box.enableSequenceReorder)
				.onChange(async (value) => {
					this.plugin.settings.boxes[boxIndex].enableSequenceReorder =
						value;
					await this.plugin.saveSettings();
				}),
		);

		const nameEl = sequenceReorderSetting.nameEl;
		nameEl.innerHTML = "Enable sequence reorder <strong>(Alpha)</strong>";
	}

	private displayBoxFleetingSettings(
		containerEl: HTMLElement,
		box: Box,
		boxIndex: number,
	): void {
		containerEl.createEl("h3", { text: "Fleeting Notes Settings" });

		// Enable Fleeting Notes
		new Setting(containerEl)
			.setName("Enable fleeting notes")
			.setDesc("Enable fleeting notes support for this box")
			.addToggle((toggle) =>
				toggle
					.setValue(box.enableFleetingNotes)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].enableFleetingNotes = value;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		if (!box.enableFleetingNotes) return;

		// Use Separate Location
		new Setting(containerEl)
			.setName("Use separate location")
			.setDesc("Store fleeting notes in a separate folder")
			.addToggle((toggle) =>
				toggle
					.setValue(box.fleetingNotesUseSeparateLocation)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].fleetingNotesUseSeparateLocation = value;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		if (box.fleetingNotesUseSeparateLocation) {
			new Setting(containerEl)
				.setName("Fleeting notes location")
				.setDesc(
					"Folder path for fleeting notes (leave empty for vault root)",
				)
				.addText((text) => {
					const onSelect = async (value: string) => {
						text.setValue(value);
						this.plugin.settings.boxes[
							boxIndex
						].fleetingNotesLocation = value;
						await this.plugin.saveSettings();
					};
					new FolderSuggest(this.app, text.inputEl, onSelect);
					text.setPlaceholder("path/to/fleeting")
						.setValue(box.fleetingNotesLocation)
						.onChange(async (value) => {
							this.plugin.settings.boxes[
								boxIndex
							].fleetingNotesLocation = value;
							await this.plugin.saveSettings();
						});
				});
		}

		// Template
		new Setting(containerEl)
			.setName("Fleeting notes template")
			.setDesc("Template file to use when creating fleeting notes")
			.addText((text) => {
				const onSelect = async (value: string) => {
					text.setValue(value);
					this.plugin.settings.boxes[
						boxIndex
					].fleetingNotesTemplatePath = value;
					await this.plugin.saveSettings();
				};
				new FileSuggest(this.app, text.inputEl, onSelect);
				text.setPlaceholder("path/to/template.md")
					.setValue(box.fleetingNotesTemplatePath)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].fleetingNotesTemplatePath = value;
						await this.plugin.saveSettings();
					});
			});

		// Use Zettel ID
		new Setting(containerEl)
			.setName("Use zettel ID")
			.setDesc("Use zettel ID format for fleeting note filenames")
			.addToggle((toggle) =>
				toggle
					.setValue(box.fleetingNotesUseZettelId)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].fleetingNotesUseZettelId = value;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		if (!box.fleetingNotesUseZettelId) {
			new Setting(containerEl)
				.setName("Filename format")
				.setDesc(
					"Custom filename format (use {{title}} as placeholder)",
				)
				.addText((text) =>
					text
						.setPlaceholder("{{title}}")
						.setValue(box.fleetingNotesFilenameFormat)
						.onChange(async (value) => {
							this.plugin.settings.boxes[
								boxIndex
							].fleetingNotesFilenameFormat = value;
							await this.plugin.saveSettings();
						}),
				);
		}

		// Tag
		new Setting(containerEl)
			.setName("Fleeting notes tag")
			.setDesc("Tag used to identify fleeting notes (without #)")
			.addText((text) => {
				const onSelect = async (value: string) => {
					text.setValue(value);
					this.plugin.settings.boxes[boxIndex].fleetingNotesTag =
						value;
					await this.plugin.saveSettings();
				};
				new TagSuggest(this.app, text.inputEl, onSelect);
				text.setPlaceholder("fleeting")
					.setValue(box.fleetingNotesTag)
					.onChange(async (value) => {
						this.plugin.settings.boxes[boxIndex].fleetingNotesTag =
							value;
						await this.plugin.saveSettings();
					});
			});
	}

	private displayBoxMocSettings(
		containerEl: HTMLElement,
		box: Box,
		boxIndex: number,
	): void {
		containerEl.createEl("h3", { text: "MOCs Settings" });

		// Enable MOCs
		new Setting(containerEl)
			.setName("Enable MOCs")
			.setDesc("Enable Maps of Content support for this box")
			.addToggle((toggle) =>
				toggle.setValue(box.enableMocs).onChange(async (value) => {
					this.plugin.settings.boxes[boxIndex].enableMocs = value;
					await this.plugin.saveSettings();
					this.display();
				}),
			);

		if (!box.enableMocs) return;

		// Use Separate Location
		new Setting(containerEl)
			.setName("Use separate location")
			.setDesc("Store MOCs in a separate folder")
			.addToggle((toggle) =>
				toggle
					.setValue(box.mocsUseSeparateLocation)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].mocsUseSeparateLocation = value;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		if (box.mocsUseSeparateLocation) {
			new Setting(containerEl)
				.setName("MOCs location")
				.setDesc("Folder path for MOCs (leave empty for vault root)")
				.addText((text) => {
					const onSelect = async (value: string) => {
						text.setValue(value);
						this.plugin.settings.boxes[boxIndex].mocsLocation =
							value;
						await this.plugin.saveSettings();
					};
					new FolderSuggest(this.app, text.inputEl, onSelect);
					text.setPlaceholder("path/to/mocs")
						.setValue(box.mocsLocation)
						.onChange(async (value) => {
							this.plugin.settings.boxes[boxIndex].mocsLocation =
								value;
							await this.plugin.saveSettings();
						});
				});
		}

		// Template
		new Setting(containerEl)
			.setName("MOCs template")
			.setDesc("Template file to use when creating MOCs")
			.addText((text) => {
				const onSelect = async (value: string) => {
					text.setValue(value);
					this.plugin.settings.boxes[boxIndex].mocsTemplatePath =
						value;
					await this.plugin.saveSettings();
				};
				new FileSuggest(this.app, text.inputEl, onSelect);
				text.setPlaceholder("path/to/template.md")
					.setValue(box.mocsTemplatePath)
					.onChange(async (value) => {
						this.plugin.settings.boxes[boxIndex].mocsTemplatePath =
							value;
						await this.plugin.saveSettings();
					});
			});

		// Use Zettel ID
		new Setting(containerEl)
			.setName("Use zettel ID")
			.setDesc("Use zettel ID format for MOC filenames")
			.addToggle((toggle) =>
				toggle.setValue(box.mocsUseZettelId).onChange(async (value) => {
					this.plugin.settings.boxes[boxIndex].mocsUseZettelId =
						value;
					await this.plugin.saveSettings();
					this.display();
				}),
			);

		if (!box.mocsUseZettelId) {
			new Setting(containerEl)
				.setName("Filename format")
				.setDesc(
					"Custom filename format (use {{title}} as placeholder)",
				)
				.addText((text) =>
					text
						.setPlaceholder("{{title}} MOC")
						.setValue(box.mocsFilenameFormat)
						.onChange(async (value) => {
							this.plugin.settings.boxes[
								boxIndex
							].mocsFilenameFormat = value;
							await this.plugin.saveSettings();
						}),
				);
		}

		// Tag
		new Setting(containerEl)
			.setName("MOCs tag")
			.setDesc("Tag used to identify MOCs (without #)")
			.addText((text) => {
				const onSelect = async (value: string) => {
					text.setValue(value);
					this.plugin.settings.boxes[boxIndex].mocsTag = value;
					await this.plugin.saveSettings();
				};
				new TagSuggest(this.app, text.inputEl, onSelect);
				text.setPlaceholder("moc")
					.setValue(box.mocsTag)
					.onChange(async (value) => {
						this.plugin.settings.boxes[boxIndex].mocsTag = value;
						await this.plugin.saveSettings();
					});
			});
	}

	private displayBoxIndexSettings(
		containerEl: HTMLElement,
		box: Box,
		boxIndex: number,
	): void {
		containerEl.createEl("h3", { text: "Indexes Settings" });

		// Enable Indexes
		new Setting(containerEl)
			.setName("Enable indexes")
			.setDesc("Enable indexes support for this box")
			.addToggle((toggle) =>
				toggle.setValue(box.enableIndexes).onChange(async (value) => {
					this.plugin.settings.boxes[boxIndex].enableIndexes = value;
					await this.plugin.saveSettings();
					this.display();
				}),
			);

		if (!box.enableIndexes) return;

		// Use Separate Location
		new Setting(containerEl)
			.setName("Use separate location")
			.setDesc("Store indexes in a separate folder")
			.addToggle((toggle) =>
				toggle
					.setValue(box.indexesUseSeparateLocation)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].indexesUseSeparateLocation = value;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		if (box.indexesUseSeparateLocation) {
			new Setting(containerEl)
				.setName("Indexes location")
				.setDesc("Folder path for indexes (leave empty for vault root)")
				.addText((text) => {
					const onSelect = async (value: string) => {
						text.setValue(value);
						this.plugin.settings.boxes[boxIndex].indexesLocation =
							value;
						await this.plugin.saveSettings();
					};
					new FolderSuggest(this.app, text.inputEl, onSelect);
					text.setPlaceholder("path/to/indexes")
						.setValue(box.indexesLocation)
						.onChange(async (value) => {
							this.plugin.settings.boxes[
								boxIndex
							].indexesLocation = value;
							await this.plugin.saveSettings();
						});
				});
		}

		// Template
		new Setting(containerEl)
			.setName("Indexes template")
			.setDesc("Template file to use when creating indexes")
			.addText((text) => {
				const onSelect = async (value: string) => {
					text.setValue(value);
					this.plugin.settings.boxes[boxIndex].indexesTemplatePath =
						value;
					await this.plugin.saveSettings();
				};
				new FileSuggest(this.app, text.inputEl, onSelect);
				text.setPlaceholder("path/to/template.md")
					.setValue(box.indexesTemplatePath)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].indexesTemplatePath = value;
						await this.plugin.saveSettings();
					});
			});

		// Use Zettel ID
		new Setting(containerEl)
			.setName("Use zettel ID")
			.setDesc("Use zettel ID format for index filenames")
			.addToggle((toggle) =>
				toggle
					.setValue(box.indexesUseZettelId)
					.onChange(async (value) => {
						this.plugin.settings.boxes[
							boxIndex
						].indexesUseZettelId = value;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		if (!box.indexesUseZettelId) {
			new Setting(containerEl)
				.setName("Filename format")
				.setDesc(
					"Custom filename format (use {{title}} as placeholder)",
				)
				.addText((text) =>
					text
						.setPlaceholder("{{title}} Index")
						.setValue(box.indexesFilenameFormat)
						.onChange(async (value) => {
							this.plugin.settings.boxes[
								boxIndex
							].indexesFilenameFormat = value;
							await this.plugin.saveSettings();
						}),
				);
		}

		// Tag
		new Setting(containerEl)
			.setName("Indexes tag")
			.setDesc("Tag used to identify indexes (without #)")
			.addText((text) => {
				const onSelect = async (value: string) => {
					text.setValue(value);
					this.plugin.settings.boxes[boxIndex].indexesTag = value;
					await this.plugin.saveSettings();
				};
				new TagSuggest(this.app, text.inputEl, onSelect);
				text.setPlaceholder("index")
					.setValue(box.indexesTag)
					.onChange(async (value) => {
						this.plugin.settings.boxes[boxIndex].indexesTag = value;
						await this.plugin.saveSettings();
					});
			});
	}

	private displayZettelSettings(containerEl: HTMLElement): void {
		// Zettel Settings Group
		containerEl.createEl("h2", { text: "Zettel Settings" });
		containerEl.createEl("p", {
			text: "Configure how zettel notes are created and organized.",
			cls: "setting-item-description",
		});

		// Use Separate Location Toggle
		new Setting(containerEl)
			.setName("Use separate location")
			.setDesc(
				"Store zettel notes in a separate folder (if disabled, uses the default note location)",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.zettelsUseSeparateLocation)
					.onChange(async (value) => {
						this.plugin.settings.zettelsUseSeparateLocation = value;
						await this.plugin.saveSettings();
						this.display(); // Refresh to show/hide location field
					}),
			);

		// Zettels Location (shown when using separate location)
		if (this.plugin.settings.zettelsUseSeparateLocation) {
			new Setting(containerEl)
				.setName("Zettels location")
				.setDesc(
					"Folder path for zettel notes (leave empty for vault root)",
				)
				.addText((text) => {
					const onSelect = async (value: string) => {
						text.setValue(value);
						this.plugin.settings.zettelsLocation = value;
						await this.plugin.saveSettings();
					};
					new FolderSuggest(this.app, text.inputEl, onSelect);
					text.setPlaceholder("path/to/zettels")
						.setValue(this.plugin.settings.zettelsLocation)
						.onChange(async (value) => {
							this.plugin.settings.zettelsLocation = value;
							await this.plugin.saveSettings();
						});
				});
		}

		// Zettel ID Format
		new Setting(containerEl)
			.setName("Zettel ID format")
			.setDesc(
				"Date format for generating zettel IDs (e.g., YYYYMMDDHHmm, YYYYMMDD, YYYYMMDDHHmmss)",
			)
			.addText((text) =>
				text
					.setPlaceholder("YYYYMMDDHHmm")
					.setValue(this.plugin.settings.zettelIdFormat)
					.onChange(async (value) => {
						this.plugin.settings.zettelIdFormat = value;
						await this.plugin.saveSettings();
					}),
			);

		// Use Separator Format
		new Setting(containerEl)
			.setName("Use separator format")
			.setDesc(
				"Include title in filename with separator (e.g., z20241118123456789⁝ My Note Title)",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.useSeparatorFormat)
					.onChange(async (value) => {
						this.plugin.settings.useSeparatorFormat = value;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		// Zettel ID Separator (shown when separator format is enabled)
		if (this.plugin.settings.useSeparatorFormat) {
			new Setting(containerEl)
				.setName("Zettel ID separator")
				.setDesc("Character(s) separating the zettel ID from the title")
				.addText((text) =>
					text
						.setPlaceholder("⁝ ")
						.setValue(this.plugin.settings.zettelIdSeparator?.trim() ? this.plugin.settings.zettelIdSeparator : "⁝ ")
						.onChange(async (value) => {
							this.plugin.settings.zettelIdSeparator = value;
							await this.plugin.saveSettings();
						}),
				);
		}

		// Zettel ID Separator (commented out - replaced above)
		// new Setting(containerEl)
		// 	.setName("Zettel ID separator")
		// 	.setDesc("Character(s) separating the zettel ID from the title")
		// 	.addText((text) =>
		// 		text
		// 			.setPlaceholder(" ")
		// 			.setValue(this.plugin.settings.zettelIdSeparator)
		// 			.onChange(async (value) => {
		// 				this.plugin.settings.zettelIdSeparator = value;
		// 				await this.plugin.saveSettings();
		// 			}),
		// 	);

		// Zettel ID Matching Mode
		// new Setting(containerEl)
		// 	.setName("Zettel ID matching mode")
		// 	.setDesc(
		// 		"How strictly to match zettel IDs in filenames (strict: exact match; separator: match with separator; fuzzy: loose match)",
		// 	)
		// 	.addDropdown((dropdown) =>
		// 		dropdown
		// 			.addOption("strict", "Strict")
		// 			.addOption("separator", "Separator")
		// 			.addOption("fuzzy", "Fuzzy")
		// 			.setValue(this.plugin.settings.zettelIdMatchingMode)
		// 			.onChange(async (value) => {
		// 				this.plugin.settings.zettelIdMatchingMode =
		// 					value as any;
		// 				await this.plugin.saveSettings();
		// 			}),
		// 	);

		// Note Template Path
		new Setting(containerEl)
			.setName("Note template path")
			.setDesc(
				"Path to the template file for new notes (leave empty to use default)",
			)
			.addText((text) => {
				const onSelect = async (value: string) => {
					text.setValue(value);
					this.plugin.settings.noteTemplatePath = value;
					await this.plugin.saveSettings();
				};
				new FileSuggest(this.app, text.inputEl, onSelect);
				text.setPlaceholder("templates/zettel-template.md")
					.setValue(this.plugin.settings.noteTemplatePath)
					.onChange(async (value) => {
						this.plugin.settings.noteTemplatePath = value;
						await this.plugin.saveSettings();
					});
			});

		// Zettel Tag
		new Setting(containerEl)
			.setName("Zettel tag")
			.setDesc("Tag used to identify zettel notes (without #)")
			.addText((text) => {
				const onSelect = async (value: string) => {
					text.setValue(value);
					this.plugin.settings.zettelTag = value;
					await this.plugin.saveSettings();
				};
				new TagSuggest(this.app, text.inputEl, onSelect);
				text.setPlaceholder("zettel")
					.setValue(this.plugin.settings.zettelTag)
					.onChange(async (value) => {
						this.plugin.settings.zettelTag = value;
						await this.plugin.saveSettings();
					});
			});

		// Enable Sequence Reorder Toggle
		const sequenceReorderSetting = new Setting(containerEl).setName(
			"Enable sequence reorder",
		);

		// Add custom description with line breaks
		const descEl = sequenceReorderSetting.descEl;
		descEl.empty();
		descEl
			.createDiv()
			.setText(
				"Enable the command to reorder child notes within a sequence.",
			);
		descEl.createEl("br");
		descEl
			.createDiv()
			.setText("⚠️ Warning: This is an experimental feature.");

		sequenceReorderSetting.addToggle((toggle) =>
			toggle
				.setValue(this.plugin.settings.enableSequenceReorder)
				.onChange(async (value) => {
					this.plugin.settings.enableSequenceReorder = value;
					await this.plugin.saveSettings();
				}),
		);

		// Add Alpha label to the name
		const nameEl = sequenceReorderSetting.nameEl;
		nameEl.innerHTML = "Enable sequence reorder <strong>(Alpha)</strong>";

		// Use Zettel Prefix Toggle
		new Setting(containerEl)
			.setName("Use zettel prefix")
			.setDesc(
				"Add a prefix to the beginning of zettel IDs (e.g., z20241119123456789)",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.useZettelPrefix)
					.onChange(async (value) => {
						this.plugin.settings.useZettelPrefix = value;
						await this.plugin.saveSettings();
						this.display(); // Refresh to show/hide prefix settings
					}),
			);

		if (this.plugin.settings.useZettelPrefix) {
			// Zettel Prefix
			new Setting(containerEl)
				.setName("Zettel prefix")
				.setDesc("Prefix character(s) for zettel notes")
				.addText((text) =>
					text
						.setPlaceholder("Z")
						.setValue(this.plugin.settings.zettelPrefix)
						.onChange(async (value) => {
							this.plugin.settings.zettelPrefix = value;
							await this.plugin.saveSettings();
						}),
				);
		}
	}

	private displayFleetingSettings(containerEl: HTMLElement): void {
		// Fleeting Notes Settings Group
		containerEl.createEl("h2", { text: "Fleeting Notes" });
		containerEl.createEl("p", {
			text: "Configure fleeting notes for quick capture of temporary thoughts and ideas.",
			cls: "setting-item-description",
		});

		// Enable Fleeting Notes Toggle
		new Setting(containerEl)
			.setName("Enable fleeting notes")
			.setDesc("Enable commands for creating and opening fleeting notes")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableFleetingNotes)
					.onChange(async (value) => {
						this.plugin.settings.enableFleetingNotes = value;
						await this.plugin.saveSettings();
						this.display(); // Refresh to show/hide settings
					}),
			);

		if (this.plugin.settings.enableFleetingNotes) {
			// Use Separate Location Toggle
			new Setting(containerEl)
				.setName("Use separate location")
				.setDesc(
					"Store fleeting notes in a separate folder (if disabled, uses the default zettel location)",
				)
				.addToggle((toggle) =>
					toggle
						.setValue(
							this.plugin.settings
								.fleetingNotesUseSeparateLocation,
						)
						.onChange(async (value) => {
							this.plugin.settings.fleetingNotesUseSeparateLocation =
								value;
							await this.plugin.saveSettings();
							this.display(); // Refresh to show/hide location field
						}),
				);

			// Fleeting Notes Location (shown when using separate location)
			if (this.plugin.settings.fleetingNotesUseSeparateLocation) {
				new Setting(containerEl)
					.setName("Fleeting notes location")
					.setDesc(
						"Folder path for fleeting notes (leave empty for vault root)",
					)
					.addText((text) => {
						const onSelect = async (value: string) => {
							text.setValue(value);
							this.plugin.settings.fleetingNotesLocation = value;
							await this.plugin.saveSettings();
						};
						new FolderSuggest(this.app, text.inputEl, onSelect);
						text.setPlaceholder("path/to/fleeting")
							.setValue(
								this.plugin.settings.fleetingNotesLocation,
							)
							.onChange(async (value) => {
								this.plugin.settings.fleetingNotesLocation =
									value;
								await this.plugin.saveSettings();
							});
					});
			}

			// Fleeting Notes Template
			new Setting(containerEl)
				.setName("Fleeting notes template")
				.setDesc("Path to template file for fleeting notes")
				.addText((text) => {
					const onSelect = async (value: string) => {
						text.setValue(value);
						this.plugin.settings.fleetingNotesTemplatePath = value;
						await this.plugin.saveSettings();
					};
					new FileSuggest(this.app, text.inputEl, onSelect);
					text.setPlaceholder("templates/fleeting-note.md")
						.setValue(
							this.plugin.settings.fleetingNotesTemplatePath,
						)
						.onChange(async (value) => {
							this.plugin.settings.fleetingNotesTemplatePath =
								value;
							await this.plugin.saveSettings();
						});
				});

			// Fleeting Notes Use Zettel ID
			const fleetingUseZettelSetting = new Setting(containerEl)
				.setName("Use zettel ID format")
				.setDesc("Use the zettel ID format for fleeting note filenames")
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.fleetingNotesUseZettelId)
						.onChange(async (value) => {
							this.plugin.settings.fleetingNotesUseZettelId =
								value;
							await this.plugin.saveSettings();
							this.display(); // Refresh to show/hide format field
						}),
				);

			// Fleeting Notes Filename Format (shown when not using zettel ID)
			if (!this.plugin.settings.fleetingNotesUseZettelId) {
				new Setting(containerEl)
					.setName("Filename format")
					.setDesc(
						"Custom filename format (use {{title}} as placeholder)",
					)
					.addText((text) =>
						text
							.setPlaceholder("{{title}}")
							.setValue(
								this.plugin.settings
									.fleetingNotesFilenameFormat,
							)
							.onChange(async (value) => {
								this.plugin.settings.fleetingNotesFilenameFormat =
									value;
								await this.plugin.saveSettings();
							}),
					);
			}

			// Fleeting Notes Tag
			new Setting(containerEl)
				.setName("Fleeting notes tag")
				.setDesc("Tag used to identify fleeting notes (without #)")
				.addText((text) => {
					const onSelect = async (value: string) => {
						text.setValue(value);
						this.plugin.settings.fleetingNotesTag = value;
						await this.plugin.saveSettings();
					};
					new TagSuggest(this.app, text.inputEl, onSelect);
					text.setPlaceholder("fleeting")
						.setValue(this.plugin.settings.fleetingNotesTag)
						.onChange(async (value) => {
							this.plugin.settings.fleetingNotesTag = value;
							await this.plugin.saveSettings();
						});
				});

			// Use Fleeting Notes Prefix Toggle
			new Setting(containerEl)
				.setName("Use fleeting notes prefix")
				.setDesc(
					"Add a prefix to the beginning of fleeting note IDs (e.g., f20241119123456789)",
				)
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.useFleetingNotesPrefix)
						.onChange(async (value) => {
							this.plugin.settings.useFleetingNotesPrefix = value;
							await this.plugin.saveSettings();
							this.display();
						}),
				);

			// Fleeting Notes Prefix (shown when prefix is enabled)
			if (this.plugin.settings.useFleetingNotesPrefix) {
				new Setting(containerEl)
					.setName("Fleeting notes prefix")
					.setDesc("Prefix character(s) for fleeting notes")
					.addText((text) =>
						text
							.setPlaceholder("f")
							.setValue(this.plugin.settings.fleetingNotesPrefix)
							.onChange(async (value) => {
								this.plugin.settings.fleetingNotesPrefix =
									value;
								await this.plugin.saveSettings();
							}),
					);
			}
		}
	}

	private displayMocSettings(containerEl: HTMLElement): void {
		// MOCs Settings Group
		containerEl.createEl("h2", { text: "MOCs (Maps of Content)" });
		containerEl.createEl("p", {
			text: "Configure Maps of Content for organizing and linking related notes.",
			cls: "setting-item-description",
		});

		// Enable MOCs Toggle
		new Setting(containerEl)
			.setName("Enable MOCs")
			.setDesc("Enable commands for creating and opening MOCs")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableMocs)
					.onChange(async (value) => {
						this.plugin.settings.enableMocs = value;
						await this.plugin.saveSettings();
						this.display(); // Refresh to show/hide settings
					}),
			);

		if (this.plugin.settings.enableMocs) {
			// Use Separate Location Toggle
			new Setting(containerEl)
				.setName("Use separate location")
				.setDesc(
					"Store MOCs in a separate folder (if disabled, uses the default zettel location)",
				)
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.mocsUseSeparateLocation)
						.onChange(async (value) => {
							this.plugin.settings.mocsUseSeparateLocation =
								value;
							await this.plugin.saveSettings();
							this.display(); // Refresh to show/hide location field
						}),
				);

			// MOCs Location (shown when using separate location)
			if (this.plugin.settings.mocsUseSeparateLocation) {
				new Setting(containerEl)
					.setName("MOCs location")
					.setDesc(
						"Folder path for MOCs (leave empty for vault root)",
					)
					.addText((text) => {
						const onSelect = async (value: string) => {
							text.setValue(value);
							this.plugin.settings.mocsLocation = value;
							await this.plugin.saveSettings();
						};
						new FolderSuggest(this.app, text.inputEl, onSelect);
						text.setPlaceholder("path/to/mocs")
							.setValue(this.plugin.settings.mocsLocation)
							.onChange(async (value) => {
								this.plugin.settings.mocsLocation = value;
								await this.plugin.saveSettings();
							});
					});
			}

			// MOCs Template
			new Setting(containerEl)
				.setName("MOCs template")
				.setDesc("Path to template file for MOCs")
				.addText((text) => {
					const onSelect = async (value: string) => {
						text.setValue(value);
						this.plugin.settings.mocsTemplatePath = value;
						await this.plugin.saveSettings();
					};
					new FileSuggest(this.app, text.inputEl, onSelect);
					text.setPlaceholder("templates/moc.md")
						.setValue(this.plugin.settings.mocsTemplatePath)
						.onChange(async (value) => {
							this.plugin.settings.mocsTemplatePath = value;
							await this.plugin.saveSettings();
						});
				});

			// MOCs Use Zettel ID
			new Setting(containerEl)
				.setName("Use zettel ID format")
				.setDesc("Use the zettel ID format for MOC filenames")
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.mocsUseZettelId)
						.onChange(async (value) => {
							this.plugin.settings.mocsUseZettelId = value;
							await this.plugin.saveSettings();
							this.display(); // Refresh to show/hide format field
						}),
				);

			// MOCs Filename Format (shown when not using zettel ID)
			if (!this.plugin.settings.mocsUseZettelId) {
				new Setting(containerEl)
					.setName("Filename format")
					.setDesc(
						"Custom filename format (use {{title}} as placeholder)",
					)
					.addText((text) =>
						text
							.setPlaceholder("{{title}} MOC")
							.setValue(this.plugin.settings.mocsFilenameFormat)
							.onChange(async (value) => {
								this.plugin.settings.mocsFilenameFormat = value;
								await this.plugin.saveSettings();
							}),
					);
			}

			// MOCs Tag
			new Setting(containerEl)
				.setName("MOCs tag")
				.setDesc("Tag used to identify MOCs (without #)")
				.addText((text) => {
					const onSelect = async (value: string) => {
						text.setValue(value);
						this.plugin.settings.mocsTag = value;
						await this.plugin.saveSettings();
					};
					new TagSuggest(this.app, text.inputEl, onSelect);
					text.setPlaceholder("moc")
						.setValue(this.plugin.settings.mocsTag)
						.onChange(async (value) => {
							this.plugin.settings.mocsTag = value;
							await this.plugin.saveSettings();
						});
				});

			// Use MOCs Prefix Toggle
			new Setting(containerEl)
				.setName("Use MOCs prefix")
				.setDesc(
					"Add a prefix to the beginning of MOC IDs (e.g., m20241119123456789)",
				)
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.useMocsPrefix)
						.onChange(async (value) => {
							this.plugin.settings.useMocsPrefix = value;
							await this.plugin.saveSettings();
							this.display();
						}),
				);

			// MOCs Prefix (shown when prefix is enabled)
			if (this.plugin.settings.useMocsPrefix) {
				new Setting(containerEl)
					.setName("MOCs prefix")
					.setDesc("Prefix character(s) for MOCs")
					.addText((text) =>
						text
							.setPlaceholder("m")
							.setValue(this.plugin.settings.mocsPrefix)
							.onChange(async (value) => {
								this.plugin.settings.mocsPrefix = value;
								await this.plugin.saveSettings();
							}),
					);
			}
		}
	}

	private displayIndexSettings(containerEl: HTMLElement): void {
		// Indexes Settings Group
		containerEl.createEl("h2", { text: "Indexes" });
		containerEl.createEl("p", {
			text: "Configure index notes for categorizing and finding notes by topic or theme.",
			cls: "setting-item-description",
		});

		// Enable Indexes Toggle
		new Setting(containerEl)
			.setName("Enable indexes")
			.setDesc("Enable commands for creating and opening indexes")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableIndexes)
					.onChange(async (value) => {
						this.plugin.settings.enableIndexes = value;
						await this.plugin.saveSettings();
						this.display(); // Refresh to show/hide settings
					}),
			);

		if (this.plugin.settings.enableIndexes) {
			// Use Separate Location Toggle
			new Setting(containerEl)
				.setName("Use separate location")
				.setDesc(
					"Store indexes in a separate folder (if disabled, uses the default zettel location)",
				)
				.addToggle((toggle) =>
					toggle
						.setValue(
							this.plugin.settings.indexesUseSeparateLocation,
						)
						.onChange(async (value) => {
							this.plugin.settings.indexesUseSeparateLocation =
								value;
							await this.plugin.saveSettings();
							this.display(); // Refresh to show/hide location field
						}),
				);

			// Indexes Location (shown when using separate location)
			if (this.plugin.settings.indexesUseSeparateLocation) {
				new Setting(containerEl)
					.setName("Indexes location")
					.setDesc(
						"Folder path for indexes (leave empty for vault root)",
					)
					.addText((text) => {
						const onSelect = async (value: string) => {
							text.setValue(value);
							this.plugin.settings.indexesLocation = value;
							await this.plugin.saveSettings();
						};
						new FolderSuggest(this.app, text.inputEl, onSelect);
						text.setPlaceholder("path/to/indexes")
							.setValue(this.plugin.settings.indexesLocation)
							.onChange(async (value) => {
								this.plugin.settings.indexesLocation = value;
								await this.plugin.saveSettings();
							});
					});
			}

			// Indexes Template
			new Setting(containerEl)
				.setName("Indexes template")
				.setDesc("Path to template file for indexes")
				.addText((text) => {
					const onSelect = async (value: string) => {
						text.setValue(value);
						this.plugin.settings.indexesTemplatePath = value;
						await this.plugin.saveSettings();
					};
					new FileSuggest(this.app, text.inputEl, onSelect);
					text.setPlaceholder("templates/index.md")
						.setValue(this.plugin.settings.indexesTemplatePath)
						.onChange(async (value) => {
							this.plugin.settings.indexesTemplatePath = value;
							await this.plugin.saveSettings();
						});
				});

			// Indexes Use Zettel ID
			new Setting(containerEl)
				.setName("Use zettel ID format")
				.setDesc("Use the zettel ID format for index filenames")
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.indexesUseZettelId)
						.onChange(async (value) => {
							this.plugin.settings.indexesUseZettelId = value;
							await this.plugin.saveSettings();
							this.display(); // Refresh to show/hide format field
						}),
				);

			// Indexes Filename Format (shown when not using zettel ID)
			if (!this.plugin.settings.indexesUseZettelId) {
				new Setting(containerEl)
					.setName("Filename format")
					.setDesc(
						"Custom filename format (use {{title}} as placeholder)",
					)
					.addText((text) =>
						text
							.setPlaceholder("{{title}} Index")
							.setValue(
								this.plugin.settings.indexesFilenameFormat,
							)
							.onChange(async (value) => {
								this.plugin.settings.indexesFilenameFormat =
									value;
								await this.plugin.saveSettings();
							}),
					);
			}

			// Indexes Tag
			new Setting(containerEl)
				.setName("Indexes tag")
				.setDesc("Tag used to identify indexes (without #)")
				.addText((text) => {
					const onSelect = async (value: string) => {
						text.setValue(value);
						this.plugin.settings.indexesTag = value;
						await this.plugin.saveSettings();
					};
					new TagSuggest(this.app, text.inputEl, onSelect);
					text.setPlaceholder("index")
						.setValue(this.plugin.settings.indexesTag)
						.onChange(async (value) => {
							this.plugin.settings.indexesTag = value;
							await this.plugin.saveSettings();
						});
				});

			// Use Indexes Prefix Toggle
			new Setting(containerEl)
				.setName("Use indexes prefix")
				.setDesc(
					"Add a prefix to the beginning of index IDs (e.g., i20241119123456789)",
				)
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.useIndexesPrefix)
						.onChange(async (value) => {
							this.plugin.settings.useIndexesPrefix = value;
							await this.plugin.saveSettings();
							this.display();
						}),
				);

			// Indexes Prefix (shown when prefix is enabled)
			if (this.plugin.settings.useIndexesPrefix) {
				new Setting(containerEl)
					.setName("Indexes prefix")
					.setDesc("Prefix character(s) for indexes")
					.addText((text) =>
						text
							.setPlaceholder("i")
							.setValue(this.plugin.settings.indexesPrefix)
							.onChange(async (value) => {
								this.plugin.settings.indexesPrefix = value;
								await this.plugin.saveSettings();
							}),
					);
			}
		}
	}
}
