import { App, PluginSettingTab, Setting } from "obsidian";
import type ZettelkastenPlugin from "../../main";
import { FolderSuggest } from "../ui/FolderSuggest";
import { FileSuggest } from "../ui/FileSuggest";
import { TagSuggest } from "../ui/TagSuggest";
import { BookmarkModal } from "../ui/BookmarkModal";

// Settings tab for the Zettelkasten plugin

export class ZettelkastenSettingTab extends PluginSettingTab {
	plugin: ZettelkastenPlugin;

	constructor(app: App, plugin: ZettelkastenPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		// Save scroll position before clearing
		const scrollTop = containerEl.scrollTop;

		containerEl.empty();

		// page title
		containerEl.createEl("h1", {
			text: "Zettelkasten Settings",
			cls: "zettelkasten-settings-title",
		});

		// Display all settings in a single page
		this.displayGeneralSettings(containerEl);
		this.displayZettelSettings(containerEl);
		this.displayInboxSettings(containerEl);
		this.displayStructureNoteSettings(containerEl);
		this.displayReferenceSettings(containerEl);
		this.displayPanelSettings(containerEl);
		this.displayExperimentalSettings(containerEl);

		// Restore scroll position after rendering
		setTimeout(() => {
			containerEl.scrollTop = scrollTop;

			// Prevent auto-focus on first input field
			const activeElement = document.activeElement as HTMLElement;
			if (activeElement && activeElement.blur) {
				activeElement.blur();
			}
		}, 0);
	}

	/**
	 * Creates a collapsible section with a heading and optional toggle
	 */
	private createCollapsibleSection(
		containerEl: HTMLElement,
		title: string,
		description: string,
		defaultOpen: boolean = true,
		toggleConfig?: {
			getValue: () => boolean;
			onChange: (value: boolean) => Promise<void>;
		},
	): HTMLElement {
		const details = containerEl.createEl("details", {
			cls: "zettelkasten-collapsible-section",
		});
		if (defaultOpen) {
			details.setAttr("open", "");
		}

		const summary = details.createEl("summary");

		const headerDiv = summary.createDiv({ cls: "section-header" });
		headerDiv.createEl("h1", { text: title });

		// Add toggle if config provided
		if (toggleConfig) {
			const toggleDiv = summary.createDiv({ cls: "section-toggle" });
			const setting = new Setting(toggleDiv)
				.addToggle((toggle) =>
					toggle
						.setValue(toggleConfig.getValue())
						.onChange(async (value) => {
							await toggleConfig.onChange(value);
						}),
				);
			// Remove default setting styling to make it inline
			setting.settingEl.style.border = "none";
			setting.settingEl.style.padding = "0";
			setting.infoEl.remove();

			// Prevent toggle clicks from collapsing the section
			toggleDiv.addEventListener("click", (e) => {
				e.stopPropagation();
			});
		}

		const contentDiv = details.createDiv();
		contentDiv.createEl("p", {
			text: description,
			cls: "setting-item-description",
		});

		return contentDiv;
	}

	private displayGeneralSettings(containerEl: HTMLElement): void {
		const sectionDiv = containerEl.createDiv({ cls: "settings-section" });

		sectionDiv.createEl("h1", { text: "General Settings" });
		sectionDiv.createEl("p", {
			text: "Configure general plugin behavior.",
			cls: "setting-item-description",
		});

		// New Note Location
		new Setting(sectionDiv)
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
		const ignoredFoldersSetting = new Setting(sectionDiv)
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
			new Setting(sectionDiv)
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
		const sectionDiv = containerEl.createDiv({ cls: "settings-section" });

		sectionDiv.createEl("h1", { text: "Zettel Settings" });
		sectionDiv.createEl("p", {
			text: "Configure how zettel notes are created and organized.",
			cls: "setting-item-description",
		});

		// Zettel Detection Mode
		new Setting(sectionDiv)
			.setName("Zettel detection mode")
			.setDesc(
				"How to identify zettel notes: by folder location or by tag",
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption("folder", "Folder-based")
					.addOption("tag", "Tag-based")
					.setValue(this.plugin.settings.zettelDetectionMode)
					.onChange(async (value: "folder" | "tag") => {
						this.plugin.settings.zettelDetectionMode = value;
						await this.plugin.saveSettings();
					}),
			);

		// Zettels Location
		new Setting(sectionDiv)
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
		new Setting(sectionDiv)
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
		// new Setting(sectionDiv)
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
		// new Setting(sectionDiv)
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
		new Setting(sectionDiv)
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
		new Setting(sectionDiv)
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
	}

