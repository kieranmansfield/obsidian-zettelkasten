import { App, PluginSettingTab, Setting } from "obsidian";
import type ZettelkastenPlugin from "../../main";
import { FolderSuggest } from "../ui/FolderSuggest";
import { FileSuggest } from "../ui/FileSuggest";
import { TagSuggest } from "../ui/TagSuggest";

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
		switch (this.activeTab) {
			case "general":
				this.displayGeneralSettings(contentEl);
				break;
			case "zettel":
				this.displayZettelSettings(contentEl);
				break;
			case "fleeting":
				this.displayFleetingSettings(contentEl);
				break;
			case "index":
				this.displayIndexSettings(contentEl);
				break;
		}
	}

	private createTabNavigation(containerEl: HTMLElement): void {
		const tabBar = containerEl.createDiv("zettelkasten-settings-tabs");

		const tabs = [
			{ id: "general", name: "General" },
			{ id: "zettel", name: "Zettel" },
			{ id: "fleeting", name: "Fleeting Notes" },
			{ id: "index", name: "Indexes" },
			{ id: "index", name: "Indexes" },
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
	}

	private displayZettelSettings(containerEl: HTMLElement): void {
		// Zettel Settings Group
		containerEl.createEl("h2", { text: "Zettel Settings" });
		containerEl.createEl("p", {
			text: "Configure how zettel notes are created and organized.",
			cls: "setting-item-description",
		});

		// Zettels Location
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

		// Zettel ID Separator
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
				.setValue(this.plugin.settings.enableNoteSequence)
				.onChange(async (value) => {
					this.plugin.settings.enableNoteSequence = value;
					await this.plugin.saveSettings();
				}),
		);

		// Add Alpha label to the name
		const nameEl = sequenceReorderSetting.nameEl;
		nameEl.innerHTML = "Enable sequence reorder <strong>(Alpha)</strong>";
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
		}
	}
}