	private displayNoteSequenceSettings(containerEl: HTMLElement): void {
		const contentDiv = this.createCollapsibleSection(
			containerEl,
			"Note Sequence",
			"Configure note sequencing and reordering.",
			true,
		);

		// Enable Note Sequence Toggle
		const sequenceReorderSetting = new Setting(contentDiv).setName(
			"Enable note sequence",
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
		nameEl.innerHTML = "Enable note sequence <strong>(Alpha)</strong>";
	}

	private displayInboxSettings(containerEl: HTMLElement): void {
		const contentDiv = this.createCollapsibleSection(
			containerEl,
			"Inbox",
			"Configure inbox for quick capture of notes and ideas.",
			true,
			{
				getValue: () => this.plugin.settings.enableInbox,
				onChange: async (value) => {
					this.plugin.settings.enableInbox = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide settings
				},
			},
		);

		if (this.plugin.settings.enableInbox) {
			// Inbox Mode Selection
			new Setting(contentDiv)
				.setName("Inbox mode")
				.setDesc(
					"Choose between Default or Fleeting Notes inbox style",
				)
				.addDropdown((dropdown) =>
					dropdown
						.addOption("default", "Default")
						.addOption("fleeting", "Fleeting Notes")
						.setValue(this.plugin.settings.inboxMode)
						.onChange(async (value: "default" | "fleeting") => {
							this.plugin.settings.inboxMode = value;
							await this.plugin.saveSettings();
							this.display(); // Refresh to show/hide correct settings
						}),
				);

			// Inbox Location
			new Setting(contentDiv)
				.setName("Inbox location")
				.setDesc(
					"Folder path for inbox notes (leave empty for vault root)",
				)
				.addText((text) => {
					const onSelect = async (value: string) => {
						text.setValue(value);
						this.plugin.settings.inboxLocation = value;
						await this.plugin.saveSettings();
					};
					new FolderSuggest(this.app, text.inputEl, onSelect);
					text.setPlaceholder("path/to/inbox")
						.setValue(this.plugin.settings.inboxLocation)
						.onChange(async (value) => {
							this.plugin.settings.inboxLocation = value;
							await this.plugin.saveSettings();
						});
				});

			// Show Default mode settings
			if (this.plugin.settings.inboxMode === "default") {
				// Default Inbox Template
				new Setting(contentDiv)
					.setName("Default inbox template")
					.setDesc("Path to template file for default inbox notes")
					.addText((text) => {
						const onSelect = async (value: string) => {
							text.setValue(value);
							this.plugin.settings.defaultInboxTemplatePath =
								value;
							await this.plugin.saveSettings();
						};
						new FileSuggest(this.app, text.inputEl, onSelect);
						text.setPlaceholder("templates/inbox.md")
							.setValue(
								this.plugin.settings.defaultInboxTemplatePath,
							)
							.onChange(async (value) => {
								this.plugin.settings.defaultInboxTemplatePath =
									value;
								await this.plugin.saveSettings();
							});
					});
			}

			// Show Fleeting Notes mode settings
			if (this.plugin.settings.inboxMode === "fleeting") {
				// Use Separate Location Toggle
				new Setting(contentDiv)
					.setName("Use separate location")
					.setDesc(
						"Store fleeting notes in a separate folder (if disabled, uses the inbox location)",
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
					new Setting(contentDiv)
						.setName("Fleeting notes location")
						.setDesc(
							"Folder path for fleeting notes (leave empty for vault root)",
						)
						.addText((text) => {
							const onSelect = async (value: string) => {
								text.setValue(value);
								this.plugin.settings.fleetingNotesLocation =
									value;
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
				new Setting(contentDiv)
					.setName("Fleeting notes template")
					.setDesc("Path to template file for fleeting notes")
					.addText((text) => {
						const onSelect = async (value: string) => {
							text.setValue(value);
							this.plugin.settings.fleetingNotesTemplatePath =
								value;
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
				new Setting(contentDiv)
					.setName("Use zettel ID format")
					.setDesc(
						"Use the zettel ID format for fleeting note filenames",
					)
					.addToggle((toggle) =>
						toggle
							.setValue(
								this.plugin.settings.fleetingNotesUseZettelId,
							)
							.onChange(async (value) => {
								this.plugin.settings.fleetingNotesUseZettelId =
									value;
								await this.plugin.saveSettings();
								this.display(); // Refresh to show/hide format field
							}),
					);

				// Fleeting Notes Filename Format (shown when not using zettel ID)
				if (!this.plugin.settings.fleetingNotesUseZettelId) {
					new Setting(contentDiv)
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
				new Setting(contentDiv)
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
	}

	private displayStructureNoteSettings(containerEl: HTMLElement): void {
		const contentDiv = this.createCollapsibleSection(
			containerEl,
			"Structure Notes",
			"Configure structure notes for organizing and categorizing your zettelkasten.",
			true,
			{
				getValue: () => this.plugin.settings.enableStructureNotes,
				onChange: async (value) => {
					this.plugin.settings.enableStructureNotes = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide settings
				},
			},
		);

		if (this.plugin.settings.enableStructureNotes) {
			// Structure Note Mode Selection
			new Setting(contentDiv)
				.setName("Structure note mode")
				.setDesc(
					"Choose between Map of Content (MOC) or Zettelkasten Index style",
				)
				.addDropdown((dropdown) =>
					dropdown
						.addOption("moc", "Map of Content (MOC)")
						.addOption("zettelkasten", "Zettelkasten Index")
						.setValue(this.plugin.settings.structureNoteMode)
						.onChange(async (value: "moc" | "zettelkasten") => {
							this.plugin.settings.structureNoteMode = value;
							await this.plugin.saveSettings();
							this.display(); // Refresh to show/hide correct template
						}),
				);

			// Use Separate Location Toggle
			new Setting(contentDiv)
				.setName("Use separate location")
				.setDesc(
					"Store structure notes in a separate folder (if disabled, uses the default zettel location)",
				)
				.addToggle((toggle) =>
					toggle
						.setValue(
							this.plugin.settings
								.structureNotesUseSeparateLocation,
						)
						.onChange(async (value) => {
							this.plugin.settings.structureNotesUseSeparateLocation =
								value;
							await this.plugin.saveSettings();
							this.display(); // Refresh to show/hide location field
						}),
				);

			// Structure Notes Location (shown when using separate location)
			if (this.plugin.settings.structureNotesUseSeparateLocation) {
				new Setting(contentDiv)
					.setName("Structure notes location")
					.setDesc(
						"Folder path for structure notes (leave empty for vault root)",
					)
					.addText((text) => {
						const onSelect = async (value: string) => {
							text.setValue(value);
							this.plugin.settings.structureNotesLocation =
								value;
							await this.plugin.saveSettings();
						};
						new FolderSuggest(this.app, text.inputEl, onSelect);
						text.setPlaceholder("path/to/structure-notes")
							.setValue(
								this.plugin.settings.structureNotesLocation,
							)
							.onChange(async (value) => {
								this.plugin.settings.structureNotesLocation =
									value;
								await this.plugin.saveSettings();
							});
					});
			}

			// Template Path - show appropriate template based on mode
			if (this.plugin.settings.structureNoteMode === "moc") {
				// MOC Template
				new Setting(contentDiv)
					.setName("MOC template")
					.setDesc("Path to template file for Map of Content notes")
					.addText((text) => {
						const onSelect = async (value: string) => {
							text.setValue(value);
							this.plugin.settings.mocTemplatePath = value;
							await this.plugin.saveSettings();
						};
						new FileSuggest(this.app, text.inputEl, onSelect);
						text.setPlaceholder("templates/moc.md")
							.setValue(this.plugin.settings.mocTemplatePath)
							.onChange(async (value) => {
								this.plugin.settings.mocTemplatePath = value;
								await this.plugin.saveSettings();
							});
					});
			} else {
				// ZK Index Template
				new Setting(contentDiv)
					.setName("ZK Index template")
					.setDesc(
						"Path to template file for Zettelkasten Index notes",
					)
					.addText((text) => {
						const onSelect = async (value: string) => {
							text.setValue(value);
							this.plugin.settings.zkIndexTemplatePath = value;
							await this.plugin.saveSettings();
						};
						new FileSuggest(this.app, text.inputEl, onSelect);
						text.setPlaceholder("templates/zk-index.md")
							.setValue(
								this.plugin.settings.zkIndexTemplatePath,
							)
							.onChange(async (value) => {
								this.plugin.settings.zkIndexTemplatePath =
									value;
								await this.plugin.saveSettings();
							});
					});
			}

			// Structure Notes Use Zettel ID
			new Setting(contentDiv)
				.setName("Use zettel ID format")
				.setDesc(
					"Use the zettel ID format for structure note filenames",
				)
				.addToggle((toggle) =>
					toggle
						.setValue(
							this.plugin.settings.structureNotesUseZettelId,
						)
						.onChange(async (value) => {
							this.plugin.settings.structureNotesUseZettelId =
								value;
							await this.plugin.saveSettings();
							this.display(); // Refresh to show/hide format field
						}),
				);

			// Structure Notes Filename Format (shown when not using zettel ID)
			if (!this.plugin.settings.structureNotesUseZettelId) {
				new Setting(contentDiv)
					.setName("Filename format")
					.setDesc(
						"Custom filename format (use {{title}} as placeholder)",
					)
					.addText((text) =>
						text
							.setPlaceholder("{{title}} Index")
							.setValue(
								this.plugin.settings
									.structureNotesFilenameFormat,
							)
							.onChange(async (value) => {
								this.plugin.settings.structureNotesFilenameFormat =
									value;
								await this.plugin.saveSettings();
							}),
					);
			}

			// Structure Notes Tag
			new Setting(contentDiv)
				.setName("Structure notes tag")
				.setDesc("Tag used to identify structure notes (without #)")
				.addText((text) => {
					const onSelect = async (value: string) => {
						text.setValue(value);
						this.plugin.settings.structureNotesTag = value;
						await this.plugin.saveSettings();
					};
					new TagSuggest(this.app, text.inputEl, onSelect);
					text.setPlaceholder("index")
						.setValue(this.plugin.settings.structureNotesTag)
						.onChange(async (value) => {
							this.plugin.settings.structureNotesTag = value;
							await this.plugin.saveSettings();
						});
				});
		}
	}

	private displayReferenceSettings(containerEl: HTMLElement): void {
		const contentDiv = this.createCollapsibleSection(
			containerEl,
			"Reference",
			"Configure reference material folder location.",
			true,
			{
				getValue: () => this.plugin.settings.enableReference,
				onChange: async (value) => {
					this.plugin.settings.enableReference = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide settings
				},
			},
		);

		if (this.plugin.settings.enableReference) {
			// Reference Location
			new Setting(contentDiv)
				.setName("Reference location")
				.setDesc(
					"Folder path for reference materials (leave empty for vault root)",
				)
				.addText((text) => {
					const onSelect = async (value: string) => {
						text.setValue(value);
						this.plugin.settings.referenceLocation = value;
						await this.plugin.saveSettings();
					};
					new FolderSuggest(this.app, text.inputEl, onSelect);
					text.setPlaceholder("path/to/reference")
						.setValue(this.plugin.settings.referenceLocation)
						.onChange(async (value) => {
							this.plugin.settings.referenceLocation = value;
							await this.plugin.saveSettings();
						});
				});
		}
	}

	private displayPanelSettings(containerEl: HTMLElement): void {
		const contentDiv = this.createCollapsibleSection(
			containerEl,
			"Zettelkasten Panel",
			"Configure the Zettelkasten sidebar panel.",
			true,
		);

		// Enable Zettelkasten Panel Toggle
		new Setting(contentDiv)
			.setName("Enable Zettelkasten panel")
			.setDesc(
				"Show the Zettelkasten panel in the left sidebar",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableZettelkastenPanel)
					.onChange(async (value) => {
						this.plugin.settings.enableZettelkastenPanel = value;
						await this.plugin.saveSettings();

						// Activate or deactivate the view based on the setting
						if (value) {
							await this.plugin.activateView();
						} else {
							await this.plugin.deactivateView();
						}
					}),
			);

		// Show File Lists Toggle
		new Setting(contentDiv)
			.setName("Show file lists")
			.setDesc(
				"Display files beneath Inbox, Zettels, and References sections. When disabled, only section headers are shown.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.panelShowFileLists)
					.onChange(async (value) => {
						this.plugin.settings.panelShowFileLists = value;
						await this.plugin.saveSettings();
					}),
			);

		// Show File Icons Toggle
		new Setting(contentDiv)
			.setName("Show file icons")
			.setDesc(
				"Display file icons next to file names in the panel.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.panelShowFileIcons)
					.onChange(async (value) => {
						this.plugin.settings.panelShowFileIcons = value;
						await this.plugin.saveSettings();
					}),
			);

		// Section Name Customization
		new Setting(contentDiv)
			.setName("Inbox section name")
			.setDesc("Customize the display name for the Inbox section")
			.addText((text) =>
				text
					.setPlaceholder("Inbox")
					.setValue(this.plugin.settings.panelInboxName)
					.onChange(async (value) => {
						this.plugin.settings.panelInboxName = value || "Inbox";
						await this.plugin.saveSettings();
					}),
			);

		new Setting(contentDiv)
			.setName("Zettels section name")
			.setDesc("Customize the display name for the Zettels section")
			.addText((text) =>
				text
					.setPlaceholder("Zettels")
					.setValue(this.plugin.settings.panelZettelsName)
					.onChange(async (value) => {
						this.plugin.settings.panelZettelsName = value || "Zettels";
						await this.plugin.saveSettings();
					}),
			);

		new Setting(contentDiv)
			.setName("References section name")
			.setDesc("Customize the display name for the References section")
			.addText((text) =>
				text
					.setPlaceholder("References")
					.setValue(this.plugin.settings.panelReferencesName)
					.onChange(async (value) => {
						this.plugin.settings.panelReferencesName = value || "References";
						await this.plugin.saveSettings();
					}),
			);

		new Setting(contentDiv)
			.setName("Bookmarks section name")
			.setDesc("Customize the display name for the Bookmarks section")
			.addText((text) =>
				text
					.setPlaceholder("Bookmarks")
					.setValue(this.plugin.settings.panelBookmarksName)
					.onChange(async (value) => {
						this.plugin.settings.panelBookmarksName = value || "Bookmarks";
						await this.plugin.saveSettings();
					}),
			);

		// Tag Match Mode
		new Setting(contentDiv)
			.setName("Tag match mode")
			.setDesc(
				"When multiple tags are specified, match files with ANY tag or ALL tags",
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption("any", "Match any tag (OR)")
					.addOption("all", "Match all tags (AND)")
					.setValue(this.plugin.settings.panelTagMatchMode)
					.onChange(async (value: "any" | "all") => {
						this.plugin.settings.panelTagMatchMode = value;
						await this.plugin.saveSettings();
					}),
			);

		// Inbox Dashboard
		new Setting(contentDiv)
			.setName("Inbox dashboard")
			.setDesc(
				"Path to the file that opens when clicking the Inbox heading",
			)
			.addText((text) => {
				const onSelect = async (value: string) => {
					text.setValue(value);
					this.plugin.settings.panelInboxDashboard = value;
					await this.plugin.saveSettings();
				};
				new FileSuggest(this.app, text.inputEl, onSelect);
				text.setPlaceholder("Inbox/index.md")
					.setValue(this.plugin.settings.panelInboxDashboard)
					.onChange(async (value) => {
						this.plugin.settings.panelInboxDashboard = value;
						await this.plugin.saveSettings();
					});
			});

		// Inbox Filter Tags
		const inboxFilterTagsSetting = new Setting(contentDiv)
			.setName("Inbox filter tags")
			.setDesc(
				"Tags to filter files in the Inbox section. Leave empty to show all files. Click + to add more tags.",
			);

		inboxFilterTagsSetting.addButton((button) => {
			button
				.setButtonText("+")
				.setTooltip("Add tag")
				.onClick(async () => {
					this.plugin.settings.panelInboxFilterTags.push("");
					await this.plugin.saveSettings();
					this.display();
				});
		});

		this.plugin.settings.panelInboxFilterTags.forEach((tag, index) => {
			new Setting(contentDiv)
				.setClass("zettelkasten-ignored-folder-item")
				.addText((text) => {
					const onSelect = async (value: string) => {
						text.setValue(value);
						this.plugin.settings.panelInboxFilterTags[index] = value;
						await this.plugin.saveSettings();
					};
					new TagSuggest(this.app, text.inputEl, onSelect);
					text.setPlaceholder("tag-name")
						.setValue(tag)
						.onChange(async (value) => {
							this.plugin.settings.panelInboxFilterTags[index] = value;
							await this.plugin.saveSettings();
						});
				})
				.addButton((button) => {
					button
						.setIcon("trash")
						.setTooltip("Remove tag")
						.onClick(async () => {
							this.plugin.settings.panelInboxFilterTags.splice(
								index,
								1,
							);
							await this.plugin.saveSettings();
							this.display();
						});
				});
		});

		// Zettels Dashboard
		new Setting(contentDiv)
			.setName("Zettels dashboard")
			.setDesc(
				"Path to the file that opens when clicking the Zettels heading",
			)
			.addText((text) => {
				const onSelect = async (value: string) => {
					text.setValue(value);
					this.plugin.settings.panelZettelsDashboard = value;
					await this.plugin.saveSettings();
				};
				new FileSuggest(this.app, text.inputEl, onSelect);
				text.setPlaceholder("Notes/Notes.md")
					.setValue(this.plugin.settings.panelZettelsDashboard)
					.onChange(async (value) => {
						this.plugin.settings.panelZettelsDashboard = value;
						await this.plugin.saveSettings();
					});
			});

		// Zettels Filter Tags
		const zettelsFilterTagsSetting = new Setting(contentDiv)
			.setName("Zettels filter tags")
			.setDesc(
				"Tags to filter files in the Zettels section. Leave empty to show all files. Click + to add more tags.",
			);

		zettelsFilterTagsSetting.addButton((button) => {
			button
				.setButtonText("+")
				.setTooltip("Add tag")
				.onClick(async () => {
					this.plugin.settings.panelZettelsFilterTags.push("");
					await this.plugin.saveSettings();
					this.display();
				});
		});

		this.plugin.settings.panelZettelsFilterTags.forEach((tag, index) => {
			new Setting(contentDiv)
				.setClass("zettelkasten-ignored-folder-item")
				.addText((text) => {
					const onSelect = async (value: string) => {
						text.setValue(value);
						this.plugin.settings.panelZettelsFilterTags[index] = value;
						await this.plugin.saveSettings();
					};
					new TagSuggest(this.app, text.inputEl, onSelect);
					text.setPlaceholder("tag-name")
						.setValue(tag)
						.onChange(async (value) => {
							this.plugin.settings.panelZettelsFilterTags[index] = value;
							await this.plugin.saveSettings();
						});
				})
				.addButton((button) => {
					button
						.setIcon("trash")
						.setTooltip("Remove tag")
						.onClick(async () => {
							this.plugin.settings.panelZettelsFilterTags.splice(
								index,
								1,
							);
							await this.plugin.saveSettings();
							this.display();
						});
				});
		});

		// References Dashboard
		new Setting(contentDiv)
			.setName("References dashboard")
			.setDesc(
				"Path to the file that opens when clicking the References heading",
			)
			.addText((text) => {
				const onSelect = async (value: string) => {
					text.setValue(value);
					this.plugin.settings.panelReferencesDashboard = value;
					await this.plugin.saveSettings();
				};
				new FileSuggest(this.app, text.inputEl, onSelect);
				text.setPlaceholder("References/References.md")
					.setValue(this.plugin.settings.panelReferencesDashboard)
					.onChange(async (value) => {
						this.plugin.settings.panelReferencesDashboard = value;
						await this.plugin.saveSettings();
					});
			});

		// References Filter Tags
		const referencesFilterTagsSetting = new Setting(contentDiv)
			.setName("References filter tags")
			.setDesc(
				"Tags to filter files in the References section. Leave empty to show all files. Click + to add more tags.",
			);

		referencesFilterTagsSetting.addButton((button) => {
			button
				.setButtonText("+")
				.setTooltip("Add tag")
				.onClick(async () => {
					this.plugin.settings.panelReferencesFilterTags.push("");
					await this.plugin.saveSettings();
					this.display();
				});
		});

		this.plugin.settings.panelReferencesFilterTags.forEach((tag, index) => {
			new Setting(contentDiv)
				.setClass("zettelkasten-ignored-folder-item")
				.addText((text) => {
					const onSelect = async (value: string) => {
						text.setValue(value);
						this.plugin.settings.panelReferencesFilterTags[index] = value;
						await this.plugin.saveSettings();
					};
					new TagSuggest(this.app, text.inputEl, onSelect);
					text.setPlaceholder("tag-name")
						.setValue(tag)
						.onChange(async (value) => {
							this.plugin.settings.panelReferencesFilterTags[index] = value;
							await this.plugin.saveSettings();
						});
				})
				.addButton((button) => {
					button
						.setIcon("trash")
						.setTooltip("Remove tag")
						.onClick(async () => {
							this.plugin.settings.panelReferencesFilterTags.splice(
								index,
								1,
							);
							await this.plugin.saveSettings();
							this.display();
						});
				});
		});

		// Bookmarks List
		const bookmarksSetting = new Setting(contentDiv)
			.setName("Bookmarks")
			.setDesc(
				"Manage your bookmarked files. Click + to add a bookmark.",
			);

		bookmarksSetting.addButton((button) => {
			button
				.setButtonText("+")
				.setTooltip("Add bookmark")
				.onClick(async () => {
					const modal = new BookmarkModal(
						this.app,
						this.plugin,
						async (bookmark) => {
							this.plugin.settings.panelBookmarks.push(bookmark);
							await this.plugin.saveSettings();
							this.display();
						}
					);
					modal.open();
				});
		});

		// Display existing bookmarks
		this.plugin.settings.panelBookmarks.forEach((bookmark, index) => {
			const bookmarkSetting = new Setting(contentDiv)
				.setClass("zettelkasten-ignored-folder-item");

			// Type dropdown
			bookmarkSetting.addDropdown((dropdown) => {
				dropdown
					.addOption("file", "File")
					.addOption("search", "Search")
					.addOption("graph", "Graph")
					.addOption("folder", "Folder")
					.setValue(bookmark.type || "file")
					.onChange(async (value: "file" | "search" | "graph" | "folder") => {
						this.plugin.settings.panelBookmarks[index].type = value;
						await this.plugin.saveSettings();
						this.display(); // Refresh to show appropriate inputs
					});
			});

			// Show different inputs based on type
			if (bookmark.type === "file") {
				bookmarkSetting.addText((text) => {
					const onSelect = async (value: string) => {
						text.setValue(value);
						this.plugin.settings.panelBookmarks[index].path = value;
						// Auto-fill title from file name if title is empty
						if (!this.plugin.settings.panelBookmarks[index].title) {
							const fileName = value.split('/').pop()?.replace('.md', '') || '';
							this.plugin.settings.panelBookmarks[index].title = fileName;
						}
						await this.plugin.saveSettings();
					};
					new FileSuggest(this.app, text.inputEl, onSelect);
					text.setPlaceholder("path/to/file.md")
						.setValue(bookmark.path || "")
						.onChange(async (value) => {
							this.plugin.settings.panelBookmarks[index].path = value;
							// Auto-fill title from file name if title is empty
							if (!this.plugin.settings.panelBookmarks[index].title) {
								const fileName = value.split('/').pop()?.replace('.md', '') || '';
								this.plugin.settings.panelBookmarks[index].title = fileName;
							}
							await this.plugin.saveSettings();
						});
				});
			} else if (bookmark.type === "search") {
				bookmarkSetting.addText((text) => {
					text.setPlaceholder("Search query")
						.setValue(bookmark.query || "")
						.onChange(async (value) => {
							this.plugin.settings.panelBookmarks[index].query = value;
							await this.plugin.saveSettings();
						});
				});
			} else if (bookmark.type === "folder") {
				bookmarkSetting.addText((text) => {
					const onSelect = async (value: string) => {
						text.setValue(value);
						this.plugin.settings.panelBookmarks[index].path = value;
						// Auto-fill title from folder name if title is empty
						if (!this.plugin.settings.panelBookmarks[index].title) {
							const folderName = value.split('/').pop() || '';
							this.plugin.settings.panelBookmarks[index].title = folderName;
						}
						await this.plugin.saveSettings();
					};
					new FolderSuggest(this.app, text.inputEl, onSelect);
					text.setPlaceholder("path/to/folder")
						.setValue(bookmark.path || "")
						.onChange(async (value) => {
							this.plugin.settings.panelBookmarks[index].path = value;
							// Auto-fill title from folder name if title is empty
							if (!this.plugin.settings.panelBookmarks[index].title) {
								const folderName = value.split('/').pop() || '';
								this.plugin.settings.panelBookmarks[index].title = folderName;
							}
							await this.plugin.saveSettings();
						});
				});
			}

			// Title field (for all types)
			bookmarkSetting.addText((text) => {
				text.setPlaceholder("Display name")
					.setValue(bookmark.title)
					.onChange(async (value) => {
						this.plugin.settings.panelBookmarks[index].title = value;
						await this.plugin.saveSettings();
					});
			});

			bookmarkSetting.addButton((button) => {
				button
					.setIcon("trash")
					.setTooltip("Remove bookmark")
					.onClick(async () => {
						this.plugin.settings.panelBookmarks.splice(index, 1);
						await this.plugin.saveSettings();
						this.display();
					});
			});
		});
	}

	private displayExperimentalSettings(containerEl: HTMLElement): void {
		const contentDiv = this.createCollapsibleSection(
			containerEl,
			"Experimental Features",
			"Enable experimental features and commands.",
			true,
		);

		// Note Sequence Settings
		// Enable Note Sequence Toggle
		const sequenceReorderSetting = new Setting(contentDiv).setName(
			"Enable note sequence",
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
		nameEl.innerHTML = "Enable note sequence <strong>(Alpha)</strong>";
	}
}
