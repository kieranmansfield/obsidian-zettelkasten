import { MarkdownView, Notice, TFile, TFolder } from "obsidian";
import { FileCreator } from "../classes/fileCreator";
import { ZettelSuggester } from "../ui/ZettelSuggester";
import { CreateNoteWithSuggestModal } from "../ui/CreateNoteWithSuggestModal";
import { NavigatorModal, NavigationOption } from "../ui/NavigatorModal";
import { SequenceReorderModal } from "../ui/SequenceReorderModal";
import {
	BoxCommandPaletteModal,
	BoxCommand,
} from "../ui/BoxCommandPaletteModal";
import { FolderSuggestModal } from "../ui/FolderSuggestModal";
import type ZettelkastenPlugin from "../../main";
import type { Box } from "../settings/PluginSettings";

// Manages all plugin commands
export class CommandManager {
	private registeredBoxIds = new Set<string>();

	constructor(private plugin: ZettelkastenPlugin) {}

	/**
	 * Reloads all commands by re-registering them
	 */
	reloadCommands(): void {
		this.registerCommands();
	}

	/**
	 * Registers box commands that haven't been registered yet
	 * This allows dynamic addition of boxes without requiring restart
	 */
	refreshBoxCommands(): void {
		if (
			this.plugin.settings.enableBoxes &&
			this.plugin.settings.boxes.length > 0
		) {
			// Register commands for any new boxes
			this.plugin.settings.boxes.forEach((box) => {
				if (!this.registeredBoxIds.has(box.id)) {
					this.registerBoxCommandPalette(box);
					this.registerBoxFixFilenameCommandPalette(box);
					this.registerBoxIndividualCommands(box);
					this.registeredBoxIds.add(box.id);
				}
			});
		}
	}

	/**
	 * Registers all commands with the plugin
	 */
	registerCommands(): void {
		// Check if boxes are enabled
		if (
			this.plugin.settings.enableBoxes &&
			this.plugin.settings.boxes.length > 0
		) {
			// Register command palette for each box
			this.plugin.settings.boxes.forEach((box) => {
				this.registerBoxCommandPalette(box);
				this.registeredBoxIds.add(box.id);
			});

			// Register fix filename command palette for each box
			this.plugin.settings.boxes.forEach((box) => {
				this.registerBoxFixFilenameCommandPalette(box);
			});

			// Register individual commands if enabled
			this.plugin.settings.boxes.forEach((box) => {
				this.registerBoxIndividualCommands(box);
			});
		} else {
			// Register global commands (when boxes disabled)
			this.registerGlobalCommands();
		}
	}

	/**
	 * Registers global commands (when boxes are disabled)
	 */
	private registerGlobalCommands(): void {
		this.registerOpenZettelCommand();
		this.registerOpenParentZettelCommand();
		this.registerOpenChildZettelCommand();
		this.registerOpenSiblingZettelCommand();
		this.registerZettelkastenNavigatorCommand();
		if (this.plugin.settings.enableSequenceReorder) {
			this.registerReorderSequenceCommand();
		}
		this.registerNextSequenceCommand();
		this.registerPreviousSequenceCommand();
		this.registerNextChildCommand();
		this.registerPreviousChildCommand();
		this.registerGoUpLevelCommand();
		this.registerGoDownLevelCommand();
		this.registerAssignParentCommand();
		this.registerAssignChildCommand();
		this.registerMoveToRootCommand();
		this.registerFixFilenamesCommand();
		this.registerBatchFixFilenamesCommand();
		this.registerFixCurrentMocFilenameCommand();
		this.registerBatchFixMocFilenamesCommand();
		this.registerFixCurrentIndexFilenameCommand();
		this.registerBatchFixIndexFilenamesCommand();
		this.registerCreateNoteCommand();
		this.registerCreateChildZettelCommand();
		this.registerCreateSiblingZettelCommand();
		this.registerIndentZettelCommand();
		this.registerOutdentZettelCommand();
		this.registerOpenFleetingCommand();
		this.registerCreateFleetingNoteCommand();
		this.registerOpenMocCommand();
		this.registerCreateMocCommand();
		this.registerOpenIndexCommand();
		this.registerCreateIndexCommand();
		this.registerMoveToCorrectLocationCommand();
		this.registerBatchMoveToCorrectLocationCommand();
		this.registerTagAsCorrectTypeCommand();
		this.registerBatchTagAsCorrectTypeCommand();
	}

	/**
	 * Registers command palette for a specific box
	 */
	private registerBoxCommandPalette(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-command-palette`,
			name: `${box.name}: Command Palette`,
			icon: "list",
			callback: () => {
				const commands = this.getBoxCommands(box);
				new BoxCommandPaletteModal(
					this.plugin.app,
					box.name,
					commands,
				).open();
			},
		});
	}

	/**
	 * Registers fix filename command palette for a specific box
	 */
	private registerBoxFixFilenameCommandPalette(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-fix-filename-palette`,
			name: `${box.name}: Fix Filenames`,
			icon: "file-check",
			callback: () => {
				const commands = this.getBoxFixFilenameCommands(box);
				new BoxCommandPaletteModal(
					this.plugin.app,
					`${box.name} - Fix Filenames`,
					commands,
				).open();
			},
		});
	}

	/**
	 * Registers individual commands for a specific box (opt-in)
	 */
	private registerBoxIndividualCommands(box: Box): void {
		const cmds = box.enableIndividualCommands;

		// Quick Zettel is enabled by default
		if (cmds.quickZettel) this.registerBoxQuickZettelCommand(box);
		if (cmds.openZettel) this.registerBoxOpenZettelCommand(box);
		if (cmds.openParent) this.registerBoxOpenParentZettelCommand(box);
		if (cmds.openChild) this.registerBoxOpenChildZettelCommand(box);
		if (cmds.openSibling) this.registerBoxOpenSiblingZettelCommand(box);
		if (cmds.navigator) this.registerBoxNavigatorCommand(box);
		if (cmds.reorderSequence && box.enableSequenceReorder) {
			this.registerBoxReorderSequenceCommand(box);
		}
		if (cmds.nextSequence) this.registerBoxNextSequenceCommand(box);
		if (cmds.previousSequence) this.registerBoxPreviousSequenceCommand(box);
		if (cmds.nextChild) this.registerBoxNextChildCommand(box);
		if (cmds.previousChild) this.registerBoxPreviousChildCommand(box);
		if (cmds.goUpLevel) this.registerBoxGoUpLevelCommand(box);
		if (cmds.goDownLevel) this.registerBoxGoDownLevelCommand(box);
		if (cmds.assignParent) this.registerBoxAssignParentCommand(box);
		if (cmds.assignChild) this.registerBoxAssignChildCommand(box);
		if (cmds.moveToRoot) this.registerBoxMoveToRootCommand(box);
		if (cmds.createNote) this.registerBoxCreateNoteCommand(box);
		if (cmds.createChild) this.registerBoxCreateChildZettelCommand(box);
		if (cmds.createSibling) this.registerBoxCreateSiblingZettelCommand(box);
		if (cmds.indent) this.registerBoxIndentZettelCommand(box);
		if (cmds.outdent) this.registerBoxOutdentZettelCommand(box);

		if (box.enableFleetingNotes) {
			if (cmds.openFleeting) this.registerBoxOpenFleetingCommand(box);
			if (cmds.createFleeting)
				this.registerBoxCreateFleetingNoteCommand(box);
		}

		if (box.enableMocs) {
			if (cmds.openMoc) this.registerBoxOpenMocCommand(box);
			if (cmds.createMoc) this.registerBoxCreateMocCommand(box);
		}

		if (box.enableIndexes) {
			if (cmds.openIndex) this.registerBoxOpenIndexCommand(box);
			if (cmds.createIndex) this.registerBoxCreateIndexCommand(box);
		}

		// Utility commands
		if (cmds.moveToCorrectLocation) this.registerBoxMoveToCorrectLocationCommand(box);
		if (cmds.batchMoveToCorrectLocation) this.registerBoxBatchMoveToCorrectLocationCommand(box);
		if (cmds.tagAsCorrectType) this.registerBoxTagAsCorrectTypeCommand(box);
		if (cmds.batchTagAsCorrectType) this.registerBoxBatchTagAsCorrectTypeCommand(box);

		// Fix filename commands
		if (cmds.fixFilenames) this.registerBoxFixFilenamesCommand(box);
		if (cmds.batchFixFilenames) this.registerBoxBatchFixFilenamesCommand(box);

		if (box.enableMocs) {
			if (cmds.fixMocFilename) this.registerBoxFixMocFilenameCommand(box);
			if (cmds.batchFixMocFilenames) this.registerBoxBatchFixMocFilenamesCommand(box);
		}

		if (box.enableIndexes) {
			if (cmds.fixIndexFilename) this.registerBoxFixIndexFilenameCommand(box);
			if (cmds.batchFixIndexFilenames) this.registerBoxBatchFixIndexFilenamesCommand(box);
		}
	} /**
	 * Gets the list of commands for a box (for the command palette)
	 */
	private getBoxCommands(box: Box): BoxCommand[] {
		const commands: BoxCommand[] = [
			{
				id: "open-zettel",
				name: "Open Zettel",
				icon: "folder-open",
				callback: () => this.openZettelForBox(box),
			},
			{
				id: "create-zettel",
				name: "Create Zettel",
				icon: "file-plus",
				callback: () => this.createNoteForBox(box),
			},
			{
				id: "create-child",
				name: "Create Child Zettel",
				icon: "file-plus",
				callback: () => this.createChildZettelForBox(box),
			},
			{
				id: "create-sibling",
				name: "Create Sibling Zettel",
				icon: "file-plus",
				callback: () => this.createSiblingZettelForBox(box),
			},
			{
				id: "navigator",
				name: "Zettelkasten Navigator",
				icon: "compass",
				callback: () => this.openNavigatorForBox(box),
			},
		];

		if (box.enableFleetingNotes) {
			commands.push({
				id: "create-fleeting",
				name: "Create Fleeting Note",
				icon: "file-plus",
				callback: () => this.createFleetingNoteForBox(box),
			});
		}

		if (box.enableMocs) {
			commands.push({
				id: "create-moc",
				name: "Create MOC",
				icon: "file-plus",
				callback: () => this.createMocForBox(box),
			});
		}

		if (box.enableIndexes) {
			commands.push({
				id: "create-index",
				name: "Create Index",
				icon: "file-plus",
				callback: () => this.createIndexForBox(box),
			});
		}

		return commands;
	}

	/**
	 * Gets the list of fix filename commands for a box (for the fix filename command palette)
	 */
	private getBoxFixFilenameCommands(box: Box): BoxCommand[] {
		const commands: BoxCommand[] = [
			{
				id: "fix-filenames",
				name: "Fix Filenames (Current File)",
				icon: "file-check",
				callback: () => this.fixFilenamesForBox(box),
			},
			{
				id: "batch-fix-filenames",
				name: "Batch Fix Filenames",
				icon: "folder-check",
				callback: () => this.batchFixFilenamesForBox(box),
			},
		];

		if (box.enableMocs) {
			commands.push({
				id: "fix-moc-filename",
				name: "Fix MOC Filename (Current File)",
				icon: "file-check",
				callback: () => this.fixMocFilenameForBox(box),
			});

			commands.push({
				id: "batch-fix-moc-filenames",
				name: "Batch Fix MOC Filenames",
				icon: "folder-check",
				callback: () => this.batchFixMocFilenamesForBox(box),
			});
		}

		if (box.enableIndexes) {
			commands.push({
				id: "fix-index-filename",
				name: "Fix Index Filename (Current File)",
				icon: "file-check",
				callback: () => this.fixIndexFilenameForBox(box),
			});

			commands.push({
				id: "batch-fix-index-filenames",
				name: "Batch Fix Index Filenames",
				icon: "folder-check",
				callback: () => this.batchFixIndexFilenamesForBox(box),
			});
		}

		return commands;
	}

	/**
	 * Registers the "Open Zettel" command
	 */
	private registerOpenZettelCommand(): void {
		this.plugin.addCommand({
			id: "open-zettel",
			name: "Open Zettel",
			icon: "folder-open",
			callback: async () => {
				const titles = await this.getNoteTitlesByTag(
					this.plugin.settings.zettelTag,
				);

				new ZettelSuggester(
					this.plugin.app,
					titles,
					this.currentlySelectedText(),
					(file: TFile) => {
						this.plugin.app.workspace.getLeaf().openFile(file);
					},
				).open();
			},
		});
	}

	/**
	 * Registers the "Open Parent Zettel" command
	 * Opens the parent zettel from the 'up' frontmatter property
	 */
	private registerOpenParentZettelCommand(): void {
		this.plugin.addCommand({
			id: "open-parent-zettel",
			name: "Open Parent Zettel",
			icon: "arrow-up",
			checkCallback: (checking: boolean) => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					return false;
				}

				if (checking) {
					return true;
				}

				// Get the file's metadata cache
				const cache =
					this.plugin.app.metadataCache.getFileCache(activeFile);
				const upLink = cache?.frontmatter?.up;

				if (!upLink) {
					new Notice("No parent link found in frontmatter (up:).");
					return false;
				}

				// Extract the link target from [[link]] or just the text
				let parentLinkText = upLink;
				if (typeof upLink === "string") {
					// Remove [[ ]] if present
					const match = upLink.match(/\[\[([^\]]+)\]\]/);
					if (match) {
						parentLinkText = match[1];
					}
				}

				// Try to resolve the link
				const parentFile =
					this.plugin.app.metadataCache.getFirstLinkpathDest(
						parentLinkText,
						activeFile.path,
					);

				if (!parentFile) {
					new Notice(`Parent zettel not found: ${parentLinkText}`);
					return false;
				}

				// Open the parent file
				this.plugin.app.workspace.getLeaf().openFile(parentFile);
				return true;
			},
		});
	}

	/**
	 * Registers the "Open Child Zettel" command
	 * Shows a list of child zettels to open
	 */
	private registerOpenChildZettelCommand(): void {
		this.plugin.addCommand({
			id: "open-child-zettel",
			name: "Open Child Zettel",
			icon: "arrow-down",
			checkCallback: (checking: boolean) => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					return false;
				}

				if (checking) {
					return true;
				}

				// Extract current zettel ID from filename
				const currentId = this.extractZettelId(activeFile.basename);

				if (!currentId) {
					new Notice(
						"Current file doesn't appear to be a zettel (no ID found in filename).",
					);
					return false;
				}

				// Find all child zettels
				this.findChildZettels(currentId).then((children) => {
					if (children.length === 0) {
						new Notice("No child zettels found.");
						return;
					}

					// Create a map of titles to files
					const childrenMap = new Map<string, TFile>();
					children.forEach((file) => {
						const cache =
							this.plugin.app.metadataCache.getFileCache(file);
						const title =
							cache?.frontmatter?.title ||
							file.basename.replace(/^\d+[a-z0-9]*\s*/, "") ||
							file.basename;
						childrenMap.set(title, file);
					});

					// Show suggester
					new ZettelSuggester(
						this.plugin.app,
						childrenMap,
						"",
						(file: TFile) => {
							this.plugin.app.workspace.getLeaf().openFile(file);
						},
					).open();
				});

				return true;
			},
		});
	}

	/**
	 * Registers the "Open Fleeting Note" command
	 */
	private registerOpenFleetingCommand(): void {
		this.plugin.addCommand({
			id: "open-fleeting",
			name: "Open Fleeting Note",
			icon: "file-text",
			checkCallback: (checking: boolean) => {
				if (!this.plugin.settings.enableFleetingNotes) {
					return false;
				}

				if (checking) {
					return true;
				}

				this.getNoteTitlesByTag(
					this.plugin.settings.fleetingNotesTag,
				).then((titles) => {
					new ZettelSuggester(
						this.plugin.app,
						titles,
						this.currentlySelectedText(),
						(file: TFile) => {
							this.plugin.app.workspace.getLeaf().openFile(file);
						},
						true,
					).open();
				});

				return true;
			},
		});
	}

	/**
	 * Registers the "Open MOC" command
	 */
	private registerOpenMocCommand(): void {
		this.plugin.addCommand({
			id: "open-moc",
			name: "Open MOC",
			icon: "file-stack",
			checkCallback: (checking: boolean) => {
				if (!this.plugin.settings.enableMocs) {
					return false;
				}

				if (checking) {
					return true;
				}

				this.getNoteTitlesByTag(this.plugin.settings.mocsTag).then(
					(titles) => {
						new ZettelSuggester(
							this.plugin.app,
							titles,
							this.currentlySelectedText(),
							(file: TFile) => {
								this.plugin.app.workspace
									.getLeaf()
									.openFile(file);
							},
						).open();
					},
				);

				return true;
			},
		});
	}

	/**
	 * Registers the "Open Index" command
	 */
	private registerOpenIndexCommand(): void {
		this.plugin.addCommand({
			id: "open-index",
			name: "Open Index",
			icon: "list",
			checkCallback: (checking: boolean) => {
				if (!this.plugin.settings.enableIndexes) {
					return false;
				}

				if (checking) {
					return true;
				}

				this.getNoteTitlesByTag(this.plugin.settings.indexesTag).then(
					(titles) => {
						new ZettelSuggester(
							this.plugin.app,
							titles,
							this.currentlySelectedText(),
							(file: TFile) => {
								this.plugin.app.workspace
									.getLeaf()
									.openFile(file);
							},
						).open();
					},
				);

				return true;
			},
		});
	}

	/**
	 * Registers the "Open Sibling Zettel" command
	 * Opens a suggester to navigate to a sibling zettel (same hierarchy level)
	 */
	private registerOpenSiblingZettelCommand(): void {
		this.plugin.addCommand({
			id: "open-sibling-zettel",
			name: "Open Sibling Zettel",
			icon: "arrow-left-right",
			checkCallback: (checking: boolean) => {
				const activeFile = this.plugin.app.workspace.getActiveFile();
				if (!activeFile) {
					return false;
				}

				if (checking) {
					return true;
				}

				// Extract current zettel ID
				const currentId = this.extractZettelId(activeFile.basename);

				if (!currentId) {
					new Notice(
						"Current file doesn't appear to be a zettel (no ID found in filename).",
					);
					return false;
				}

				this.findSiblingZettels(currentId).then((siblings) => {
					if (siblings.length === 0) {
						new Notice("No siblings found for this zettel.");
						return;
					}

					// Filter out the current file from siblings
					const otherSiblings = siblings.filter(
						(file) => file.path !== activeFile.path,
					);

					if (otherSiblings.length === 0) {
						new Notice("No other siblings found for this zettel.");
						return;
					}

					// Create a map of titles to files
					const titlesMap = new Map<string, TFile>();
					for (const sibling of otherSiblings) {
						const cache =
							this.plugin.app.metadataCache.getFileCache(sibling);
						const title =
							cache?.frontmatter?.title ||
							sibling.basename.replace(
								/^\d{13,}[a-z0-9]*\s*-?\s*/i,
								"",
							);
						titlesMap.set(title, sibling);
					}

					// Show suggester with siblings
					new ZettelSuggester(
						this.plugin.app,
						titlesMap,
						this.currentlySelectedText(),
						(file: TFile) => {
							this.plugin.app.workspace.getLeaf().openFile(file);
						},
					).open();
				});

				return true;
			},
		});
	}

	/**
	 * Registers the "Zettelkasten Navigator" command
	 * Provides directional navigation: up (parent), down (child), left (prev sibling), right (next sibling)
	 */
	private registerZettelkastenNavigatorCommand(): void {
		this.plugin.addCommand({
			id: "zettelkasten-navigator",
			name: "Zettelkasten Navigator",
			icon: "compass",
			checkCallback: (checking: boolean) => {
				const activeFile = this.plugin.app.workspace.getActiveFile();
				if (!activeFile) {
					return false;
				}

				if (checking) {
					return true;
				}

				const currentId = this.extractZettelId(activeFile.basename);
				if (!currentId) {
					new Notice("Current file doesn't appear to be a zettel.");
					return false;
				}

				// Get current note title
				const cache =
					this.plugin.app.metadataCache.getFileCache(activeFile);
				const currentTitle =
					cache?.frontmatter?.title || activeFile.basename;

				// Build navigation options
				this.buildNavigationOptions(activeFile, currentId).then(
					(options) => {
						new NavigatorModal(
							this.plugin.app,
							currentTitle,
							options,
							(file: TFile) => {
								this.plugin.app.workspace
									.getLeaf()
									.openFile(file);
							},
						).open();
					},
				);

				return true;
			},
		});
	}

	/**
	 * Registers the "Assign Parent" command
	 * Allows reassigning the parent of the currently open zettel
	 */
	private registerAssignParentCommand(): void {
		this.plugin.addCommand({
			id: "assign-parent",
			name: "Assign Parent",
			icon: "link",
			checkCallback: (checking: boolean) => {
				const activeFile = this.plugin.app.workspace.getActiveFile();
				if (!activeFile) {
					return false;
				}

				if (checking) {
					return true;
				}

				// Get all zettels to choose from
				this.getNoteTitlesByTag(this.plugin.settings.zettelTag).then(
					(titles) => {
						// Filter out the current file from potential parents
						const filteredTitles = new Map<string, TFile>();
						for (const [title, file] of titles) {
							if (file.path !== activeFile.path) {
								filteredTitles.set(title, file);
							}
						}

						if (filteredTitles.size === 0) {
							new Notice(
								"No other zettels found to assign as parent.",
							);
							return;
						}

						new ZettelSuggester(
							this.plugin.app,
							filteredTitles,
							this.currentlySelectedText(),
							async (parentFile: TFile) => {
								try {
									// Extract parent ID from the selected parent file
									const parentId = this.extractZettelId(
										parentFile.basename,
									);

									if (!parentId) {
										new Notice(
											"Selected parent doesn't have a valid zettel ID.",
										);
										return;
									}

									// Extract current ID from active file
									const currentId = this.extractZettelId(
										activeFile.basename,
									);
									if (!currentId) {
										new Notice(
											"Current file doesn't have a valid zettel ID.",
										);
										return;
									}

									// Get all descendants of the current file
									const descendants =
										this.getAllDescendants(currentId);

									// Get the folder where zettels are stored
									const folder = this.getNoteTypeFolder(
										this.plugin.settings
											.zettelsUseSeparateLocation,
										this.plugin.settings.zettelsLocation,
									);

									// Generate new child ID based on parent for the active file
									const newChildId =
										await this.generateChildZettelId(
											parentId,
											folder,
											activeFile,
										);

									// Rename the active file with the new child ID
									const newPath = `${folder.path}/${newChildId}.md`;
									await this.plugin.app.fileManager.renameFile(
										activeFile,
										newPath,
									);

									// Add parent link to the file
									await this.addParentLinkToFile(
										activeFile,
										parentFile,
									);

									// Now rename all descendants to maintain the hierarchy
									for (const descendant of descendants) {
										const descendantId =
											this.extractZettelId(
												descendant.basename,
											);
										if (!descendantId) continue;

										// Transform the descendant ID preserving alternating letter/number pattern
										const newDescendantId =
											this.transformDescendantId(
												descendantId,
												currentId,
												newChildId,
											);

										const descendantNewPath = `${folder.path}/${newDescendantId}.md`;
										await this.plugin.app.fileManager.renameFile(
											descendant,
											descendantNewPath,
										);
									}
									new Notice(
										`Assigned parent and renamed ${descendants.length + 1} file(s) to: ${newChildId}`,
									);

									// Keep the file open after rename
									await this.plugin.app.workspace
										.getLeaf()
										.openFile(activeFile);
								} catch (error) {
									new Notice(
										`Error assigning parent: ${error.message}`,
									);
								}
							},
						).open();
					},
				);
				return true;
			},
		});
	}

	/**
	 * Registers the "Assign Child" command
	 * Allows selecting an existing zettel to become a child of the currently open zettel
	 */
	private registerAssignChildCommand(): void {
		this.plugin.addCommand({
			id: "assign-child",
			name: "Assign Child",
			icon: "git-branch",
			checkCallback: (checking: boolean) => {
				const activeFile = this.plugin.app.workspace.getActiveFile();
				if (!activeFile) {
					return false;
				}

				if (checking) {
					return true;
				}

				// Extract parent ID from current file
				const parentId = this.extractZettelId(activeFile.basename);

				if (!parentId) {
					new Notice(
						"Current file doesn't appear to be a zettel (no ID found in filename).",
					);
					return false;
				}

				// Get all zettels to choose from
				this.getNoteTitlesByTag(this.plugin.settings.zettelTag).then(
					(titles) => {
						// Filter out the current file from potential children
						const filteredTitles = new Map<string, TFile>();
						for (const [title, file] of titles) {
							if (file.path !== activeFile.path) {
								filteredTitles.set(title, file);
							}
						}

						if (filteredTitles.size === 0) {
							new Notice(
								"No other zettels found to assign as child.",
							);
							return;
						}

						new ZettelSuggester(
							this.plugin.app,
							filteredTitles,
							this.currentlySelectedText(),
							async (childFile: TFile) => {
								try {
									// Extract current ID from the child file before renaming
									const currentChildId = this.extractZettelId(
										childFile.basename,
									);
									if (!currentChildId) {
										new Notice(
											"Selected child doesn't have a valid zettel ID.",
										);
										return;
									}

									// Get all descendants of the child file
									const descendants =
										this.getAllDescendants(currentChildId);

									// Get the folder where zettels are stored
									const folder = this.getNoteTypeFolder(
										this.plugin.settings
											.zettelsUseSeparateLocation,
										this.plugin.settings.zettelsLocation,
									);

									// Generate new child ID based on current file (parent)
									const newChildId =
										await this.generateChildZettelId(
											parentId,
											folder,
											childFile,
										);

									// Rename the selected file with the new child ID
									const newPath = `${folder.path}/${newChildId}.md`;
									await this.plugin.app.fileManager.renameFile(
										childFile,
										newPath,
									);

									// Add parent link to the renamed file
									await this.addParentLinkToFile(
										childFile,
										activeFile,
									);

									// Now rename all descendants to maintain the hierarchy
									for (const descendant of descendants) {
										const descendantId =
											this.extractZettelId(
												descendant.basename,
											);
										if (!descendantId) continue;

										// Transform the descendant ID preserving alternating letter/number pattern
										const newDescendantId =
											this.transformDescendantId(
												descendantId,
												currentChildId,
												newChildId,
											);

										const descendantNewPath = `${folder.path}/${newDescendantId}.md`;
										await this.plugin.app.fileManager.renameFile(
											descendant,
											descendantNewPath,
										);
									}

									new Notice(
										`Assigned child and renamed ${descendants.length + 1} file(s) to: ${newChildId}`,
									);
								} catch (error) {
									new Notice(
										`Error assigning child: ${error.message}`,
									);
								}
							},
						).open();
					},
				);

				return true;
			},
		});
	}

	/**
	 * Registers the "Move to Root" command
	 * Moves a zettel and its descendants to root level using the file's creation date
	 */
	private registerMoveToRootCommand(): void {
		this.plugin.addCommand({
			id: "move-to-root",
			name: "Move to Root",
			icon: "arrow-up-to-line",
			checkCallback: (checking: boolean) => {
				const activeFile = this.plugin.app.workspace.getActiveFile();
				if (!activeFile) {
					return false;
				}

				if (checking) {
					return true;
				}

				(async () => {
					try {
						// Extract current ID from active file
						const currentId = this.extractZettelId(
							activeFile.basename,
						);
						if (!currentId) {
							new Notice(
								"Current file doesn't have a valid zettel ID.",
							);
							return;
						}

						// Get all descendants of the current file
						const descendants = this.getAllDescendants(currentId);

						// Get the folder where zettels are stored
						const folder = this.getNoteTypeFolder(
							this.plugin.settings.zettelsUseSeparateLocation,
							this.plugin.settings.zettelsLocation,
						);

						// Generate new root ID based on file's creation date
						const creationTime = activeFile.stat.ctime;
						const creationDate = new Date(creationTime);
						const newRootId = this.formatTimestamp(creationDate);

						// Check if this ID already exists
						const existingFile = this.plugin.app.vault
							.getMarkdownFiles()
							.find((f) => f.basename === newRootId);

						if (
							existingFile &&
							existingFile.path !== activeFile.path
						) {
							new Notice(
								`A file with ID ${newRootId} already exists. Cannot move to root.`,
							);
							return;
						}

						// Rename the active file with the new root ID
						const newPath = `${folder.path}/${newRootId}.md`;
						await this.plugin.app.fileManager.renameFile(
							activeFile,
							newPath,
						);

						// Remove parent link from file (move to root)
						await this.removeParentLinkFromFile(activeFile);

						// Now rename all descendants to maintain the hierarchy
						for (const descendant of descendants) {
							const descendantId = this.extractZettelId(
								descendant.basename,
							);
							if (!descendantId) continue;

							// Transform the descendant ID preserving alternating letter/number pattern
							const newDescendantId = this.transformDescendantId(
								descendantId,
								currentId,
								newRootId,
							);

							const descendantNewPath = `${folder.path}/${newDescendantId}.md`;
							await this.plugin.app.fileManager.renameFile(
								descendant,
								descendantNewPath,
							);
						}

						new Notice(
							`Moved to root and renamed ${descendants.length + 1} file(s) to: ${newRootId}`,
						);

						// Keep the file open after rename
						await this.plugin.app.workspace
							.getLeaf()
							.openFile(activeFile);
					} catch (error) {
						new Notice(`Error moving to root: ${error.message}`);
					}
				})();

				return true;
			},
		});
	}

	/**
	 * Registers the "Fix Filenames" command
	 * Normalizes active file, its siblings, and their descendants to have consistent timestamp length
	 */
	private registerFixFilenamesCommand(): void {
		this.plugin.addCommand({
			id: "fix-filenames",
			name: "Fix Filenames (Normalize Length)",
			icon: "file-check",
			callback: async () => {
				try {
					const activeFile =
						this.plugin.app.workspace.getActiveFile();
					if (!activeFile) {
						new Notice("No active file.");
						return;
					}

					const currentId = this.extractZettelId(activeFile.basename);
					if (!currentId) {
						new Notice("Active file is not a zettel.");
						return;
					}

					const allFiles = this.plugin.app.vault.getMarkdownFiles();
					const zettels: TFile[] = [];

					// Find all files with zettel IDs
					for (const file of allFiles) {
						const id = this.extractZettelId(file.basename);
						if (id) {
							zettels.push(file);
						}
					}

					// Build parent-child relationships
					const childrenMap = new Map<string, TFile[]>();

					for (const file of zettels) {
						const id = this.extractZettelId(file.basename)!;
						const parentId = this.getParentZettelId(id);

						if (parentId) {
							if (!childrenMap.has(parentId)) {
								childrenMap.set(parentId, []);
							}
							childrenMap.get(parentId)!.push(file);
						}
					}

					// Find siblings (files with the same parent, including the active file)
					const currentParentId = this.getParentZettelId(currentId);
					let siblingsToProcess: TFile[] = [];

					if (currentParentId) {
						// Has a parent - get all siblings including self
						siblingsToProcess =
							childrenMap.get(currentParentId) || [];
					} else {
						// Is a root - only process itself
						siblingsToProcess = [activeFile];
					}

					let fixedCount = 0;

					// Process each sibling and its descendants
					for (const siblingFile of siblingsToProcess) {
						const count = await this.fixZettelFilenameRecursive(
							siblingFile,
							childrenMap,
						);
						fixedCount += count;
					}

					if (fixedCount > 0) {
						new Notice(
							`Fixed ${fixedCount} filename(s) to consistent length.`,
						);
					} else {
						new Notice("All filenames are already correct.");
					}
				} catch (error) {
					new Notice(`Error fixing filenames: ${error.message}`);
				}
			},
		});
	}

	/**
	 * Registers the "Batch Fix Filenames by Folder" command
	 * Normalizes all zettel filenames within a selected folder (including subfolders)
	 */
	private registerBatchFixFilenamesCommand(): void {
		this.plugin.addCommand({
			id: "batch-fix-filenames",
			name: "Batch Fix Filenames (Select Folder)",
			icon: "folder-check",
			callback: async () => {
				new FolderSuggestModal(this.plugin, async (folder: TFolder) => {
					try {
						const allFiles =
							this.plugin.app.vault.getMarkdownFiles();
						const zettels: TFile[] = [];

						// Find all files with zettel IDs in the selected folder and subfolders
						for (const file of allFiles) {
							// Check if file is within the selected folder
							if (this.isFileInFolder(file, folder)) {
								const id = this.extractZettelId(file.basename);
								if (id) {
									zettels.push(file);
								}
							}
						}

						if (zettels.length === 0) {
							new Notice(`No zettels found in ${folder.path}.`);
							return;
						}

						// Build parent-child relationships
						const parentMap = new Map<string, string>();
						const childrenMap = new Map<string, TFile[]>();

						for (const file of zettels) {
							const id = this.extractZettelId(file.basename)!;
							const parentId = this.getParentZettelId(id);

							if (parentId) {
								parentMap.set(id, parentId);

								if (!childrenMap.has(parentId)) {
									childrenMap.set(parentId, []);
								}
								childrenMap.get(parentId)!.push(file);
							}
						}

						// Find root zettels in folder (no parent or parent not in folder)
						const rootZettels = zettels.filter((file) => {
							const id = this.extractZettelId(file.basename)!;
							const parentId = parentMap.get(id);

							// Root if no parent, or parent is not in the zettels list
							return (
								!parentId ||
								!zettels.some(
									(f) =>
										this.extractZettelId(f.basename) ===
										parentId,
								)
							);
						});

						let fixedCount = 0;

						// Process each root and its descendants
						for (const rootFile of rootZettels) {
							const count = await this.fixZettelFilenameRecursive(
								rootFile,
								childrenMap,
							);
							fixedCount += count;
						}

						const folderDisplay =
							folder.path === "/" ? "root" : folder.path;
						if (fixedCount > 0) {
							new Notice(
								`Fixed ${fixedCount} filename(s) in ${folderDisplay}.`,
							);
						} else {
							new Notice(
								`All filenames in ${folderDisplay} are already correct.`,
							);
						}
					} catch (error) {
						new Notice(`Error fixing filenames: ${error.message}`);
					}
				}).open();
			},
		});
	}

	/**
	 * Registers the "Fix Current MOC Filename" command
	 * Renames the current MOC file to match the configured filename format
	 */
	private registerFixCurrentMocFilenameCommand(): void {
		this.plugin.addCommand({
			id: "fix-current-moc-filename",
			name: "Fix Current MOC Filename",
			icon: "file-check",
			callback: async () => {
				try {
					const activeFile =
						this.plugin.app.workspace.getActiveFile();
					if (!activeFile) {
						new Notice("No active file.");
						return;
					}

					// Check if file has MOC tag
					const noteType = this.getNoteTypeFromFile(activeFile);
					if (noteType !== "moc") {
						new Notice("Active file is not a MOC.");
						return;
					}

					const fixed = await this.fixMocFilename(activeFile);
					if (fixed) {
						new Notice("MOC filename fixed.");
					} else {
						new Notice("MOC filename is already correct.");
					}
				} catch (error) {
					new Notice(`Error fixing MOC filename: ${error.message}`);
				}
			},
		});
	}

	/**
	 * Registers the "Batch Fix MOC Filenames" command
	 * Renames MOC files in a selected folder to match the configured filename format
	 */
	private registerBatchFixMocFilenamesCommand(): void {
		this.plugin.addCommand({
			id: "batch-fix-moc-filenames",
			name: "Batch Fix MOC Filenames (Select Folder)",
			icon: "folder-check",
			callback: async () => {
				new FolderSuggestModal(this.plugin, async (folder: TFolder) => {
					try {
						const allFiles =
							this.plugin.app.vault.getMarkdownFiles();
						let fixedCount = 0;

						for (const file of allFiles) {
							// Check if file is within the selected folder
							if (!this.isFileInFolder(file, folder)) {
								continue;
							}

							// Skip ignored folders
							if (this.shouldIgnoreFile(file)) {
								continue;
							}

							// Check if file has MOC tag
							const noteType = this.getNoteTypeFromFile(file);
							if (noteType !== "moc") {
								continue;
							}

							const fixed = await this.fixMocFilename(file);
							if (fixed) {
								fixedCount++;
							}
						}

						const folderDisplay =
							folder.path === "/" ? "root" : folder.path;
						if (fixedCount > 0) {
							new Notice(
								`Fixed ${fixedCount} MOC filename(s) in ${folderDisplay}.`,
							);
						} else {
							new Notice(
								`All MOC filenames in ${folderDisplay} are already correct.`,
							);
						}
					} catch (error) {
						new Notice(
							`Error fixing MOC filenames: ${error.message}`,
						);
					}
				}).open();
			},
		});
	}

	/**
	 * Fixes a single MOC file's filename to match the configured format
	 * Returns true if the file was renamed, false if already correct
	 */
	private async fixMocFilename(file: TFile, box?: Box): Promise<boolean> {
		// Get title from frontmatter or current filename
		const cache = this.plugin.app.metadataCache.getFileCache(file);
		const title = cache?.frontmatter?.title || file.basename;

		// Build the expected filename based on settings
		const expectedFilename = this.buildMocFilename(title, box);

		// Check if filename needs fixing
		if (file.basename !== expectedFilename) {
			const folder = file.parent || this.plugin.app.vault.getRoot();
			const newPath = `${folder.path}/${expectedFilename}.md`;

			// Check if target path already exists
			const existing =
				this.plugin.app.vault.getAbstractFileByPath(newPath);
			if (existing && existing !== file) {
				console.warn(
					`Cannot fix ${file.basename}: ${expectedFilename}.md already exists`,
				);
				return false;
			} else {
				await this.plugin.app.fileManager.renameFile(file, newPath);
				return true;
			}
		}

		return false;
	}

	/**
	 * Registers the "Fix Current Index Filename" command
	 * Renames the current Index file to match the configured filename format
	 */
	private registerFixCurrentIndexFilenameCommand(): void {
		this.plugin.addCommand({
			id: "fix-current-index-filename",
			name: "Fix Current Index Filename",
			icon: "file-check",
			callback: async () => {
				try {
					const activeFile =
						this.plugin.app.workspace.getActiveFile();
					if (!activeFile) {
						new Notice("No active file.");
						return;
					}

					// Check if file has Index tag
					const noteType = this.getNoteTypeFromFile(activeFile);
					if (noteType !== "index") {
						new Notice("Active file is not an Index.");
						return;
					}

					const fixed = await this.fixIndexFilename(activeFile);
					if (fixed) {
						new Notice("Index filename fixed.");
					} else {
						new Notice("Index filename is already correct.");
					}
				} catch (error) {
					new Notice(`Error fixing Index filename: ${error.message}`);
				}
			},
		});
	}

	/**
	 * Registers the "Batch Fix Index Filenames" command
	 * Renames Index files in a selected folder to match the configured filename format
	 */
	private registerBatchFixIndexFilenamesCommand(): void {
		this.plugin.addCommand({
			id: "batch-fix-index-filenames",
			name: "Batch Fix Index Filenames (Select Folder)",
			icon: "folder-check",
			callback: async () => {
				new FolderSuggestModal(this.plugin, async (folder: TFolder) => {
					try {
						const allFiles =
							this.plugin.app.vault.getMarkdownFiles();
						let fixedCount = 0;

						for (const file of allFiles) {
							// Check if file is within the selected folder
							if (!this.isFileInFolder(file, folder)) {
								continue;
							}

							// Skip ignored folders
							if (this.shouldIgnoreFile(file)) {
								continue;
							}

							// Check if file has Index tag
							const noteType = this.getNoteTypeFromFile(file);
							if (noteType !== "index") {
								continue;
							}

							const fixed = await this.fixIndexFilename(file);
							if (fixed) {
								fixedCount++;
							}
						}

						const folderDisplay =
							folder.path === "/" ? "root" : folder.path;
						if (fixedCount > 0) {
							new Notice(
								`Fixed ${fixedCount} Index filename(s) in ${folderDisplay}.`,
							);
						} else {
							new Notice(
								`All Index filenames in ${folderDisplay} are already correct.`,
							);
						}
					} catch (error) {
						new Notice(
							`Error fixing Index filenames: ${error.message}`,
						);
					}
				}).open();
			},
		});
	}

	/**
	 * Fixes a single Index file's filename to match the configured format
	 * Returns true if the file was renamed, false if already correct
	 */
	private async fixIndexFilename(file: TFile, box?: Box): Promise<boolean> {
		// Get title from frontmatter or current filename
		const cache = this.plugin.app.metadataCache.getFileCache(file);
		const title = cache?.frontmatter?.title || file.basename;

		// Build the expected filename based on settings
		const expectedFilename = this.buildIndexFilename(title, box);

		// Check if filename needs fixing
		if (file.basename !== expectedFilename) {
			const folder = file.parent || this.plugin.app.vault.getRoot();
			const newPath = `${folder.path}/${expectedFilename}.md`;

			// Check if target path already exists
			const existing =
				this.plugin.app.vault.getAbstractFileByPath(newPath);
			if (existing && existing !== file) {
				console.warn(
					`Cannot fix ${file.basename}: ${expectedFilename}.md already exists`,
				);
				return false;
			} else {
				await this.plugin.app.fileManager.renameFile(file, newPath);
				return true;
			}
		}

		return false;
	}

	/**
	 * Helper method to check if a file is within a folder (including subfolders)
	 */
	private isFileInFolder(file: TFile, folder: TFolder): boolean {
		// Root folder contains everything
		if (folder.path === "/") {
			return true;
		}

		// Check if file path starts with folder path
		return file.path.startsWith(folder.path + "/");
	}

	/**
	 * Helper method to check if a file belongs to a specific box
	 */
	private fileMatchesBox(file: TFile, box: Box): boolean {
		if (box.type === "folder" && box.folderPath) {
			// For folder-based boxes, check if file is in the specified folder
			const normalizedFolderPath = box.folderPath.endsWith("/")
				? box.folderPath.slice(0, -1)
				: box.folderPath;

			// Root folder
			if (normalizedFolderPath === "" || normalizedFolderPath === "/") {
				return true;
			}

			return (
				file.path.startsWith(normalizedFolderPath + "/") ||
				file.path === normalizedFolderPath
			);
		} else if (box.type === "tag" && box.tagName) {
			// For tag-based boxes, check if file has the tag
			const cache = this.plugin.app.metadataCache.getFileCache(file);
			const inlineTags =
				cache?.tags?.map((t) => t.tag.replace("#", "")) || [];
			const frontmatterTags = cache?.frontmatter?.tags || [];

			const allTags = [
				...inlineTags,
				...(Array.isArray(frontmatterTags)
					? frontmatterTags
					: [frontmatterTags].filter(Boolean)),
			].map((t) => String(t).replace("#", ""));

			return allTags.includes(box.tagName);
		}

		return false;
	}

	/**
	 * Recursively fixes a zettel and its descendants to have consistent timestamp length
	 * Returns the number of files fixed
	 */
	private async fixZettelFilenameRecursive(
		file: TFile,
		childrenMap: Map<string, TFile[]>,
		parentNormalizedId?: string,
		box?: Box,
	): Promise<number> {
		const currentId = this.extractZettelId(file.basename)!;
		let normalizedId: string;

		if (parentNormalizedId) {
			// If we have a parent that was normalized, we need to rebuild this ID based on the normalized parent
			const currentIdWithoutPrefix = this.stripPrefix(currentId);
			const currentTimestamp =
				currentIdWithoutPrefix.match(/^(\d+)/)?.[1] || "";
			const currentHierarchy = currentIdWithoutPrefix.substring(
				currentTimestamp.length,
			);

			// Extract parent's normalized timestamp (without prefix)
			const parentIdWithoutPrefix = this.stripPrefix(parentNormalizedId);
			const parentTimestamp =
				parentIdWithoutPrefix.match(/^(\d+)/)?.[1] || "";

			// Determine this file's own prefix based on its note type
			const noteType = this.getNoteTypeFromFile(file);
			const shouldUsePrefix = this.shouldUsePrefixForNoteType(noteType, box);
			const desiredPrefix = shouldUsePrefix
				? this.getPrefixForNoteType(noteType, box)
				: "";

			// Use the parent's normalized timestamp with this file's own prefix and hierarchy
			normalizedId = desiredPrefix + parentTimestamp + currentHierarchy;
		} else {
			// Root level - normalize independently and add/update prefix based on note type
			normalizedId = this.normalizeZettelId(file, currentId, box);
		}

		let count = 0;

		// Build the full filename with separator and title
		const title = this.getTitleFromFile(file);
		const newFilename = this.buildZettelFilename(normalizedId, title, box);

		// Check if this file needs fixing (compare full filename, not just ID)
		if (file.basename !== newFilename) {
			const folder = file.parent || this.plugin.app.vault.getRoot();
			const newPath = `${folder.path}/${newFilename}.md`;

			// Check if target path already exists
			const existing =
				this.plugin.app.vault.getAbstractFileByPath(newPath);
			if (existing && existing !== file) {
				console.warn(
					`Cannot fix ${file.basename}: ${newFilename}.md already exists`,
				);
			} else {
				await this.plugin.app.fileManager.renameFile(file, newPath);
				count++;
			}
		}

		// Process children with the normalized ID as their parent
		const children = childrenMap.get(currentId) || [];
		for (const child of children) {
			const childCount = await this.fixZettelFilenameRecursive(
				child,
				childrenMap,
				normalizedId,
				box,
			);
			count += childCount;
		}

		return count;
	}

	/**
	 * Normalizes a zettel ID to have consistent timestamp length (17 digits)
	 * Maintains the hierarchy suffix and adds/updates prefix based on note type
	 */
	private normalizeZettelId(file: TFile, zettelId: string, box?: Box): string {
		// Determine note type from file tags
		const noteType = this.getNoteTypeFromFile(file);
		const shouldUsePrefix = this.shouldUsePrefixForNoteType(noteType, box);
		const desiredPrefix = shouldUsePrefix
			? this.getPrefixForNoteType(noteType, box)
			: "";

		// Extract current prefix (if any) and strip it
		const idWithoutPrefix = this.stripPrefix(zettelId);

		const timestampMatch = idWithoutPrefix.match(/^(\d+)/);
		if (!timestampMatch) return zettelId;

		const timestamp = timestampMatch[1];
		const hierarchy = idWithoutPrefix.substring(timestamp.length);

		// Target: 17 digits (YYYYMMDDHHmmssSSS)
		const targetLength = 17;

		let normalizedTimestamp: string;

		if (timestamp.length < targetLength) {
			// Pad with current milliseconds if ending with 000, otherwise pad with zeros
			normalizedTimestamp = timestamp.padEnd(targetLength, "0");

			// If the padded timestamp ends with 000, replace with current milliseconds
			if (normalizedTimestamp.endsWith("000")) {
				const currentMs = new Date()
					.getMilliseconds()
					.toString()
					.padStart(3, "0");
				normalizedTimestamp =
					normalizedTimestamp.substring(0, targetLength - 3) +
					currentMs;
			}
		} else if (timestamp.length > targetLength) {
			// Truncate to target length
			normalizedTimestamp = timestamp.substring(0, targetLength);
		} else {
			// Already correct length - check if ends with 000
			if (timestamp.endsWith("000")) {
				const currentMs = new Date()
					.getMilliseconds()
					.toString()
					.padStart(3, "0");
				normalizedTimestamp =
					timestamp.substring(0, targetLength - 3) + currentMs;
			} else {
				normalizedTimestamp = timestamp;
			}
		}

		return desiredPrefix + normalizedTimestamp + hierarchy;
	}

	/**
	 * Registers the "Create Zettel" command
	 */
	private registerCreateNoteCommand(): void {
		this.plugin.addCommand({
			id: "create-new-note",
			name: "Create Zettel",
			icon: "file-plus",
			callback: async () => {
				// Get existing zettel notes for autocomplete
				const notesMap = await this.getNoteTitlesByTag(
					this.plugin.settings.zettelTag,
				);

				new CreateNoteWithSuggestModal(
					this.plugin.app,
					notesMap,
					async (title: string) => {
						const folder = this.getNoteTypeFolder(
							this.plugin.settings.zettelsUseSeparateLocation,
							this.plugin.settings.zettelsLocation,
						);
						const zettelId = this.generateZettelId();
						const filename = zettelId;
						const path = `${folder.path}/${filename}.md`;

						const creator = new FileCreator(
							this.plugin.app,
							path,
							title,
							() => {
								new Notice(`Created zettel: ${filename}`);
							},
							this.plugin.settings.noteTemplatePath,
						);
						try {
							await creator.create();
						} catch (error) {
							new Notice(
								`Error creating zettel: ${error.message}`,
							);
						}
					},
				).open();
			},
		});
	}

	/**
	 * Registers the "Create Child Zettel" command
	 * Creates a new zettel as a child of the currently open zettel
	 */
	private registerCreateChildZettelCommand(): void {
		this.plugin.addCommand({
			id: "create-child-zettel",
			name: "Create Child Zettel",
			icon: "file-down",
			callback: async () => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					new Notice("No active file. Please open a zettel first.");
					return;
				}

				// Extract parent zettel ID from filename
				const parentId = this.extractZettelId(activeFile.basename);

				if (!parentId) {
					new Notice(
						"Current file doesn't appear to be a zettel (no ID found in filename).",
					);
					return;
				}

				// Get existing zettel notes with valid IDs for autocomplete
				const notesMap = await this.getValidZettels(
					this.plugin.settings.zettelTag,
				);

				new CreateNoteWithSuggestModal(
					this.plugin.app,
					notesMap,
					async (title: string, existingFile?: TFile) => {
						const folder = this.getNoteTypeFolder(
							this.plugin.settings.zettelsUseSeparateLocation,
							this.plugin.settings.zettelsLocation,
						);

						// Generate child zettel ID
						const childId = await this.generateChildZettelId(
							parentId,
							folder,
						);

						if (existingFile) {
							// Rename existing file to be a child of current zettel
							try {
								const newPath = `${folder.path}/${childId}.md`;
								await this.plugin.app.fileManager.renameFile(
									existingFile,
									newPath,
								);

								// Add parent link to the renamed file
								await this.addParentLinkToFile(
									existingFile,
									activeFile,
								);

								new Notice(
									`Renamed to child zettel: ${childId}`,
								);

								// Open the renamed file
								await this.plugin.app.workspace
									.getLeaf()
									.openFile(existingFile);
							} catch (error) {
								new Notice(
									`Error renaming file: ${error.message}`,
								);
							}
						} else {
							// Create new child zettel
							const filename = childId;
							const path = `${folder.path}/${filename}.md`;

							const creator = new FileCreator(
								this.plugin.app,
								path,
								title,
								() => {
									new Notice(
										`Created child zettel: ${filename}`,
									);
								},
								this.plugin.settings.noteTemplatePath,
							);

							try {
								const result = await creator.create();

								// Add link to parent in the new file
								if (result.success && result.file) {
									await this.addParentLinkToFile(
										result.file,
										activeFile,
									);
								}
							} catch (error) {
								new Notice(
									`Error creating child zettel: ${error.message}`,
								);
							}
						}
					},
				).open();
			},
		});
	}

	/**
	 * Registers the "Create Sibling Zettel" command
	 * Creates a new zettel at the same level as the current note
	 */
	private registerCreateSiblingZettelCommand(): void {
		this.plugin.addCommand({
			id: "create-sibling-zettel",
			name: "Create Sibling Zettel",
			icon: "file-plus",
			callback: async () => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					new Notice("No active file. Please open a zettel first.");
					return;
				}

				// Extract current zettel ID from filename
				const currentId = this.extractZettelId(activeFile.basename);

				if (!currentId) {
					new Notice(
						"Current file doesn't appear to be a zettel (no ID found in filename).",
					);
					return;
				}

				// Get parent ID to determine sibling level
				const parentId = this.getParentZettelId(currentId);

				// Get existing zettel notes with valid IDs for autocomplete
				const notesMap = await this.getValidZettels(
					this.plugin.settings.zettelTag,
				);

				new CreateNoteWithSuggestModal(
					this.plugin.app,
					notesMap,
					async (title: string, existingFile?: TFile) => {
						const folder = this.getNoteTypeFolder(
							this.plugin.settings.zettelsUseSeparateLocation,
							this.plugin.settings.zettelsLocation,
						);

						let siblingId: string;

						// If at root level (no parent), create a new root-level zettel
						if (!parentId) {
							siblingId = this.generateZettelId();
						} else {
							// Generate sibling zettel ID (child of parent)
							siblingId = await this.generateChildZettelId(
								parentId,
								folder,
							);
						}

						if (existingFile) {
							// Rename existing file to be a sibling
							try {
								const newPath = `${folder.path}/${siblingId}.md`;
								await this.plugin.app.fileManager.renameFile(
									existingFile,
									newPath,
								);

								// Add parent link if there's a parent
								if (parentId) {
									const parentFile =
										await this.findZettelById(parentId);
									if (parentFile) {
										await this.addParentLinkToFile(
											existingFile,
											parentFile,
										);
									}
								}

								new Notice(
									`Renamed to sibling zettel: ${siblingId}`,
								);

								// Open the renamed file
								await this.plugin.app.workspace
									.getLeaf()
									.openFile(existingFile);
							} catch (error) {
								new Notice(
									`Error renaming file: ${error.message}`,
								);
							}
						} else {
							// Create new sibling zettel
							const filename = siblingId;
							const path = `${folder.path}/${filename}.md`;

							const creator = new FileCreator(
								this.plugin.app,
								path,
								title,
								() => {
									new Notice(
										`Created sibling zettel: ${filename}`,
									);
								},
								this.plugin.settings.noteTemplatePath,
							);

							try {
								const result = await creator.create();

								// Add link to parent in the new file (if there's a parent)
								if (result.success && result.file && parentId) {
									const parentFile =
										await this.findZettelById(parentId);
									if (parentFile) {
										await this.addParentLinkToFile(
											result.file,
											parentFile,
										);
									}
								}
							} catch (error) {
								new Notice(
									`Error creating sibling zettel: ${error.message}`,
								);
							}
						}
					},
				).open();
			},
		});
	}

	/**
	 * Registers the "Indent Zettel" command
	 * Makes current zettel a child of the previous sibling
	 */
	private registerIndentZettelCommand(): void {
		this.plugin.addCommand({
			id: "indent-zettel",
			name: "Indent Zettel",
			icon: "indent",
			callback: async () => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					new Notice("No active file.");
					return;
				}

				const currentId = this.extractZettelId(activeFile.basename);
				if (!currentId) {
					new Notice("Current file is not a zettel.");
					return;
				}

				try {
					await this.indentZettel(activeFile, currentId);
				} catch (error) {
					new Notice(`Error indenting zettel: ${error.message}`);
				}
			},
		});
	}

	/**
	 * Registers the "Outdent Zettel" command
	 * Makes current zettel a sibling of its parent
	 */
	private registerOutdentZettelCommand(): void {
		this.plugin.addCommand({
			id: "outdent-zettel",
			name: "Outdent Zettel",
			icon: "outdent",
			callback: async () => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					new Notice("No active file.");
					return;
				}

				const currentId = this.extractZettelId(activeFile.basename);
				if (!currentId) {
					new Notice("Current file is not a zettel.");
					return;
				}

				try {
					await this.outdentZettel(activeFile, currentId);
				} catch (error) {
					new Notice(`Error outdenting zettel: ${error.message}`);
				}
			},
		});
	}

	/**
	 * Registers the "Create Fleeting Note" command
	 */
	private registerCreateFleetingNoteCommand(): void {
		this.plugin.addCommand({
			id: "create-fleeting-note",
			name: "Create Fleeting Note",
			icon: "file-plus",
			callback: async () => {
				if (!this.plugin.settings.enableFleetingNotes) {
					new Notice("Fleeting notes are disabled");
					return;
				}

				const title = ""; // Empty title for fleeting notes
				const folder = this.getNoteTypeFolder(
					this.plugin.settings.fleetingNotesUseSeparateLocation,
					this.plugin.settings.fleetingNotesLocation,
				);
				const filename = this.buildFleetingFilename(title);
				const path = `${folder.path}/${filename}.md`;

				const creator = new FileCreator(
					this.plugin.app,
					path,
					title,
					() => {
						new Notice("Created fleeting note");
					},
					this.plugin.settings.fleetingNotesTemplatePath,
				);
				try {
					await creator.create();
				} catch (error) {
					new Notice(
						`Error creating fleeting note: ${error.message}`,
					);
				}
			},
		});
	} /**
	 * Registers the "Create MOC" command
	 */
	private registerCreateMocCommand(): void {
		this.plugin.addCommand({
			id: "create-moc",
			name: "Create MOC",
			icon: "file-plus",
			checkCallback: (checking: boolean) => {
				if (!this.plugin.settings.enableMocs) {
					return false;
				}

				if (checking) {
					return true;
				}

				// Get existing MOCs for autocomplete
				this.getNoteTitlesByTag(this.plugin.settings.mocsTag).then(
					(notesMap) => {
						new CreateNoteWithSuggestModal(
							this.plugin.app,
							notesMap,
							async (title: string) => {
								const folder = this.getNoteTypeFolder(
									this.plugin.settings
										.mocsUseSeparateLocation,
									this.plugin.settings.mocsLocation,
								);
								const filename = this.buildMocFilename(title);
								const path = `${folder.path}/${filename}.md`;

								const creator = new FileCreator(
									this.plugin.app,
									path,
									title,
									() => {
										new Notice(`Created MOC: ${title}`);
									},
									this.plugin.settings.mocsTemplatePath,
								);
								try {
									await creator.create();
								} catch (error) {
									new Notice(
										`Error creating MOC: ${error.message}`,
									);
								}
							},
						).open();
					},
				);

				return true;
			},
		});
	} /**
	 * Registers the "Create Index" command
	 */
	private registerCreateIndexCommand(): void {
		this.plugin.addCommand({
			id: "create-index",
			name: "Create Index",
			icon: "file-plus",
			checkCallback: (checking: boolean) => {
				if (!this.plugin.settings.enableIndexes) {
					return false;
				}

				if (checking) {
					return true;
				}

				// Get existing indexes for autocomplete
				this.getNoteTitlesByTag(this.plugin.settings.indexesTag).then(
					(notesMap) => {
						new CreateNoteWithSuggestModal(
							this.plugin.app,
							notesMap,
							async (title: string) => {
								const folder = this.getNoteTypeFolder(
									this.plugin.settings
										.indexesUseSeparateLocation,
									this.plugin.settings.indexesLocation,
								);
								const filename = this.buildIndexFilename(title);
								const path = `${folder.path}/${filename}.md`;

								const creator = new FileCreator(
									this.plugin.app,
									path,
									title,
									() => {
										new Notice(`Created index: ${title}`);
									},
									this.plugin.settings.indexesTemplatePath,
								);
								try {
									await creator.create();
								} catch (error) {
									new Notice(
										`Error creating index: ${error.message}`,
									);
								}
							},
						).open();
					},
				);

				return true;
			},
		});
	}

	/**
	 * Registers the "Move to Correct Location" command
	 * Moves the current file to its correct folder based on note type
	 * Only active when at least one note type has separate location enabled
	 */
	private registerMoveToCorrectLocationCommand(): void {
		this.plugin.addCommand({
			id: "move-to-correct-location",
			name: "Move to Correct Location",
			icon: "folder-input",
			checkCallback: (checking: boolean) => {
				// Only show command if at least one note type has separate location enabled
				const hasSeparateLocations =
					this.plugin.settings.zettelsUseSeparateLocation ||
					this.plugin.settings.fleetingNotesUseSeparateLocation ||
					this.plugin.settings.mocsUseSeparateLocation ||
					this.plugin.settings.indexesUseSeparateLocation;

				if (!hasSeparateLocations) {
					return false;
				}

				if (checking) {
					return true;
				}

				this.executeMoveToCorrectLocationCommand();
				return true;
			},
		});
	}

	/**
	 * Executes the move to correct location command logic
	 */
	private async executeMoveToCorrectLocationCommand(): Promise<void> {
		try {
			const activeFile = this.plugin.app.workspace.getActiveFile();
			if (!activeFile) {
				new Notice("No active file.");
				return;
			}

			const moved = await this.moveFileToCorrectLocation(activeFile);
			if (moved) {
				new Notice("File moved to correct location.");
			} else {
				new Notice("File is already in the correct location.");
			}
		} catch (error) {
			new Notice(`Error moving file: ${error.message}`);
		}
	}

	/**
	 * Registers the "Batch Move to Correct Location" command
	 * Moves all files in a selected folder to their correct locations based on note type
	 * Only active when at least one note type has separate location enabled
	 */
	private registerBatchMoveToCorrectLocationCommand(): void {
		this.plugin.addCommand({
			id: "batch-move-to-correct-location",
			name: "Batch Move to Correct Location (Select Folder)",
			icon: "folders",
			checkCallback: (checking: boolean) => {
				// Only show command if at least one note type has separate location enabled
				const hasSeparateLocations =
					this.plugin.settings.zettelsUseSeparateLocation ||
					this.plugin.settings.fleetingNotesUseSeparateLocation ||
					this.plugin.settings.mocsUseSeparateLocation ||
					this.plugin.settings.indexesUseSeparateLocation;

				if (!hasSeparateLocations) {
					return false;
				}

				if (checking) {
					return true;
				}

				this.executeBatchMoveToCorrectLocationCommand();
				return true;
			},
		});
	}

	/**
	 * Executes the batch move to correct location command logic
	 */
	private async executeBatchMoveToCorrectLocationCommand(): Promise<void> {
		new FolderSuggestModal(this.plugin, async (folder: TFolder) => {
			try {
				const allFiles = this.plugin.app.vault.getMarkdownFiles();
				let movedCount = 0;

				for (const file of allFiles) {
					// Check if file is within the selected folder
					if (!this.isFileInFolder(file, folder)) {
						continue;
					}

					// Skip ignored folders
					if (this.shouldIgnoreFile(file)) {
						continue;
					}

					const moved = await this.moveFileToCorrectLocation(file);
					if (moved) {
						movedCount++;
					}
				}

				const folderDisplay =
					folder.path === "/" ? "root" : folder.path;
				if (movedCount > 0) {
					new Notice(
						`Moved ${movedCount} file(s) from ${folderDisplay}.`,
					);
				} else {
					new Notice(
						`All files in ${folderDisplay} are already in correct locations.`,
					);
				}
			} catch (error) {
				new Notice(`Error moving files: ${error.message}`);
			}
		}).open();
	}

	/**
	 * Moves a file to its correct location based on note type
	 * Returns true if the file was moved, false if already correct
	 */
	private async moveFileToCorrectLocation(file: TFile): Promise<boolean> {
		const noteType = this.getNoteTypeFromFile(file);
		let targetFolder: TFolder;

		switch (noteType) {
			case "fleeting":
				targetFolder = this.getNoteTypeFolder(
					this.plugin.settings.fleetingNotesUseSeparateLocation,
					this.plugin.settings.fleetingNotesLocation,
				);
				break;
			case "moc":
				targetFolder = this.getNoteTypeFolder(
					this.plugin.settings.mocsUseSeparateLocation,
					this.plugin.settings.mocsLocation,
				);
				break;
			case "index":
				targetFolder = this.getNoteTypeFolder(
					this.plugin.settings.indexesUseSeparateLocation,
					this.plugin.settings.indexesLocation,
				);
				break;
			default: // zettel
				targetFolder = this.getNoteTypeFolder(
					this.plugin.settings.zettelsUseSeparateLocation,
					this.plugin.settings.zettelsLocation,
				);
		}

		// Check if file is already in the correct folder
		const currentFolder = file.parent;
		if (currentFolder && currentFolder.path === targetFolder.path) {
			return false;
		}

		// Move the file
		const newPath = `${targetFolder.path}/${file.name}`;

		// Check if target path already exists
		const existing = this.plugin.app.vault.getAbstractFileByPath(newPath);
		if (existing && existing !== file) {
			console.warn(
				`Cannot move ${file.basename}: ${file.name} already exists in target folder`,
			);
			return false;
		}

		await this.plugin.app.fileManager.renameFile(file, newPath);
		return true;
	}

	/**
	 * Registers the "Tag as Correct Type" command
	 * Adds the correct tag to the current file based on its note type
	 * Only active when at least one note type has separate location enabled
	 */
	private registerTagAsCorrectTypeCommand(): void {
		this.plugin.addCommand({
			id: "tag-as-correct-type",
			name: "Tag as Correct Type",
			icon: "tag",
			checkCallback: (checking: boolean) => {
				// Only show command if at least one note type has separate location enabled
				const hasSeparateLocations =
					this.plugin.settings.zettelsUseSeparateLocation ||
					this.plugin.settings.fleetingNotesUseSeparateLocation ||
					this.plugin.settings.mocsUseSeparateLocation ||
					this.plugin.settings.indexesUseSeparateLocation;

				if (!hasSeparateLocations) {
					return false;
				}

				if (checking) {
					return true;
				}

				this.executeTagAsCorrectTypeCommand();
				return true;
			},
		});
	}

	/**
	 * Executes the tag as correct type command logic
	 */
	private async executeTagAsCorrectTypeCommand(): Promise<void> {
		try {
			const activeFile = this.plugin.app.workspace.getActiveFile();
			if (!activeFile) {
				new Notice("No active file.");
				return;
			}

			const tagged = await this.tagFileAsCorrectType(activeFile);
			if (tagged) {
				new Notice("File tagged with correct type.");
			} else {
				new Notice("File already has the correct tag.");
			}
		} catch (error) {
			new Notice(`Error tagging file: ${error.message}`);
		}
	}

	/**
	 * Registers the "Batch Tag as Correct Type" command
	 * Adds correct tags to all files in a selected folder based on note type
	 * Only active when at least one note type has separate location enabled
	 */
	private registerBatchTagAsCorrectTypeCommand(): void {
		this.plugin.addCommand({
			id: "batch-tag-as-correct-type",
			name: "Batch Tag as Correct Type (Select Folder)",
			icon: "tags",
			checkCallback: (checking: boolean) => {
				// Only show command if at least one note type has separate location enabled
				const hasSeparateLocations =
					this.plugin.settings.zettelsUseSeparateLocation ||
					this.plugin.settings.fleetingNotesUseSeparateLocation ||
					this.plugin.settings.mocsUseSeparateLocation ||
					this.plugin.settings.indexesUseSeparateLocation;

				if (!hasSeparateLocations) {
					return false;
				}

				if (checking) {
					return true;
				}

				this.executeBatchTagAsCorrectTypeCommand();
				return true;
			},
		});
	}

	/**
	 * Executes the batch tag as correct type command logic
	 */
	private async executeBatchTagAsCorrectTypeCommand(): Promise<void> {
		new FolderSuggestModal(this.plugin, async (folder: TFolder) => {
			try {
				const allFiles = this.plugin.app.vault.getMarkdownFiles();
				let taggedCount = 0;

				for (const file of allFiles) {
					// Check if file is within the selected folder
					if (!this.isFileInFolder(file, folder)) {
						continue;
					}

					// Skip ignored folders
					if (this.shouldIgnoreFile(file)) {
						continue;
					}

					const tagged = await this.tagFileAsCorrectType(file);
					if (tagged) {
						taggedCount++;
					}
				}

				const folderDisplay =
					folder.path === "/" ? "root" : folder.path;
				if (taggedCount > 0) {
					new Notice(
						`Tagged ${taggedCount} file(s) in ${folderDisplay}.`,
					);
				} else {
					new Notice(
						`All files in ${folderDisplay} already have correct tags.`,
					);
				}
			} catch (error) {
				new Notice(`Error tagging files: ${error.message}`);
			}
		}).open();
	}

	/**
	 * Tags a file with the correct note type tag based on its current type
	 * Returns true if a tag was added, false if already correct
	 */
	private async tagFileAsCorrectType(file: TFile): Promise<boolean> {
		const noteType = this.getNoteTypeFromFile(file);
		let targetTag: string;

		switch (noteType) {
			case "fleeting":
				targetTag = this.plugin.settings.fleetingNotesTag;
				break;
			case "moc":
				targetTag = this.plugin.settings.mocsTag;
				break;
			case "index":
				targetTag = this.plugin.settings.indexesTag;
				break;
			default: // zettel
				targetTag = this.plugin.settings.zettelTag;
		}

		// Check if file already has the target tag
		const cache = this.plugin.app.metadataCache.getFileCache(file);
		const inlineTags =
			cache?.tags?.map((t) => t.tag.replace("#", "")) || [];
		const frontmatterTags = cache?.frontmatter?.tags || [];

		const allTags = [
			...inlineTags,
			...(Array.isArray(frontmatterTags)
				? frontmatterTags
				: [frontmatterTags].filter(Boolean)),
		].map((t) => String(t).replace("#", ""));

		if (allTags.includes(targetTag)) {
			return false;
		}

		// Add the tag to frontmatter
		await this.plugin.app.fileManager.processFrontMatter(
			file,
			(frontmatter) => {
				if (!frontmatter.tags) {
					frontmatter.tags = [];
				}
				if (typeof frontmatter.tags === "string") {
					frontmatter.tags = [frontmatter.tags];
				}
				if (!frontmatter.tags.includes(targetTag)) {
					frontmatter.tags.push(targetTag);
				}
			},
		);

		return true;
	}

	/**
	 * Extracts zettel ID from filename
	 * Looks for timestamp-based ID with optional hierarchy at the start of filename
	 * Supports separator format: "z20241118123456789⁝ Title" extracts "z20241118123456789"
	 */
	private extractZettelId(filename: string): string | null {
		// First, strip any separator and title portion
		const separator = this.plugin.settings.zettelIdSeparator;
		let idPortion = filename;

		// Check if filename contains the separator
		const separatorIndex = filename.indexOf(separator);
		if (separatorIndex !== -1) {
			idPortion = filename.substring(0, separatorIndex);
		}

		// Match optional prefix followed by timestamp pattern (13+ digits) with optional alternating letters/numbers
		// Examples: "20241118123456789", "Z20241118123456789a", "f20241118123456789a1"
		const match = idPortion.match(/^([A-Za-z]*)(\d{13,}(?:[a-z]+|\d+)*)/);
		if (match) {
			// Return prefix + timestamp + hierarchy
			return match[1] + match[2];
		}
		return null;
	}

	/**
	 * Generates a child zettel ID based on parent ID
	 * Alternates between letters and numbers: 123 -> 123a -> 123a1 -> 123a1a -> 123a1a1
	 * Letters expand: a-z, then aa-zz, then aaa-zzz, etc.
	 * Numbers continue incrementing: 1, 2, 3... 9, 10, 11, etc.
	 * If moving an existing file and there's a collision, uses file's creation date or generates new ID
	 */
	private async generateChildZettelId(
		parentId: string,
		folder: TFolder,
		movingFile?: TFile,
	): Promise<string> {
		const files = this.plugin.app.vault.getMarkdownFiles();

		// Determine if we should use letters or numbers based on parent ID
		const shouldUseLetter = this.shouldUseLetterForChild(parentId);

		if (shouldUseLetter) {
			// Find all children with letters (e.g., 123a, 123b, 123z, 123aa, 123ab, etc.)
			const childPattern = new RegExp(
				`^${this.escapeRegex(parentId)}([a-z]+)(?![a-z0-9])`,
			);
			let maxLetterSequence = "";

			for (const file of files) {
				const match = file.basename.match(childPattern);
				if (match) {
					const letterSeq = match[1];
					if (
						!maxLetterSequence ||
						this.compareLetterSequences(
							letterSeq,
							maxLetterSequence,
						) > 0
					) {
						maxLetterSequence = letterSeq;
					}
				}
			}

			// Return next available letter sequence
			const nextLetterSequence = maxLetterSequence
				? this.incrementLetterSequence(maxLetterSequence)
				: "a";
			return `${parentId}${nextLetterSequence}`;
		} else {
			// Find all children with numbers (e.g., 123a1, 123a2, 123a3)
			const childPattern = new RegExp(
				`^${this.escapeRegex(parentId)}(\d+)(?![a-z0-9])`,
			);
			let maxNum = 0;

			for (const file of files) {
				const match = file.basename.match(childPattern);
				if (match) {
					const num = parseInt(match[1]);
					if (num > maxNum) {
						maxNum = num;
					}
				}
			}

			// Return next available number
			return `${parentId}${maxNum + 1}`;
		}
	}

	/**
	 * Compares two letter sequences (e.g., "a" vs "z", "z" vs "aa", "az" vs "ba")
	 * Returns: negative if seq1 < seq2, 0 if equal, positive if seq1 > seq2
	 */
	private compareLetterSequences(seq1: string, seq2: string): number {
		// First compare by length - longer sequences come after shorter ones
		if (seq1.length !== seq2.length) {
			return seq1.length - seq2.length;
		}

		// Same length - compare alphabetically
		return seq1.localeCompare(seq2);
	}

	/**
	 * Increments a letter sequence: a->b, z->aa, az->ba, zz->aaa
	 */
	private incrementLetterSequence(seq: string): string {
		const chars = seq.split("");
		let carry = true;

		// Start from the rightmost character
		for (let i = chars.length - 1; i >= 0 && carry; i--) {
			if (chars[i] === "z") {
				chars[i] = "a";
				// carry remains true
			} else {
				chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1);
				carry = false;
			}
		}

		// If we still have a carry, we need to add a new 'a' at the beginning
		if (carry) {
			chars.unshift("a");
		}

		return chars.join("");
	}

	/**
	 * Converts a letter sequence to a number: a->1, b->2, z->26, aa->27, ab->28, etc.
	 * This is like base-26 but starting from 1 instead of 0
	 */
	private letterSequenceToNumber(seq: string): number {
		let result = 0;
		const base = 26;

		for (let i = 0; i < seq.length; i++) {
			const charValue = seq.charCodeAt(i) - 96; // a->1, b->2, ... z->26
			result = result * base + charValue;
		}

		return result;
	}

	/**
	 * Determines if the next child should use a letter or number
	 * Root children (first level) always use letters
	 * After that, alternates: letters -> numbers -> letters -> numbers
	 */
	private shouldUseLetterForChild(parentId: string): boolean {
		// Strip prefix to work with timestamp and hierarchy only
		const idWithoutPrefix = this.stripPrefix(parentId);

		// Remove the timestamp portion (first 13+ digits)
		const hierarchyPart = idWithoutPrefix.replace(/^\d{13,}/, "");

		if (!hierarchyPart) {
			// No hierarchy yet, first level (direct children of root) should use letters
			return true;
		}

		// Parse hierarchy into segments to count depth
		const segments = this.parseHierarchySegments(hierarchyPart);

		// After letters (level 1), alternate between numbers and letters
		// Odd depth (1, 3, 5...) = letters
		// Even depth (2, 4, 6...) = numbers
		return segments.length % 2 === 1;
	}

	/**
	 * Escapes special regex characters in a string
	 */
	private escapeRegex(str: string): string {
		return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	}

	/**
	 * Gets all descendants of a zettel (files whose IDs start with the given ID)
	 */
	private getAllDescendants(zettelId: string): TFile[] {
		const allFiles = this.plugin.app.vault.getMarkdownFiles();
		const descendants: TFile[] = [];

		for (const file of allFiles) {
			const fileId = this.extractZettelId(file.basename);
			if (!fileId) continue;

			// Check if this file's ID starts with the given zettel ID
			// and is not the exact same file
			if (fileId.startsWith(zettelId) && fileId !== zettelId) {
				descendants.push(file);
			}
		}

		// Sort by ID length (shortest first) to rename from closest descendants to furthest
		descendants.sort((a, b) => {
			const aId = this.extractZettelId(a.basename) || "";
			const bId = this.extractZettelId(b.basename) || "";
			return aId.length - bId.length;
		});

		return descendants;
	}

	/**
	 * Transforms a descendant ID when its ancestor is moved to a new parent
	 * Recalculates hierarchy to maintain alternating letter/number pattern
	 *
	 * Example:
	 *   20241118123456789 → 20241118999999999a
	 *   20241118123456789a → 20241118999999999a1
	 *   20241118123456789a1 → 20241118999999999a1a
	 */
	private transformDescendantId(
		descendantId: string,
		oldAncestorId: string,
		newAncestorId: string,
	): string {
		// Extract the timestamp part (first 13+ digits)
		const timestampMatch = descendantId.match(/^(\d{13,})/);
		if (!timestampMatch) return descendantId;

		const timestamp = timestampMatch[1];

		// Get the hierarchy parts
		const descendantHierarchy = descendantId.substring(timestamp.length);
		const oldAncestorHierarchy = oldAncestorId.substring(timestamp.length);
		const newAncestorHierarchy = newAncestorId.substring(timestamp.length);

		// The descendant's hierarchy should start with the old ancestor's hierarchy
		if (!descendantHierarchy.startsWith(oldAncestorHierarchy)) {
			return descendantId; // Something's wrong, return unchanged
		}

		// Get the relative hierarchy (what comes after the ancestor's hierarchy)
		const relativeHierarchy = descendantHierarchy.substring(
			oldAncestorHierarchy.length,
		);

		// Parse the relative hierarchy into segments (letters and numbers)
		const segments = this.parseHierarchySegments(relativeHierarchy);

		// Build new hierarchy by appending segments with correct alternation
		let newHierarchy = newAncestorHierarchy;

		for (const segment of segments) {
			// Determine if next segment should be letter or number based on current hierarchy
			const shouldUseLetter = this.shouldUseLetterForChild(
				timestamp + newHierarchy,
			);

			if (shouldUseLetter) {
				// Segment should be letter(s)
				if (/^[a-z]+$/.test(segment)) {
					newHierarchy += segment;
				} else {
					// Segment is a number but we need a letter - convert
					// For simplicity, map number to letter (1->a, 2->b, etc)
					const num = parseInt(segment);
					const letter = String.fromCharCode(96 + num); // 1->a, 2->b, etc
					newHierarchy += letter;
				}
			} else {
				// Segment should be a number
				if (/^\d+$/.test(segment)) {
					newHierarchy += segment;
				} else {
					// Segment is letter(s) but we need a number - convert
					// Convert multi-letter sequences: a->1, b->2, z->26, aa->27, ab->28, etc.
					const num = this.letterSequenceToNumber(segment);
					newHierarchy += num;
				}
			}
		}

		return timestamp + newHierarchy;
	}

	/**
	 * Parses hierarchy string into individual segments (letters and numbers)
	 * Example: "a1b2" -> ["a", "1", "b", "2"]
	 */
	/**
	 * Parses a hierarchy string into segments
	 * Example: "a1b2" -> ["a", "1", "b", "2"]
	 * Example: "aa1bb2" -> ["aa", "1", "bb", "2"]
	 */
	private parseHierarchySegments(hierarchy: string): string[] {
		const segments: string[] = [];
		let i = 0;

		while (i < hierarchy.length) {
			if (/[a-z]/.test(hierarchy[i])) {
				// Letter segment (can be multiple letters like "aa", "ab", etc.)
				let letters = "";
				while (i < hierarchy.length && /[a-z]/.test(hierarchy[i])) {
					letters += hierarchy[i];
					i++;
				}
				segments.push(letters);
			} else if (/\d/.test(hierarchy[i])) {
				// Number segment (can be multiple digits)
				let num = "";
				while (i < hierarchy.length && /\d/.test(hierarchy[i])) {
					num += hierarchy[i];
					i++;
				}
				segments.push(num);
			} else {
				i++; // Skip unknown characters
			}
		}

		return segments;
	}

	/**
	 * Resolves a timestamp collision by trying creation date or generating new timestamp
	 * Preserves year, month, and day from original timestamp when possible
	 */
	private async resolveTimestampCollision(
		originalId: string,
		hierarchySuffix: string,
		folder: TFolder,
		movingFile?: TFile,
	): Promise<string> {
		const files = this.plugin.app.vault.getMarkdownFiles();

		// Extract timestamp from original ID
		const timestampMatch = originalId.match(/^(\d{13,})/);
		if (!timestampMatch) {
			return originalId;
		}

		const originalTimestamp = timestampMatch[1];

		// Try using file's creation date if available
		if (movingFile) {
			const creationTime = movingFile.stat.ctime;
			const creationDate = new Date(creationTime);
			const creationTimestamp = this.formatTimestamp(creationDate);
			const creationId = creationTimestamp + hierarchySuffix;

			// Check if this ID is available
			const creationPath = `${folder.path}/${creationId}.md`;
			const creationExists = files.some(
				(f) => f.path === creationPath && f !== movingFile,
			);

			if (!creationExists) {
				return creationId;
			}
		}

		// Extract year, month, day from original timestamp
		// Format: YYYYMMDDHHMMSS... (13+ digits)
		const year = originalTimestamp.substring(0, 4);
		const month = originalTimestamp.substring(4, 6);
		const day = originalTimestamp.substring(6, 8);

		// Generate new timestamp preserving date but with current time
		const now = new Date();
		const hours = String(now.getHours()).padStart(2, "0");
		const minutes = String(now.getMinutes()).padStart(2, "0");
		const seconds = String(now.getSeconds()).padStart(2, "0");
		const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

		let newTimestamp = `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
		let newId = newTimestamp + hierarchySuffix;
		let newPath = `${folder.path}/${newId}.md`;

		// If still collision, increment milliseconds until we find available slot
		let attempts = 0;
		while (
			files.some((f) => f.path === newPath && f !== movingFile) &&
			attempts < 1000
		) {
			attempts++;
			const ms = (parseInt(milliseconds) + attempts) % 1000;
			newTimestamp = `${year}${month}${day}${hours}${minutes}${seconds}${String(ms).padStart(3, "0")}`;
			newId = newTimestamp + hierarchySuffix;
			newPath = `${folder.path}/${newId}.md`;
		}

		return newId;
	}

	/**
	 * Formats a date as a timestamp string (YYYYMMDDHHMMSSmmm)
	 */
	private formatTimestamp(date: Date): string {
		const year = String(date.getFullYear());
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const hours = String(date.getHours()).padStart(2, "0");
		const minutes = String(date.getMinutes()).padStart(2, "0");
		const seconds = String(date.getSeconds()).padStart(2, "0");
		const milliseconds = String(date.getMilliseconds()).padStart(3, "0");

		return `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
	}

	/**
	 * Indents a zettel by making it a child of its previous sibling
	 */
	private async indentZettel(file: TFile, currentId: string): Promise<void> {
		// Get parent ID and current suffix
		const parentId = this.getParentZettelId(currentId);
		if (!parentId) {
			new Notice("Cannot indent: zettel has no parent.");
			return;
		}

		// Find previous sibling
		const previousSibling = await this.findPreviousSibling(currentId);
		if (!previousSibling) {
			new Notice("Cannot indent: no previous sibling found.");
			return;
		}

		const previousSiblingId = this.extractZettelId(
			previousSibling.basename,
		);
		if (!previousSiblingId) {
			return;
		}

		// Get all descendants of the current file before renaming
		const descendants = this.getAllDescendants(currentId);

		// Generate new child ID under previous sibling
		const folder = file.parent || this.plugin.app.vault.getRoot();
		let newId = await this.generateChildZettelId(
			previousSiblingId,
			folder,
			file,
		);

		// Check for filename collision
		const proposedPath = `${folder.path}/${newId}.md`;
		const collision = this.plugin.app.vault
			.getMarkdownFiles()
			.some((f) => f.path === proposedPath && f !== file);

		if (collision) {
			// Extract hierarchy suffix from newId
			const hierarchySuffix = newId.replace(/^\d{13,}/, "");
			newId = await this.resolveTimestampCollision(
				currentId,
				hierarchySuffix,
				folder,
				file,
			);
		}

		// Rename file
		const newPath = `${folder.path}/${newId}.md`;
		await this.plugin.app.fileManager.renameFile(file, newPath);

		// Update parent link in frontmatter
		await this.plugin.app.fileManager.processFrontMatter(
			file,
			(frontmatter) => {
				frontmatter.up = `[[${previousSibling.basename}]]`;
			},
		);

		// Now rename all descendants to maintain the hierarchy
		for (const descendant of descendants) {
			const descendantId = this.extractZettelId(descendant.basename);
			if (!descendantId) continue;

			// Transform the descendant ID preserving alternating letter/number pattern
			const newDescendantId = this.transformDescendantId(
				descendantId,
				currentId,
				newId,
			);

			const descendantNewPath = `${folder.path}/${newDescendantId}.md`;
			await this.plugin.app.fileManager.renameFile(
				descendant,
				descendantNewPath,
			);
		}

		new Notice(`Indented ${descendants.length + 1} file(s) to ${newId}`);
	}

	/**
	 * Outdents a zettel by making it a sibling of its parent
	 */
	private async outdentZettel(file: TFile, currentId: string): Promise<void> {
		// Get parent ID
		const parentId = this.getParentZettelId(currentId);
		if (!parentId) {
			new Notice("Cannot outdent: zettel is already at root level.");
			return;
		}

		// Get grandparent ID
		const grandparentId = this.getParentZettelId(parentId);
		if (!grandparentId) {
			new Notice("Cannot outdent: parent is at root level.");
			return;
		}

		// Find the parent file to get grandparent link
		const parentFile = await this.findZettelById(parentId);

		// Get all descendants of the current file before renaming
		const descendants = this.getAllDescendants(currentId);

		// Generate new sibling ID at parent's level
		const folder = file.parent || this.plugin.app.vault.getRoot();
		let newId = await this.generateChildZettelId(
			grandparentId,
			folder,
			file,
		);

		// Check for filename collision
		const proposedPath = `${folder.path}/${newId}.md`;
		const collision = this.plugin.app.vault
			.getMarkdownFiles()
			.some((f) => f.path === proposedPath && f !== file);

		if (collision) {
			// Extract hierarchy suffix from newId
			const hierarchySuffix = newId.replace(/^\d{13,}/, "");
			newId = await this.resolveTimestampCollision(
				currentId,
				hierarchySuffix,
				folder,
				file,
			);
		}

		// Rename file
		const newPath = `${folder.path}/${newId}.md`;
		await this.plugin.app.fileManager.renameFile(file, newPath);

		// Update parent link in frontmatter
		if (parentFile) {
			await this.plugin.app.fileManager.processFrontMatter(
				file,
				(frontmatter) => {
					const parentCache =
						this.plugin.app.metadataCache.getFileCache(parentFile);
					const grandparentLink = parentCache?.frontmatter?.up;
					if (grandparentLink) {
						frontmatter.up = grandparentLink;
					}
				},
			);
		}

		// Now rename all descendants to maintain the hierarchy
		for (const descendant of descendants) {
			const descendantId = this.extractZettelId(descendant.basename);
			if (!descendantId) continue;

			// Transform the descendant ID preserving alternating letter/number pattern
			const newDescendantId = this.transformDescendantId(
				descendantId,
				currentId,
				newId,
			);

			const descendantNewPath = `${folder.path}/${newDescendantId}.md`;
			await this.plugin.app.fileManager.renameFile(
				descendant,
				descendantNewPath,
			);
		}

		new Notice(`Outdented ${descendants.length + 1} file(s) to ${newId}`);
	}

	/**
	 * Gets the parent zettel ID from a child ID
	 */
	private getParentZettelId(childId: string): string | null {
		// Extract and preserve the prefix
		const prefix = this.getPrefix(childId);
		const idWithoutPrefix = this.stripPrefix(childId);

		// Remove the timestamp portion to get hierarchy
		const hierarchyPart = idWithoutPrefix.replace(/^(\d{13,})/, "");

		if (!hierarchyPart) {
			// No hierarchy, this is a root zettel
			return null;
		}

		// Remove the last segment (letter or number)
		const parentHierarchy = hierarchyPart.replace(/[a-z]+$|[0-9]+$/, "");
		const timestamp = idWithoutPrefix.match(/^(\d{13,})/)?.[1];

		return timestamp ? prefix + timestamp + parentHierarchy : null;
	}

	/**
	 * Finds the previous sibling zettel
	 */
	private async findPreviousSibling(
		currentId: string,
	): Promise<TFile | null> {
		const parentId = this.getParentZettelId(currentId);
		if (!parentId) {
			return null;
		}

		const files = this.plugin.app.vault.getMarkdownFiles();
		const siblings: Array<{ file: TFile; id: string; suffix: string }> = [];

		// Get the suffix type (letter or number) and value
		const currentSuffix = currentId.replace(parentId, "");
		const isLetter = /^[a-z]+$/.test(currentSuffix);

		for (const file of files) {
			const fileId = this.extractZettelId(file.basename);
			if (!fileId || fileId === currentId) continue;

			const fileParentId = this.getParentZettelId(fileId);
			if (fileParentId === parentId) {
				const suffix = fileId.replace(parentId, "");
				const suffixIsLetter = /^[a-z]+$/.test(suffix);

				// Only consider siblings of same type (letter or number)
				if (suffixIsLetter === isLetter) {
					siblings.push({ file, id: fileId, suffix });
				}
			}
		}

		// Sort siblings and find previous
		siblings.sort((a, b) => a.suffix.localeCompare(b.suffix));

		const currentIndex = siblings.findIndex((s) => s.id === currentId);
		if (currentIndex > 0) {
			return siblings[currentIndex - 1].file;
		}

		return null;
	}

	/**
	 * Finds a zettel file by its ID
	 */
	private async findZettelById(zettelId: string): Promise<TFile | null> {
		const files = this.plugin.app.vault.getMarkdownFiles();

		for (const file of files) {
			const fileId = this.extractZettelId(file.basename);
			if (fileId === zettelId) {
				return file;
			}
		}

		return null;
	}

	/**
	 * Finds all child zettels of a given parent ID
	 */
	private async findChildZettels(parentId: string): Promise<TFile[]> {
		const files = this.plugin.app.vault.getMarkdownFiles();
		const children: TFile[] = [];

		// Create regex pattern to match direct children
		// For parent "123", match "123a", "123b", etc. (letter)
		// For parent "123a", match "123a1", "123a2", etc. (number)
		const shouldUseLetter = this.shouldUseLetterForChild(parentId);

		for (const file of files) {
			// Skip ignored files
			if (this.shouldIgnoreFile(file)) {
				continue;
			}

			const fileId = this.extractZettelId(file.basename);
			if (!fileId || !fileId.startsWith(parentId)) {
				continue;
			}

			// Extract the part after the parent ID
			const suffix = fileId.substring(parentId.length);

			if (!suffix) {
				// This is the parent itself, not a child
				continue;
			}

			// Check if this is a direct child (not a grandchild or deeper)
			if (shouldUseLetter) {
				// Direct child should be letters only (one or more)
				// Examples: "a", "b", "z", "aa", "ab", "zz" but not "a1", "aa1", "a1a"
				if (/^[a-z]+$/.test(suffix)) {
					children.push(file);
				}
			} else {
				// Direct child should be one or more digits only
				// Examples: "1", "2", "10" but not "1a", "12a", "1a1"
				if (/^\d+$/.test(suffix)) {
					children.push(file);
				}
			}
		}

		// Sort children by ID
		children.sort((a, b) => {
			const idA = this.extractZettelId(a.basename) || "";
			const idB = this.extractZettelId(b.basename) || "";
			return idA.localeCompare(idB);
		});

		return children;
	}

	/**
	 * Finds all sibling zettels (same hierarchy level) of a given zettel ID
	 */
	private async findSiblingZettels(zettelId: string): Promise<TFile[]> {
		const files = this.plugin.app.vault.getMarkdownFiles();
		const siblings: TFile[] = [];

		// Extract the hierarchy pattern from the current ID
		// For "123a", siblings are "123b", "123c", etc.
		// For "123a1", siblings are "123a2", "123a3", etc.

		// Get the base (timestamp + hierarchy up to parent level)
		const timestampMatch = zettelId.match(/^(\d{13,})/);
		if (!timestampMatch) {
			return siblings; // Not a valid zettel ID
		}

		const timestamp = timestampMatch[1];
		const hierarchyPart = zettelId.substring(timestamp.length);

		if (!hierarchyPart) {
			// Root level zettel - no siblings (each root has unique timestamp)
			return siblings;
		}

		// Determine the parent ID and what type of suffix siblings should have
		let parentId: string;
		let siblingPattern: RegExp;

		// Check if the last portion is letters or numbers
		const lastChar = hierarchyPart.charAt(hierarchyPart.length - 1);

		if (/[a-z]/.test(lastChar)) {
			// Last portion is letters - find where the letter sequence starts
			const letterMatch = hierarchyPart.match(/([a-z]+)$/);
			if (letterMatch) {
				parentId =
					timestamp + hierarchyPart.slice(0, -letterMatch[1].length);
				siblingPattern = new RegExp(
					`^${this.escapeRegex(parentId)}[a-z]+(?![a-z0-9])`,
				);
			} else {
				return siblings; // Invalid format
			}
		} else {
			// Last part is a number sequence
			const numberMatch = hierarchyPart.match(/(\d+)$/);
			if (numberMatch) {
				parentId =
					timestamp + hierarchyPart.slice(0, -numberMatch[1].length);
				siblingPattern = new RegExp(
					`^${this.escapeRegex(parentId)}\\d+(?![a-z0-9])`,
				);
			} else {
				return siblings; // Invalid format
			}
		}

		// Find all files matching the sibling pattern
		for (const file of files) {
			const fileId = this.extractZettelId(file.basename);
			if (fileId && siblingPattern.test(fileId)) {
				siblings.push(file);
			}
		}

		// Sort siblings by ID
		siblings.sort((a, b) => {
			const idA = this.extractZettelId(a.basename) || "";
			const idB = this.extractZettelId(b.basename) || "";
			return idA.localeCompare(idB);
		});

		return siblings;
	}

	/**
	 * Builds navigation options for the navigator modal
	 * Returns up (parent), down (child), left (prev sibling), right (next sibling)
	 */
	private async buildNavigationOptions(
		activeFile: TFile,
		currentId: string,
	): Promise<NavigationOption[]> {
		const options: NavigationOption[] = [];

		// UP: Parent (from frontmatter 'up' property)
		let parentFile: TFile | null = null;
		let parentLabel = "No parent";
		const cache = this.plugin.app.metadataCache.getFileCache(activeFile);
		const upLink = cache?.frontmatter?.up;

		if (upLink) {
			// Extract the link from [[link]] format
			const linkMatch = upLink.match(/\[\[([^\]]+)\]\]/);
			if (linkMatch) {
				const linkPath = linkMatch[1];
				parentFile = this.plugin.app.metadataCache.getFirstLinkpathDest(
					linkPath,
					activeFile.path,
				);
				if (parentFile) {
					const parentCache =
						this.plugin.app.metadataCache.getFileCache(parentFile);
					parentLabel =
						parentCache?.frontmatter?.title || parentFile.basename;
				}
			}
		}

		options.push({
			direction: "up",
			label: parentLabel,
			file: parentFile,
			disabled: !parentFile,
		});

		// DOWN: First child
		const children = await this.findChildZettels(currentId);
		const firstChild = children.length > 0 ? children[0] : null;
		let childLabel = "No children";
		if (firstChild) {
			const childCache =
				this.plugin.app.metadataCache.getFileCache(firstChild);
			childLabel = childCache?.frontmatter?.title || firstChild.basename;
		}

		options.push({
			direction: "down",
			label: childLabel,
			file: firstChild,
			disabled: !firstChild,
		});

		// LEFT & RIGHT: Previous and Next siblings
		const siblings = await this.findSiblingZettels(currentId);
		const currentIndex = siblings.findIndex(
			(file) => file.path === activeFile.path,
		);

		let prevSibling: TFile | null = null;
		let prevLabel = "No previous sibling";
		if (currentIndex > 0) {
			prevSibling = siblings[currentIndex - 1];
			const prevCache =
				this.plugin.app.metadataCache.getFileCache(prevSibling);
			prevLabel = prevCache?.frontmatter?.title || prevSibling.basename;
		}

		options.push({
			direction: "left",
			label: prevLabel,
			file: prevSibling,
			disabled: !prevSibling,
		});

		let nextSibling: TFile | null = null;
		let nextLabel = "No next sibling";
		if (currentIndex >= 0 && currentIndex < siblings.length - 1) {
			nextSibling = siblings[currentIndex + 1];
			const nextCache =
				this.plugin.app.metadataCache.getFileCache(nextSibling);
			nextLabel = nextCache?.frontmatter?.title || nextSibling.basename;
		}

		options.push({
			direction: "right",
			label: nextLabel,
			file: nextSibling,
			disabled: !nextSibling,
		});

		// PREV/NEXT SEQUENCE: Previous and Next parent-level zettels
		const currentRootId = this.getRootZettelId(currentId);
		const parentZettels = this.getParentLevelZettelsInFolder(
			activeFile.parent,
		);

		let prevSequence: TFile | null = null;
		let prevSequenceLabel = "No previous sequence";
		let nextSequence: TFile | null = null;
		let nextSequenceLabel = "No next sequence";

		if (parentZettels.length > 0) {
			const currentSeqIndex = parentZettels.findIndex(
				(file) => this.extractZettelId(file.basename) === currentRootId,
			);

			if (currentSeqIndex !== -1) {
				// Previous sequence (wrap around)
				const prevIndex =
					(currentSeqIndex - 1 + parentZettels.length) %
					parentZettels.length;
				prevSequence = parentZettels[prevIndex];
				if (prevSequence) {
					const prevSeqCache =
						this.plugin.app.metadataCache.getFileCache(
							prevSequence,
						);
					prevSequenceLabel =
						prevSeqCache?.frontmatter?.title ||
						prevSequence.basename;
				}

				// Next sequence (wrap around)
				const nextIndex = (currentSeqIndex + 1) % parentZettels.length;
				nextSequence = parentZettels[nextIndex];
				if (nextSequence) {
					const nextSeqCache =
						this.plugin.app.metadataCache.getFileCache(
							nextSequence,
						);
					nextSequenceLabel =
						nextSeqCache?.frontmatter?.title ||
						nextSequence.basename;
				}
			}
		}

		options.push({
			direction: "prev-sequence",
			label: prevSequenceLabel,
			file: prevSequence,
			disabled: !prevSequence || prevSequence.path === activeFile.path,
		});

		options.push({
			direction: "next-sequence",
			label: nextSequenceLabel,
			file: nextSequence,
			disabled: !nextSequence || nextSequence.path === activeFile.path,
		});

		return options;
	}

	/**
	 * Adds a link to the parent zettel in the frontmatter of the child file
	 */
	private async addParentLinkToFile(
		childFile: TFile,
		parentFile: TFile,
	): Promise<void> {
		try {
			await this.plugin.app.fileManager.processFrontMatter(
				childFile,
				(frontmatter) => {
					frontmatter.up = `[[${parentFile.basename}]]`;
				},
			);
		} catch (error) {
			console.error("Error adding parent link:", error);
		}
	}

	/**
	 * Removes the parent link from a file's frontmatter
	 */
	private async removeParentLinkFromFile(file: TFile): Promise<void> {
		try {
			await this.plugin.app.fileManager.processFrontMatter(
				file,
				(frontmatter) => {
					delete frontmatter.up;
				},
			);
		} catch (error) {
			console.error("Error removing parent link:", error);
		}
	}

	/**
	 * Gets the target folder for new notes based on settings
	 */
	private getTargetFolder(location: string): TFolder {
		if (location && location.trim() !== "") {
			const folder =
				this.plugin.app.vault.getAbstractFileByPath(location);
			if (folder instanceof TFolder) {
				return folder;
			}
		}

		return this.plugin.app.vault.getRoot();
	}

	/**
	 * Gets the target folder for a specific note type, respecting separate location settings
	 */
	private getNoteTypeFolder(
		useSeparateLocation: boolean,
		separateLocation: string,
	): TFolder {
		// When separate location is enabled, use that location (even if empty = vault root)
		// When disabled, use the default newNoteLocation
		const targetLocation = useSeparateLocation
			? separateLocation
			: this.plugin.settings.newNoteLocation;
		return this.getTargetFolder(targetLocation);
	}

	/**
	 * Generates a zettel ID based on the format in settings
	 */
	private generateZettelId(
		noteType: "zettel" | "fleeting" | "moc" | "index" = "zettel",
		customFormat?: string,
		box?: Box,
	): string {
		const format =
			customFormat || this.plugin.settings.zettelIdFormat || "YYYYMMDDHHmmss";
		const now = new Date();

		// Simple date format replacement (supports common patterns)
		let id = format;
		const year = now.getFullYear().toString();
		const month = (now.getMonth() + 1).toString().padStart(2, "0");
		const day = now.getDate().toString().padStart(2, "0");
		const hours = now.getHours().toString().padStart(2, "0");
		const minutes = now.getMinutes().toString().padStart(2, "0");
		const seconds = now.getSeconds().toString().padStart(2, "0");
		const milliseconds = now.getMilliseconds().toString().padStart(3, "0");

		// Replace date/time tokens
		id = id.replace(/YYYY/g, year);
		id = id.replace(/YY/g, year.slice(-2));
		id = id.replace(/MM/g, month);
		id = id.replace(/DD/g, day);
		id = id.replace(/HH/g, hours);
		id = id.replace(/mm/g, minutes);
		id = id.replace(/ss/g, seconds);
		id = id.replace(/SSS/g, milliseconds);

		// Add prefix if enabled for this note type
		const shouldUsePrefix = this.shouldUsePrefixForNoteType(noteType, box);
		if (shouldUsePrefix) {
			const prefix = this.getPrefixForNoteType(noteType, box);
			id = prefix + id;
		}

		return id;
	}

	/**
	 * Gets the prefix for a given note type (includes box prefix if applicable)
	 * Format: boxPrefix + noteTypePrefix
	 */
	private getPrefixForNoteType(
		noteType: "zettel" | "fleeting" | "moc" | "index",
		box?: Box,
	): string {
		let prefix = "";

		// Add box prefix first (if enabled)
		if (box && box.useBoxPrefix) {
			prefix += box.boxPrefix || "";
		}

		// Add note type prefix
		if (box) {
			switch (noteType) {
				case "zettel":
					prefix += box.zettelPrefix || "";
					break;
				case "fleeting":
					prefix += box.fleetingNotesPrefix || "";
					break;
				case "moc":
					prefix += box.mocsPrefix || "";
					break;
				case "index":
					prefix += box.indexesPrefix || "";
					break;
			}
		} else {
			switch (noteType) {
				case "zettel":
					prefix += this.plugin.settings.zettelPrefix || "";
					break;
				case "fleeting":
					prefix += this.plugin.settings.fleetingNotesPrefix || "";
					break;
				case "moc":
					prefix += this.plugin.settings.mocsPrefix || "";
					break;
				case "index":
					prefix += this.plugin.settings.indexesPrefix || "";
					break;
			}
		}

		return prefix;
	}

	/**
	 * Checks if prefix should be used for a given note type
	 * Returns true if either box prefix OR note type prefix is enabled
	 */
	private shouldUsePrefixForNoteType(
		noteType: "zettel" | "fleeting" | "moc" | "index",
		box?: Box,
	): boolean {
		// Check if box prefix is enabled
		const hasBoxPrefix = box && box.useBoxPrefix;

		// Check if note type prefix is enabled
		let hasNoteTypePrefix = false;
		if (box) {
			switch (noteType) {
				case "zettel":
					hasNoteTypePrefix = box.useZettelPrefix;
					break;
				case "fleeting":
					hasNoteTypePrefix = box.useFleetingNotesPrefix;
					break;
				case "moc":
					hasNoteTypePrefix = box.useMocsPrefix;
					break;
				case "index":
					hasNoteTypePrefix = box.useIndexesPrefix;
					break;
			}
		} else {
			switch (noteType) {
				case "zettel":
					hasNoteTypePrefix = this.plugin.settings.useZettelPrefix;
					break;
				case "fleeting":
					hasNoteTypePrefix = this.plugin.settings.useFleetingNotesPrefix;
					break;
				case "moc":
					hasNoteTypePrefix = this.plugin.settings.useMocsPrefix;
					break;
				case "index":
					hasNoteTypePrefix = this.plugin.settings.useIndexesPrefix;
					break;
			}
		}

		return hasBoxPrefix || hasNoteTypePrefix;
	}

	/**
	 * Determines note type from file tags
	 */
	private getNoteTypeFromFile(
		file: TFile,
	): "zettel" | "fleeting" | "moc" | "index" {
		const cache = this.plugin.app.metadataCache.getFileCache(file);
		const tags = cache?.tags?.map((t) => t.tag.replace("#", "")) || [];
		const frontmatterTags = cache?.frontmatter?.tags || [];

		// Combine both tag sources
		const allTags = [
			...tags,
			...(Array.isArray(frontmatterTags)
				? frontmatterTags
				: [frontmatterTags].filter(Boolean)),
		].map((t) => String(t).replace("#", ""));

		// Check for note type tags
		if (allTags.includes(this.plugin.settings.fleetingNotesTag)) {
			return "fleeting";
		}
		if (allTags.includes(this.plugin.settings.mocsTag)) {
			return "moc";
		}
		if (allTags.includes(this.plugin.settings.indexesTag)) {
			return "index";
		}
		// Default to zettel
		return "zettel";
	}

	/**
	 * Strips prefix from a zettel ID to get the timestamp and hierarchy only
	 * Example: "Z20241118123456789a" -> "20241118123456789a"
	 */
	private stripPrefix(zettelId: string): string {
		// Remove any leading letters (prefix)
		return zettelId.replace(/^[A-Za-z]+/, "");
	}

	/**
	 * Gets the prefix from a zettel ID
	 * Example: "Z20241118123456789a" -> "Z"
	 */
	private getPrefix(zettelId: string): string {
		const match = zettelId.match(/^([A-Za-z]+)/);
		return match ? match[1] : "";
	}

	/**
	 * Gets the title from file metadata (frontmatter title or first alias)
	 * Returns empty string if no title or aliases found
	 */
	private getTitleFromFile(file: TFile): string {
		const cache = this.plugin.app.metadataCache.getFileCache(file);

		// Check frontmatter title first
		if (cache?.frontmatter?.title) {
			return cache.frontmatter.title;
		}

		// Check aliases (use first alias if available)
		const aliases = cache?.frontmatter?.aliases;
		if (aliases) {
			if (Array.isArray(aliases) && aliases.length > 0) {
				return String(aliases[0]);
			} else if (typeof aliases === "string" && aliases.trim()) {
				return aliases;
			}
		}

		return "";
	}

	/**
	 * Builds the full zettel filename with separator and title
	 * Format: "prefix + timestamp + hierarchy + separator + title"
	 * Example: "z20241118123456789⁝ My Note Title"
	 * Only applies separator format if useSeparatorFormat is enabled
	 */
	private buildZettelFilename(zettelId: string, title: string, box?: Box): string {
		const useSeparatorFormat = box?.useSeparatorFormat ?? this.plugin.settings.useSeparatorFormat;
		const zettelIdSeparator = box?.zettelIdSeparator ?? this.plugin.settings.zettelIdSeparator;

		if (useSeparatorFormat && title) {
			return `${zettelId}${zettelIdSeparator}${title}`;
		}

		return zettelId;
	}


	/**
	 * Builds fleeting note filename based on settings
	 */
	private buildFleetingFilename(title: string, box?: Box): string {
		const fleetingNotesUseZettelId = box?.fleetingNotesUseZettelId ?? this.plugin.settings.fleetingNotesUseZettelId;
		const fleetingNotesFilenameFormat = box?.fleetingNotesFilenameFormat ?? this.plugin.settings.fleetingNotesFilenameFormat;

		if (fleetingNotesUseZettelId) {
			// Use zettel ID format with prefix
			const zettelId = this.generateZettelId("fleeting", box?.zettelIdFormat, box);
			return this.buildZettelFilename(zettelId, title, box);
		}

		// Use custom format if specified
		if (fleetingNotesFilenameFormat && fleetingNotesFilenameFormat.trim()) {
			return fleetingNotesFilenameFormat.replace("{{title}}", title);
		}

		// Default to just title
		return title;
	}

	/**
	 * Builds MOC filename based on settings
	 */
	private buildMocFilename(title: string, box?: Box): string {
		const mocsUseZettelId = box?.mocsUseZettelId ?? this.plugin.settings.mocsUseZettelId;
		const mocsFilenameFormat = box?.mocsFilenameFormat ?? this.plugin.settings.mocsFilenameFormat;

		if (mocsUseZettelId) {
			// Use zettel ID format with prefix
			const zettelId = this.generateZettelId("moc", box?.zettelIdFormat, box);
			return this.buildZettelFilename(zettelId, title, box);
		}

		// Use custom format if specified
		if (mocsFilenameFormat && mocsFilenameFormat.trim()) {
			return mocsFilenameFormat.replace("{{title}}", title);
		}

		// Default to just title
		return title;
	}

	/**
	 * Builds index filename based on settings
	 */
	private buildIndexFilename(title: string, box?: Box): string {
		const indexesUseZettelId = box?.indexesUseZettelId ?? this.plugin.settings.indexesUseZettelId;
		const indexesFilenameFormat = box?.indexesFilenameFormat ?? this.plugin.settings.indexesFilenameFormat;

		if (indexesUseZettelId) {
			// Use zettel ID format with prefix
			const zettelId = this.generateZettelId("index", box?.zettelIdFormat, box);
			return this.buildZettelFilename(zettelId, title, box);
		}

		// Use custom format if specified
		if (indexesFilenameFormat && indexesFilenameFormat.trim()) {
			return indexesFilenameFormat.replace("{{title}}", title);
		}

		// Default to just title
		return title;
	}

	/**
	 * Gets all note titles filtered by tag
	 */
	private async getNoteTitlesByTag(tag: string): Promise<Map<string, TFile>> {
		const files = this.plugin.app.vault.getMarkdownFiles();
		const titles = new Map<string, TFile>();

		for (const file of files) {
			// Skip ignored folders
			if (this.shouldIgnoreFile(file)) {
				continue;
			}

			const cache = this.plugin.app.metadataCache.getFileCache(file);

			// Check if file has the specified tag
			const tags = cache?.tags?.map((t) => t.tag.replace("#", "")) || [];
			const frontmatterTags = cache?.frontmatter?.tags || [];

			// Combine both tag sources
			const allTags = [
				...tags,
				...(Array.isArray(frontmatterTags)
					? frontmatterTags
					: [frontmatterTags].filter(Boolean)),
			].map((t) => String(t).replace("#", ""));

			if (!allTags.includes(tag)) {
				continue;
			}

			// Get title from frontmatter or filename
			const frontmatterTitle = cache?.frontmatter?.title;

			if (frontmatterTitle) {
				titles.set(frontmatterTitle, file);
			} else {
				titles.set(file.basename, file);
			}
		}

		return titles;
	}

	/**
	 * Gets all note titles filtered by tag AND having valid zettel IDs
	 */
	private async getValidZettels(tag: string): Promise<Map<string, TFile>> {
		const files = this.plugin.app.vault.getMarkdownFiles();
		const titles = new Map<string, TFile>();

		for (const file of files) {
			// Skip ignored folders
			if (this.shouldIgnoreFile(file)) {
				continue;
			}

			// Check if file has a valid zettel ID in filename
			const zettelId = this.extractZettelId(file.basename);
			if (!zettelId) {
				continue;
			}

			const cache = this.plugin.app.metadataCache.getFileCache(file);

			// Check if file has the specified tag
			const tags = cache?.tags?.map((t) => t.tag.replace("#", "")) || [];
			const frontmatterTags = cache?.frontmatter?.tags || [];

			// Combine both tag sources
			const allTags = [
				...tags,
				...(Array.isArray(frontmatterTags)
					? frontmatterTags
					: [frontmatterTags].filter(Boolean)),
			].map((t) => String(t).replace("#", ""));

			if (!allTags.includes(tag)) {
				continue;
			}

			// Get title from frontmatter or filename
			const frontmatterTitle = cache?.frontmatter?.title;

			if (frontmatterTitle) {
				titles.set(frontmatterTitle, file);
			} else {
				titles.set(file.basename, file);
			}
		}

		return titles;
	}

	/**
	 * Gets all note titles from vault, optionally filtered by folder
	 */
	private async getNoteTitlesFromFolder(
		folderPath?: string,
	): Promise<Map<string, TFile>> {
		const files = this.plugin.app.vault.getMarkdownFiles();
		const titles = new Map<string, TFile>();

		for (const file of files) {
			// Skip ignored folders
			if (this.shouldIgnoreFile(file)) {
				continue;
			}

			// Filter by folder if specified
			if (folderPath && folderPath.trim() !== "") {
				const normalizedFolderPath = folderPath.endsWith("/")
					? folderPath.slice(0, -1)
					: folderPath;
				const fileFolder = file.parent?.path || "";

				if (!fileFolder.startsWith(normalizedFolderPath)) {
					continue;
				}
			}

			const cache = this.plugin.app.metadataCache.getFileCache(file);
			const frontmatterTitle = cache?.frontmatter?.title;

			if (frontmatterTitle) {
				titles.set(frontmatterTitle, file);
			} else {
				titles.set(file.basename, file);
			}
		}

		return titles;
	}

	/**
	 * Gets all note titles from vault
	 */
	private async getAllNoteTitles(): Promise<Map<string, TFile>> {
		return this.getNoteTitlesFromFolder();
	}

	/**
	 * Gets currently selected text in active editor
	 */
	private currentlySelectedText(): string | undefined {
		const view =
			this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			return undefined;
		}
		return view.editor.getSelection();
	}

	/**
	 * Checks if a file should be ignored based on ignored folders setting
	 */
	private shouldIgnoreFile(file: TFile): boolean {
		const ignoredFolders = this.plugin.settings.ignoredFolders;

		if (!ignoredFolders || ignoredFolders.length === 0) {
			return false;
		}

		const filePath = file.path.toLowerCase();

		return ignoredFolders.some((folder) => {
			const normalizedFolder = folder.toLowerCase().trim();
			if (!normalizedFolder) return false;

			// Check if file path starts with ignored folder path
			return (
				filePath.startsWith(normalizedFolder + "/") ||
				filePath.startsWith("/" + normalizedFolder + "/") ||
				filePath === normalizedFolder
			);
		});
	}

	/**
	 * Registers the "Reorder Sequence" command
	 * Opens a modal to reorder child zettels of the current zettel
	 * If current zettel is a child, shows the parent's full sequence
	 */
	private registerReorderSequenceCommand(): void {
		this.plugin.addCommand({
			id: "reorder-sequence",
			name: "Reorder Sequence (Alpha)",
			icon: "list-ordered",
			checkCallback: (checking: boolean) => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					return false;
				}

				const currentId = this.extractZettelId(activeFile.basename);
				if (!currentId) {
					return false;
				}

				if (checking) {
					return true;
				}

				// Determine which parent to use for the sequence
				let parentId = currentId;
				let parentFile = activeFile;

				// Check if current note is a child (has a parent)
				const parentIdCandidate = this.getParentZettelId(currentId);
				if (parentIdCandidate) {
					// This is a child note - find the parent file
					const files = this.plugin.app.vault.getMarkdownFiles();
					for (const file of files) {
						const fileId = this.extractZettelId(file.basename);
						if (fileId === parentIdCandidate) {
							parentId = parentIdCandidate;
							parentFile = file;
							break;
						}
					}
				}

				// Get all child zettels of the parent
				const childNotes = this.getChildZettels(parentId);

				if (childNotes.length === 0) {
					new Notice("No child notes to reorder");
					return true;
				}

				// Open reorder modal
				new SequenceReorderModal(
					this.plugin.app,
					parentFile,
					childNotes,
					async (
						reorderedNotes: TFile[],
						promoted: TFile[],
						indentLevels: Map<TFile, number>,
					) => {
						try {
							await this.handleSequenceReorder(
								parentFile,
								parentId,
								reorderedNotes,
								promoted,
								indentLevels,
							);
						} catch (error) {
							new Notice(
								`Error reordering sequence: ${error.message}`,
							);
						}
					},
				).open();

				return true;
			},
		});
	}

	/**
	 * Gets the root zettel ID (without any suffix)
	 * Example: "20251114154532123a1" → "20251114154532123"
	 */
	private getRootZettelId(zettelId: string): string {
		// Extract just the numeric timestamp (13+ digits)
		const match = zettelId.match(/^(\d{13,})/);
		return match ? match[1] : zettelId;
	}

	/**
	 * Gets all child zettels of a given parent ID (synchronous version)
	 */
	private getChildZettels(parentId: string): TFile[] {
		const files = this.plugin.app.vault.getMarkdownFiles();
		const children: TFile[] = [];

		// Create regex pattern to match direct children
		const shouldUseLetter = this.shouldUseLetterForChild(parentId);

		let childPattern: RegExp;
		if (shouldUseLetter) {
			childPattern = new RegExp(
				`^${this.escapeRegex(parentId)}[a-z]+(?![a-z0-9])`,
			);
		} else {
			childPattern = new RegExp(
				`^${this.escapeRegex(parentId)}\\d+(?![a-z0-9])`,
			);
		}

		for (const file of files) {
			if (this.shouldIgnoreFile(file)) {
				continue;
			}
			const fileId = this.extractZettelId(file.basename);
			if (fileId && childPattern.test(fileId)) {
				children.push(file);
			}
		}

		// Sort children by ID
		children.sort((a, b) => {
			const idA = this.extractZettelId(a.basename) || "";
			const idB = this.extractZettelId(b.basename) || "";
			return idA.localeCompare(idB);
		});

		return children;
	}

	/**
	 * Handles the reordering of a sequence based on modal results
	 */
	private async handleSequenceReorder(
		parentFile: TFile,
		parentId: string,
		reorderedNotes: TFile[],
		promoted: TFile[],
		indentLevels: Map<TFile, number>,
	): Promise<void> {
		const folder = parentFile.parent || this.plugin.app.vault.getRoot();

		// Handle promoted notes first (notes that became siblings of parent)
		const tempPromotedPrefix = `_temp_promoted_${Date.now()}_`;
		const promotedTempNames = new Map<TFile, string>();

		// First, move promoted notes to temp names to avoid collisions
		for (let i = 0; i < promoted.length; i++) {
			const promotedFile = promoted[i];
			const tempPath = `${folder.path}/${tempPromotedPrefix}${i}.md`;
			await this.plugin.app.fileManager.renameFile(
				promotedFile,
				tempPath,
			);
			promotedTempNames.set(promotedFile, `${tempPromotedPrefix}${i}`);
		}

		// Then rename to final promoted names
		for (const promotedFile of promoted) {
			const grandparentId = this.getParentZettelId(parentId);
			if (grandparentId) {
				const newId = await this.generateChildZettelId(
					grandparentId,
					folder,
					promotedFile,
				);
				const newPath = `${folder.path}/${newId}.md`;
				await this.plugin.app.fileManager.renameFile(
					promotedFile,
					newPath,
				);
			} else {
				// No grandparent - promote to root level (new sequence)
				const newId = this.generateZettelId();
				const newPath = `${folder.path}/${newId}.md`;
				await this.plugin.app.fileManager.renameFile(
					promotedFile,
					newPath,
				);
			}
		}

		// Three-pass rename to avoid collisions
		// Pass 1: Calculate all new IDs first
		const newIds = new Map<TFile, string>();
		const letterMap = new Map<string, string>(); // Track letter assignments per parent
		const numberMap = new Map<string, number>(); // Track number assignments per parent

		for (let i = 0; i < reorderedNotes.length; i++) {
			const file = reorderedNotes[i];
			const level = indentLevels.get(file) || 1;

			// Determine the actual parent for this note based on indent level
			let actualParentId = parentId;

			if (level > 1) {
				// Find the previous note with level = current level - 1
				for (let j = i - 1; j >= 0; j--) {
					const prevFile = reorderedNotes[j];
					const prevLevel = indentLevels.get(prevFile) || 1;

					if (prevLevel === level - 1) {
						// Use the new ID that we already calculated for the previous file
						actualParentId = newIds.get(prevFile) || parentId;
						break;
					}
				}
			}

			// Generate new ID based on actual parent
			const shouldUseLetter =
				this.shouldUseLetterForChild(actualParentId);
			let newId: string;

			if (shouldUseLetter) {
				// Get next available letter for this parent
				const currentLetter = letterMap.get(actualParentId) || "a";
				newId = actualParentId + currentLetter;
				letterMap.set(
					actualParentId,
					String.fromCharCode(currentLetter.charCodeAt(0) + 1),
				);
			} else {
				// Get next available number for this parent
				const currentNum = numberMap.get(actualParentId) || 1;
				newId = actualParentId + currentNum;
				numberMap.set(actualParentId, currentNum + 1);
			}

			newIds.set(file, newId);
		}

		// Pass 2: Rename all files to temporary names (including parent if it's being renamed)
		const tempPrefix = `_temp_reorder_${Date.now()}_`;
		const allFilesToRename = [...reorderedNotes];

		// Check if we need to rename the parent too
		const parentCurrentId = this.extractZettelId(parentFile.basename);
		if (parentCurrentId && parentCurrentId !== parentId) {
			// Parent has been renamed (it was in the child list and got a new ID)
			allFilesToRename.push(parentFile);
		}

		for (let i = 0; i < allFilesToRename.length; i++) {
			const file = allFilesToRename[i];
			const tempPath = `${folder.path}/${tempPrefix}${i}.md`;
			await this.plugin.app.fileManager.renameFile(file, tempPath);
		}

		// Pass 3: Rename from temp names to final names
		for (const file of reorderedNotes) {
			const newId = newIds.get(file);
			if (newId) {
				const finalPath = `${folder.path}/${newId}.md`;
				await this.plugin.app.fileManager.renameFile(file, finalPath);
			}
		}
	}

	/**
	 * Gets all parent-level zettels in a specific folder
	 * Parent-level means IDs with no suffix (just the timestamp)
	 */
	private getParentLevelZettelsInFolder(folder: TFolder | null): TFile[] {
		if (!folder) {
			return [];
		}

		const allFiles = this.plugin.app.vault.getMarkdownFiles();
		const parentZettels: TFile[] = [];

		for (const file of allFiles) {
			// Check if file is in the same folder
			if (file.parent?.path !== folder.path) {
				continue;
			}

			if (this.shouldIgnoreFile(file)) {
				continue;
			}

			const id = this.extractZettelId(file.basename);
			if (!id) {
				continue;
			}

			// Check if this is a parent-level zettel (ID is just numbers, no suffix)
			if (/^\d+$/.test(id)) {
				parentZettels.push(file);
			}
		}

		// Sort by ID (chronological order)
		parentZettels.sort((a, b) => {
			const idA = this.extractZettelId(a.basename) || "";
			const idB = this.extractZettelId(b.basename) || "";
			return idA.localeCompare(idB);
		});

		return parentZettels;
	}

	/**
	 * Registers the "Next Sequence" command
	 * Opens the next parent-level zettel in the current folder
	 */
	private registerNextSequenceCommand(): void {
		this.plugin.addCommand({
			id: "next-sequence",
			name: "Go to Next Sequence",
			icon: "chevron-right",
			callback: async () => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					new Notice("No active file");
					return;
				}

				const currentId = this.extractZettelId(activeFile.basename);
				if (!currentId) {
					new Notice("Current file is not a zettel");
					return;
				}

				// Get the root ID (parent-level, no suffix)
				const currentRootId = this.getRootZettelId(currentId);

				// Find all parent-level zettels in the same folder
				const parentZettels = this.getParentLevelZettelsInFolder(
					activeFile.parent,
				);

				if (parentZettels.length === 0) {
					new Notice("No sequences found in this folder");
					return;
				}

				// Find current sequence index
				const currentIndex = parentZettels.findIndex(
					(file) =>
						this.extractZettelId(file.basename) === currentRootId,
				);

				if (currentIndex === -1) {
					new Notice("Could not find current sequence");
					return;
				}

				// Get next sequence (wrap around to first if at end)
				const nextIndex = (currentIndex + 1) % parentZettels.length;
				const nextFile = parentZettels[nextIndex];

				if (nextFile) {
					await this.plugin.app.workspace
						.getLeaf()
						.openFile(nextFile);
				}
			},
		});
	}

	/**
	 * Registers the "Previous Sequence" command
	 * Opens the previous parent-level zettel in the current folder
	 */
	private registerPreviousSequenceCommand(): void {
		this.plugin.addCommand({
			id: "previous-sequence",
			name: "Go to Previous Sequence",
			icon: "chevron-left",
			callback: async () => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					new Notice("No active file");
					return;
				}

				const currentId = this.extractZettelId(activeFile.basename);
				if (!currentId) {
					new Notice("Current file is not a zettel");
					return;
				}

				// Get the root ID (parent-level, no suffix)
				const currentRootId = this.getRootZettelId(currentId);

				// Find all parent-level zettels in the same folder
				const parentZettels = this.getParentLevelZettelsInFolder(
					activeFile.parent,
				);

				if (parentZettels.length === 0) {
					new Notice("No sequences found in this folder");
					return;
				}

				// Find current sequence index
				const currentIndex = parentZettels.findIndex(
					(file) =>
						this.extractZettelId(file.basename) === currentRootId,
				);

				if (currentIndex === -1) {
					new Notice("Could not find current sequence");
					return;
				}

				// Get previous sequence (wrap around to last if at start)
				const prevIndex =
					(currentIndex - 1 + parentZettels.length) %
					parentZettels.length;
				const prevFile = parentZettels[prevIndex];

				if (prevFile) {
					await this.plugin.app.workspace
						.getLeaf()
						.openFile(prevFile);
				}
			},
		});
	}

	/**
	 * Registers the "Next Child" command
	 * Opens the next sibling zettel, or first child if at a parent level
	 */
	private registerNextChildCommand(): void {
		this.plugin.addCommand({
			id: "next-child",
			name: "Go to Next Child",
			icon: "arrow-down-right",
			callback: async () => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					new Notice("No active file");
					return;
				}

				const currentId = this.extractZettelId(activeFile.basename);
				if (!currentId) {
					new Notice("Current file is not a zettel");
					return;
				}

				// Check if current note has a parent (is a child itself)
				const parentId = this.getParentZettelId(currentId);

				if (parentId) {
					// We're at a child level, navigate to next sibling
					console.log("Next Child - Has parent, finding siblings");
					const siblings = await this.findChildZettels(parentId);
					console.log(
						"Next Child - Found siblings:",
						siblings.length,
					);
					siblings.forEach((s) =>
						console.log("  - Sibling:", s.basename),
					);

					if (siblings.length === 0) {
						new Notice("No sibling zettels found");
						return;
					}

					// Find current position
					const currentIndex = siblings.findIndex(
						(file) => file.path === activeFile.path,
					);
					console.log(
						"Next Child - Current index in siblings:",
						currentIndex,
					);

					if (currentIndex === -1) {
						new Notice("Could not find current zettel in siblings");
						return;
					}

					// Get next sibling (wrap around to first if at end)
					const nextIndex = (currentIndex + 1) % siblings.length;
					console.log(
						"Next Child - Next index:",
						nextIndex,
						"File:",
						siblings[nextIndex].basename,
					);
					const nextFile = siblings[nextIndex];

					if (nextFile) {
						await this.plugin.app.workspace
							.getLeaf()
							.openFile(nextFile);
					}
				} else {
					// We're at parent level, navigate to first child
					console.log("Next Child - No parent, finding children");
					const children = await this.findChildZettels(currentId);
					console.log(
						"Next Child - Found children:",
						children.length,
					);
					children.forEach((c) =>
						console.log("  - Child:", c.basename),
					);

					if (children.length === 0) {
						new Notice("No child zettels found");
						return;
					}

					// Open first child
					console.log(
						"Next Child - Opening first child:",
						children[0].basename,
					);
					await this.plugin.app.workspace
						.getLeaf()
						.openFile(children[0]);
				}
			},
		});
	}

	/**
	 * Registers the "Previous Child" command
	 * Opens the previous sibling zettel
	 */
	private registerPreviousChildCommand(): void {
		this.plugin.addCommand({
			id: "previous-child",
			name: "Go to Previous Child",
			icon: "arrow-up-left",
			callback: async () => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					new Notice("No active file");
					return;
				}

				const currentId = this.extractZettelId(activeFile.basename);
				if (!currentId) {
					new Notice("Current file is not a zettel");
					return;
				}

				console.log("Next Child - Current ID:", currentId);
				console.log(
					"Next Child - Current filename:",
					activeFile.basename,
				);

				// Get parent ID
				const parentId = this.getParentZettelId(currentId);
				console.log("Next Child - Parent ID:", parentId);
				if (!parentId) {
					new Notice(
						"This zettel has no parent - cannot navigate to previous sibling",
					);
					return;
				}

				// Find all children of the parent (siblings)
				const siblings = await this.findChildZettels(parentId);

				if (siblings.length === 0) {
					new Notice("No sibling zettels found");
					return;
				}

				// Find current position
				const currentIndex = siblings.findIndex(
					(file) => file.path === activeFile.path,
				);

				if (currentIndex === -1) {
					new Notice("Could not find current zettel in siblings");
					return;
				}

				// Get previous sibling (wrap around to last if at start)
				const prevIndex =
					(currentIndex - 1 + siblings.length) % siblings.length;
				const prevFile = siblings[prevIndex];

				if (prevFile) {
					await this.plugin.app.workspace
						.getLeaf()
						.openFile(prevFile);
				}
			},
		});
	}

	/**
	 * Registers the "Go Up a Level" command
	 * Navigates from a child zettel to its parent
	 */
	private registerGoUpLevelCommand(): void {
		this.plugin.addCommand({
			id: "go-up-level",
			name: "Go Up a Level",
			icon: "arrow-up",
			callback: async () => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					new Notice("No active file");
					return;
				}

				const currentId = this.extractZettelId(activeFile.basename);
				if (!currentId) {
					new Notice("Current file is not a zettel");
					return;
				}

				// Get parent ID
				const parentId = this.getParentZettelId(currentId);
				if (!parentId) {
					new Notice(
						"This zettel has no parent - already at root level",
					);
					return;
				}

				// Find the parent file
				const files = this.plugin.app.vault.getMarkdownFiles();
				const parentFile = files.find((file) => {
					const fileId = this.extractZettelId(file.basename);
					return fileId === parentId;
				});

				if (!parentFile) {
					new Notice(`Parent zettel not found: ${parentId}`);
					return;
				}

				// Open parent file
				await this.plugin.app.workspace.getLeaf().openFile(parentFile);
			},
		});
	}

	/**
	 * Registers the "Go Down a Level" command
	 * Navigates from a parent zettel to its first child
	 */
	private registerGoDownLevelCommand(): void {
		this.plugin.addCommand({
			id: "go-down-level",
			name: "Go Down a Level",
			icon: "arrow-down",
			callback: async () => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					new Notice("No active file");
					return;
				}

				const currentId = this.extractZettelId(activeFile.basename);
				if (!currentId) {
					new Notice("Current file is not a zettel");
					return;
				}

				// Find children
				const children = await this.findChildZettels(currentId);

				if (children.length === 0) {
					new Notice("No child zettels found");
					return;
				}

				// Open first child
				await this.plugin.app.workspace.getLeaf().openFile(children[0]);
			},
		});
	}

	// ==================== Box-Specific Command Implementations ====================

	private registerBoxOpenZettelCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-open-zettel`,
			name: `${box.name}: Open Zettel`,
			icon: "folder-open",
			callback: () => this.openZettelForBox(box),
		});
	}

	private async openZettelForBox(box: Box): Promise<void> {
		// Get notes based on box type
		let titles: Map<string, TFile>;

		if (box.type === "folder" && box.folderPath) {
			// For folder-based boxes, get all files in the folder
			titles = await this.getNoteTitlesFromFolder(box.folderPath);
		} else {
			// For tag-based boxes, get files with the tag
			titles = await this.getNoteTitlesByTag(box.zettelTag);
		}

		// Filter by prefix if box has one
		if (box.zettelPrefix) {
			const prefix = `${box.zettelPrefix}-`;
			const filteredTitles = new Map<string, TFile>();

			for (const [title, file] of titles.entries()) {
				if (file.basename.startsWith(prefix)) {
					filteredTitles.set(title, file);
				}
			}

			titles = filteredTitles;
		}

		new ZettelSuggester(
			this.plugin.app,
			titles,
			this.currentlySelectedText(),
			(file: TFile) => {
				this.plugin.app.workspace.getLeaf().openFile(file);
			},
		).open();
	}

	private registerBoxOpenParentZettelCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-open-parent`,
			name: `${box.name}: Open Parent Zettel`,
			icon: "arrow-up",
			callback: () => this.openParentZettelForBox(box),
		});
	}

	private async openParentZettelForBox(box: Box): Promise<void> {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No active file");
			return;
		}

		const cache = this.plugin.app.metadataCache.getFileCache(activeFile);
		const upLink = cache?.frontmatter?.up;

		if (!upLink) {
			new Notice("No parent link found in frontmatter (up:).");
			return;
		}

		const linkText = upLink.replace(/^\[\[|\]\]$/g, "");
		const parentFile = this.plugin.app.metadataCache.getFirstLinkpathDest(
			linkText,
			activeFile.path,
		);

		if (parentFile) {
			await this.plugin.app.workspace.getLeaf().openFile(parentFile);
		} else {
			new Notice(`Parent zettel not found: ${linkText}`);
		}
	}

	private registerBoxOpenChildZettelCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-open-child`,
			name: `${box.name}: Open Child Zettel`,
			icon: "arrow-down",
			callback: () => this.openChildZettelForBox(box),
		});
	}

	private async openChildZettelForBox(box: Box): Promise<void> {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No active file");
			return;
		}

		const currentId = this.extractZettelId(activeFile.basename);
		if (!currentId) {
			new Notice("Current file is not a zettel");
			return;
		}

		const children = await this.findChildZettels(currentId);
		if (children.length === 0) {
			new Notice("No child zettels found");
			return;
		}

		if (children.length === 1) {
			await this.plugin.app.workspace.getLeaf().openFile(children[0]);
		} else {
			const titles = new Map(
				children.map((file) => [file.basename, file]),
			);
			new ZettelSuggester(this.plugin.app, titles, "", (file: TFile) => {
				this.plugin.app.workspace.getLeaf().openFile(file);
			}).open();
		}
	}

	private registerBoxOpenSiblingZettelCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-open-sibling`,
			name: `${box.name}: Open Sibling Zettel`,
			icon: "arrow-right",
			callback: () => this.openSiblingZettelForBox(box),
		});
	}

	private async openSiblingZettelForBox(box: Box): Promise<void> {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No active file");
			return;
		}

		const currentId = this.extractZettelId(activeFile.basename);
		if (!currentId) {
			new Notice("Current file is not a zettel");
			return;
		}

		const siblings = await this.findSiblingZettels(currentId);
		if (siblings.length === 0) {
			new Notice("No sibling zettels found");
			return;
		}

		const titles = new Map(siblings.map((file) => [file.basename, file]));
		new ZettelSuggester(this.plugin.app, titles, "", (file: TFile) => {
			this.plugin.app.workspace.getLeaf().openFile(file);
		}).open();
	}

	private registerBoxNavigatorCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-navigator`,
			name: `${box.name}: Zettelkasten Navigator`,
			icon: "compass",
			callback: () => this.openNavigatorForBox(box),
		});
	}

	private async openNavigatorForBox(box: Box): Promise<void> {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No active file open");
			return;
		}

		const currentId = this.extractZettelId(activeFile.basename);
		if (!currentId) {
			new Notice("Current file is not a zettel");
			return;
		}

		const options = await this.buildNavigationOptions(
			activeFile,
			currentId,
		);

		new NavigatorModal(
			this.plugin.app,
			activeFile.basename,
			options,
			(file: TFile) => {
				this.plugin.app.workspace.getLeaf().openFile(file);
			},
		).open();
	}

	private registerBoxReorderSequenceCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-reorder-sequence`,
			name: `${box.name}: Reorder Note Sequence`,
			icon: "arrow-up-down",
			callback: () => this.reorderSequenceForBox(box),
		});
	}

	private async reorderSequenceForBox(box: Box): Promise<void> {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No active file");
			return;
		}

		const currentId = this.extractZettelId(activeFile.basename);
		if (!currentId) {
			new Notice("Current file is not a zettel");
			return;
		}

		const children = await this.findChildZettels(currentId);
		if (children.length === 0) {
			new Notice("No child zettels to reorder");
			return;
		}

		new SequenceReorderModal(
			this.plugin.app,
			activeFile,
			children,
			async (
				reorderedNotes: TFile[],
				promoted: TFile[],
				indentLevels: Map<TFile, number>,
			) => {
				try {
					await this.handleSequenceReorder(
						activeFile,
						currentId,
						reorderedNotes,
						promoted,
						indentLevels,
					);
				} catch (error) {
					new Notice(`Error reordering sequence: ${error.message}`);
				}
			},
		).open();
	}

	private registerBoxNextSequenceCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-next-sequence`,
			name: `${box.name}: Go to Next Sequence`,
			icon: "arrow-right",
			callback: () => this.goToNextSequenceForBox(box),
		});
	}

	private async goToNextSequenceForBox(box: Box): Promise<void> {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No active file");
			return;
		}

		const currentId = this.extractZettelId(activeFile.basename);
		if (!currentId) {
			new Notice("Current file is not a zettel");
			return;
		}

		const cache = this.plugin.app.metadataCache.getFileCache(activeFile);
		const upLink = cache?.frontmatter?.up;

		if (!upLink) {
			new Notice("No parent link found");
			return;
		}

		const linkText = upLink.replace(/^\[\[|\]\]$/g, "");
		const parentFile = this.plugin.app.metadataCache.getFirstLinkpathDest(
			linkText,
			activeFile.path,
		);

		if (!parentFile) {
			new Notice("Parent file not found");
			return;
		}

		const parentId = this.extractZettelId(parentFile.basename);
		if (!parentId) {
			new Notice("Parent is not a zettel");
			return;
		}

		const siblings = await this.findChildZettels(parentId);
		const currentIndex = siblings.findIndex(
			(f) => f.path === activeFile.path,
		);

		if (currentIndex === -1) {
			new Notice("Current file not found in parent's children");
			return;
		}

		if (currentIndex < siblings.length - 1) {
			await this.plugin.app.workspace
				.getLeaf()
				.openFile(siblings[currentIndex + 1]);
		} else {
			new Notice("Already at the last sibling");
		}
	}

	private registerBoxPreviousSequenceCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-previous-sequence`,
			name: `${box.name}: Go to Previous Sequence`,
			icon: "arrow-left",
			callback: () => this.goToPreviousSequenceForBox(box),
		});
	}

	private async goToPreviousSequenceForBox(box: Box): Promise<void> {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No active file");
			return;
		}

		const currentId = this.extractZettelId(activeFile.basename);
		if (!currentId) {
			new Notice("Current file is not a zettel");
			return;
		}

		const cache = this.plugin.app.metadataCache.getFileCache(activeFile);
		const upLink = cache?.frontmatter?.up;

		if (!upLink) {
			new Notice("No parent link found");
			return;
		}

		const linkText = upLink.replace(/^\[\[|\]\]$/g, "");
		const parentFile = this.plugin.app.metadataCache.getFirstLinkpathDest(
			linkText,
			activeFile.path,
		);

		if (!parentFile) {
			new Notice("Parent file not found");
			return;
		}

		const parentId = this.extractZettelId(parentFile.basename);
		if (!parentId) {
			new Notice("Parent is not a zettel");
			return;
		}

		const siblings = await this.findChildZettels(parentId);
		const currentIndex = siblings.findIndex(
			(f) => f.path === activeFile.path,
		);

		if (currentIndex === -1) {
			new Notice("Current file not found in parent's children");
			return;
		}

		if (currentIndex > 0) {
			await this.plugin.app.workspace
				.getLeaf()
				.openFile(siblings[currentIndex - 1]);
		} else {
			new Notice("Already at the first sibling");
		}
	}

	private registerBoxNextChildCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-next-child`,
			name: `${box.name}: Go to Next Child`,
			icon: "arrow-down-right",
			callback: () => this.goToNextChildForBox(box),
		});
	}

	private async goToNextChildForBox(box: Box): Promise<void> {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No active file");
			return;
		}

		const currentId = this.extractZettelId(activeFile.basename);
		if (!currentId) {
			new Notice("Current file is not a zettel");
			return;
		}

		const cache = this.plugin.app.metadataCache.getFileCache(activeFile);
		const upLink = cache?.frontmatter?.up;

		if (upLink) {
			const linkText = upLink.replace(/^\[\[|\]\]$/g, "");
			const parentFile =
				this.plugin.app.metadataCache.getFirstLinkpathDest(
					linkText,
					activeFile.path,
				);

			if (parentFile) {
				const parentId = this.extractZettelId(parentFile.basename);
				if (parentId) {
					const siblings = await this.findChildZettels(parentId);
					const currentIndex = siblings.findIndex(
						(f) => f.path === activeFile.path,
					);

					if (
						currentIndex !== -1 &&
						currentIndex < siblings.length - 1
					) {
						await this.plugin.app.workspace
							.getLeaf()
							.openFile(siblings[currentIndex + 1]);
						return;
					}
				}
			}
		}

		const children = await this.findChildZettels(currentId);
		if (children.length === 0) {
			new Notice("No child zettels found");
			return;
		}

		await this.plugin.app.workspace.getLeaf().openFile(children[0]);
	}

	private registerBoxPreviousChildCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-previous-child`,
			name: `${box.name}: Go to Previous Child`,
			icon: "arrow-up-left",
			callback: () => this.goToPreviousChildForBox(box),
		});
	}

	private async goToPreviousChildForBox(box: Box): Promise<void> {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No active file");
			return;
		}

		const currentId = this.extractZettelId(activeFile.basename);
		if (!currentId) {
			new Notice("Current file is not a zettel");
			return;
		}

		const cache = this.plugin.app.metadataCache.getFileCache(activeFile);
		const upLink = cache?.frontmatter?.up;

		if (!upLink) {
			new Notice("No parent link found");
			return;
		}

		const linkText = upLink.replace(/^\[\[|\]\]$/g, "");
		const parentFile = this.plugin.app.metadataCache.getFirstLinkpathDest(
			linkText,
			activeFile.path,
		);

		if (!parentFile) {
			new Notice("Parent file not found");
			return;
		}

		const parentId = this.extractZettelId(parentFile.basename);
		if (!parentId) {
			new Notice("Parent is not a zettel");
			return;
		}

		const siblings = await this.findChildZettels(parentId);
		const currentIndex = siblings.findIndex(
			(f) => f.path === activeFile.path,
		);

		if (currentIndex === -1) {
			new Notice("Current file not found in parent's children");
			return;
		}

		if (currentIndex > 0) {
			await this.plugin.app.workspace
				.getLeaf()
				.openFile(siblings[currentIndex - 1]);
		} else {
			new Notice("Already at the first sibling");
		}
	}

	private registerBoxGoUpLevelCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-go-up-level`,
			name: `${box.name}: Go Up a Level`,
			icon: "chevron-up",
			callback: () => this.goUpLevelForBox(box),
		});
	}

	private async goUpLevelForBox(box: Box): Promise<void> {
		await this.openParentZettelForBox(box);
	}

	private registerBoxGoDownLevelCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-go-down-level`,
			name: `${box.name}: Go Down a Level`,
			icon: "chevron-down",
			callback: () => this.goDownLevelForBox(box),
		});
	}

	private async goDownLevelForBox(box: Box): Promise<void> {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No active file");
			return;
		}

		const currentId = this.extractZettelId(activeFile.basename);
		if (!currentId) {
			new Notice("Current file is not a zettel");
			return;
		}

		const children = await this.findChildZettels(currentId);
		if (children.length === 0) {
			new Notice("No child zettels found");
			return;
		}

		await this.plugin.app.workspace.getLeaf().openFile(children[0]);
	}

	private registerBoxAssignParentCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-assign-parent`,
			name: `${box.name}: Assign Parent`,
			icon: "link",
			callback: () => this.assignParentForBox(box),
		});
	}

	private async assignParentForBox(box: Box): Promise<void> {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No active file");
			return;
		}

		const titles = await this.getNoteTitlesByTag(box.zettelTag);
		new ZettelSuggester(
			this.plugin.app,
			titles,
			"",
			async (parentFile: TFile) => {
				await this.plugin.app.fileManager.processFrontMatter(
					activeFile,
					(frontmatter) => {
						frontmatter.up = `[[${parentFile.basename}]]`;
					},
				);
				new Notice(`Assigned parent: ${parentFile.basename}`);
			},
		).open();
	}

	private registerBoxAssignChildCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-assign-child`,
			name: `${box.name}: Assign Child`,
			icon: "link",
			callback: () => this.assignChildForBox(box),
		});
	}

	private async assignChildForBox(box: Box): Promise<void> {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No active file");
			return;
		}

		const titles = await this.getNoteTitlesByTag(box.zettelTag);
		new ZettelSuggester(
			this.plugin.app,
			titles,
			"",
			async (childFile: TFile) => {
				await this.plugin.app.fileManager.processFrontMatter(
					childFile,
					(frontmatter) => {
						frontmatter.up = `[[${activeFile.basename}]]`;
					},
				);
				new Notice(`Assigned child: ${childFile.basename}`);
			},
		).open();
	}

	private registerBoxQuickZettelCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-quick-zettel`,
			name: `${box.name}: Quick Zettel`,
			icon: "zap",
			callback: () => this.quickZettelForBox(box),
		});
	}

	private async quickZettelForBox(box: Box): Promise<void> {
		const folder =
			box.type === "folder" && box.folderPath
				? (this.plugin.app.vault.getAbstractFileByPath(
						box.folderPath,
					) as TFolder)
				: this.plugin.app.vault.getRoot();

		const zettelId = this.generateZettelId("zettel", box.zettelIdFormat);
		const prefix = box.zettelPrefix ? `${box.zettelPrefix}-` : "";
		const filename = `${prefix}${zettelId}`;
		const path = `${folder.path}/${filename}.md`;

		const creator = new FileCreator(
			this.plugin.app,
			path,
			"", // Empty title for quick zettel
			() => {
				new Notice(`Created quick zettel: ${filename}`);
			},
			box.noteTemplatePath,
		);
		try {
			await creator.create();
		} catch (error) {
			new Notice(`Error creating quick zettel: ${error.message}`);
		}
	}

	private registerBoxCreateNoteCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-create-note`,
			name: `${box.name}: Create New Note`,
			icon: "file-plus",
			callback: () => this.createNoteForBox(box),
		});
	}

	private async createNoteForBox(box: Box): Promise<void> {
		const titles = await this.getNoteTitlesByTag(box.zettelTag);
		new CreateNoteWithSuggestModal(
			this.plugin.app,
			titles,
			async (title: string) => {
				const folder =
					box.type === "folder" && box.folderPath
						? (this.plugin.app.vault.getAbstractFileByPath(
								box.folderPath,
							) as TFolder)
						: this.plugin.app.vault.getRoot();

				const zettelId = this.generateZettelId("zettel", box.zettelIdFormat);
				const prefix = box.zettelPrefix ? `${box.zettelPrefix}-` : "";
				const filename =
					box.useSeparatorFormat && title
						? `${prefix}${zettelId}${box.zettelIdSeparator}${title}`
						: `${prefix}${zettelId}`;
				const path = `${folder.path}/${filename}.md`;

				const creator = new FileCreator(
					this.plugin.app,
					path,
					title,
					() => {
						new Notice(`Created note: ${title}`);
					},
					box.noteTemplatePath,
				);
				try {
					await creator.create();
				} catch (error) {
					new Notice(`Error creating note: ${error.message}`);
				}
			},
			true,
		).open();
	}

	private registerBoxCreateChildZettelCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-create-child`,
			name: `${box.name}: Create Child Zettel`,
			icon: "file-plus",
			callback: () => this.createChildZettelForBox(box),
		});
	}

	private async createChildZettelForBox(box: Box): Promise<void> {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No active file");
			return;
		}

		const titles = await this.getNoteTitlesByTag(box.zettelTag);
		new CreateNoteWithSuggestModal(
			this.plugin.app,
			titles,
			async (title: string) => {
				const folder =
					box.type === "folder" && box.folderPath
						? (this.plugin.app.vault.getAbstractFileByPath(
								box.folderPath,
							) as TFolder)
						: this.plugin.app.vault.getRoot();

				const zettelId = this.generateZettelId("zettel", box.zettelIdFormat);
				const prefix = box.zettelPrefix ? `${box.zettelPrefix}-` : "";
				const filename =
					box.useSeparatorFormat && title
						? `${prefix}${zettelId}${box.zettelIdSeparator}${title}`
						: `${prefix}${zettelId}`;
				const path = `${folder.path}/${filename}.md`;

				const creator = new FileCreator(
					this.plugin.app,
					path,
					title,
					() => {
						new Notice(`Created child zettel: ${title}`);
					},
					box.noteTemplatePath,
				);
				try {
					await creator.create();
				} catch (error) {
					new Notice(`Error creating child zettel: ${error.message}`);
				}
			},
			true,
		).open();
	}

	private registerBoxCreateSiblingZettelCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-create-sibling`,
			name: `${box.name}: Create Sibling Zettel`,
			icon: "file-plus",
			callback: () => this.createSiblingZettelForBox(box),
		});
	}

	private async createSiblingZettelForBox(box: Box): Promise<void> {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No active file");
			return;
		}

		const cache = this.plugin.app.metadataCache.getFileCache(activeFile);
		const upLink = cache?.frontmatter?.up;

		if (!upLink) {
			new Notice("Current file has no parent (up: property)");
			return;
		}

		const titles = await this.getNoteTitlesByTag(box.zettelTag);
		new CreateNoteWithSuggestModal(
			this.plugin.app,
			titles,
			async (title: string) => {
				const folder =
					box.type === "folder" && box.folderPath
						? (this.plugin.app.vault.getAbstractFileByPath(
								box.folderPath,
							) as TFolder)
						: this.plugin.app.vault.getRoot();

				const zettelId = this.generateZettelId("zettel", box.zettelIdFormat);
				const prefix = box.zettelPrefix ? `${box.zettelPrefix}-` : "";
				const filename =
					box.useSeparatorFormat && title
						? `${prefix}${zettelId}${box.zettelIdSeparator}${title}`
						: `${prefix}${zettelId}`;
				const path = `${folder.path}/${filename}.md`;

				const creator = new FileCreator(
					this.plugin.app,
					path,
					title,
					() => {
						new Notice(`Created sibling zettel: ${title}`);
					},
					box.noteTemplatePath,
				);
				try {
					await creator.create();
				} catch (error) {
					new Notice(
						`Error creating sibling zettel: ${error.message}`,
					);
				}
			},
			true,
		).open();
	}

	private registerBoxIndentZettelCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-indent`,
			name: `${box.name}: Indent Zettel`,
			icon: "indent",
			callback: () => this.indentZettelForBox(box),
		});
	}

	private async indentZettelForBox(box: Box): Promise<void> {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No active file");
			return;
		}

		const titles = await this.getNoteTitlesByTag(box.zettelTag);
		new ZettelSuggester(
			this.plugin.app,
			titles,
			"",
			async (newParentFile: TFile) => {
				await this.plugin.app.fileManager.processFrontMatter(
					activeFile,
					(frontmatter) => {
						frontmatter.up = `[[${newParentFile.basename}]]`;
					},
				);
				new Notice(`Indented under: ${newParentFile.basename}`);
			},
		).open();
	}

	private registerBoxOutdentZettelCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-outdent`,
			name: `${box.name}: Outdent Zettel`,
			icon: "outdent",
			callback: () => this.outdentZettelForBox(box),
		});
	}

	private async outdentZettelForBox(box: Box): Promise<void> {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No active file");
			return;
		}

		const cache = this.plugin.app.metadataCache.getFileCache(activeFile);
		const upLink = cache?.frontmatter?.up;

		if (!upLink) {
			new Notice("No parent to outdent from");
			return;
		}

		const linkText = upLink.replace(/^\[\[|\]\]$/g, "");
		const parentFile = this.plugin.app.metadataCache.getFirstLinkpathDest(
			linkText,
			activeFile.path,
		);

		if (!parentFile) {
			new Notice("Parent file not found");
			return;
		}

		const parentCache =
			this.plugin.app.metadataCache.getFileCache(parentFile);
		const grandparentLink = parentCache?.frontmatter?.up;

		await this.plugin.app.fileManager.processFrontMatter(
			activeFile,
			(frontmatter) => {
				if (grandparentLink) {
					frontmatter.up = grandparentLink;
				} else {
					delete frontmatter.up;
				}
			},
		);

		new Notice(
			grandparentLink ? "Outdented to grandparent" : "Outdented to root",
		);
	}

	private registerBoxOpenFleetingCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-open-fleeting`,
			name: `${box.name}: Open Fleeting Note`,
			icon: "folder-open",
			callback: () => this.openFleetingForBox(box),
		});
	}

	private async openFleetingForBox(box: Box): Promise<void> {
		const titles = await this.getNoteTitlesByTag(box.fleetingNotesTag);
		new ZettelSuggester(
			this.plugin.app,
			titles,
			this.currentlySelectedText(),
			(file: TFile) => {
				this.plugin.app.workspace.getLeaf().openFile(file);
			},
		).open();
	}

	private registerBoxCreateFleetingNoteCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-create-fleeting`,
			name: `${box.name}: Create Fleeting Note`,
			icon: "file-plus",
			callback: () => this.createFleetingNoteForBox(box),
		});
	}

	private async createFleetingNoteForBox(box: Box): Promise<void> {
		const folder =
			box.fleetingNotesUseSeparateLocation && box.fleetingNotesLocation
				? (this.plugin.app.vault.getAbstractFileByPath(
						box.fleetingNotesLocation,
					) as TFolder)
				: box.type === "folder" && box.folderPath
					? (this.plugin.app.vault.getAbstractFileByPath(
							box.folderPath,
						) as TFolder)
					: this.plugin.app.vault.getRoot();

		const title = "";
		const zettelId = this.generateZettelId("zettel", box.zettelIdFormat);
		const prefix = box.zettelPrefix ? `${box.zettelPrefix}-` : "";

		let filename: string;
		if (box.fleetingNotesUseZettelId) {
			filename = `${prefix}${zettelId}`;
		} else {
			filename =
				box.fleetingNotesFilenameFormat.replace("{{title}}", title) ||
				`${prefix}${zettelId}`;
		}

		const path = `${folder.path}/${filename}.md`;

		const creator = new FileCreator(
			this.plugin.app,
			path,
			title,
			() => {
				new Notice("Created fleeting note");
			},
			box.fleetingNotesTemplatePath,
		);
		try {
			await creator.create();
		} catch (error) {
			new Notice(`Error creating fleeting note: ${error.message}`);
		}
	}

	private registerBoxOpenMocCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-open-moc`,
			name: `${box.name}: Open MOC`,
			icon: "folder-open",
			callback: () => this.openMocForBox(box),
		});
	}

	private async openMocForBox(box: Box): Promise<void> {
		const titles = await this.getNoteTitlesByTag(box.mocsTag);
		new ZettelSuggester(
			this.plugin.app,
			titles,
			this.currentlySelectedText(),
			(file: TFile) => {
				this.plugin.app.workspace.getLeaf().openFile(file);
			},
		).open();
	}

	private registerBoxCreateMocCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-create-moc`,
			name: `${box.name}: Create MOC`,
			icon: "file-plus",
			callback: () => this.createMocForBox(box),
		});
	}

	private async createMocForBox(box: Box): Promise<void> {
		const titles = await this.getNoteTitlesByTag(box.mocsTag);
		new CreateNoteWithSuggestModal(
			this.plugin.app,
			titles,
			async (title: string) => {
				const folder =
					box.mocsUseSeparateLocation && box.mocsLocation
						? (this.plugin.app.vault.getAbstractFileByPath(
								box.mocsLocation,
							) as TFolder)
						: box.type === "folder" && box.folderPath
							? (this.plugin.app.vault.getAbstractFileByPath(
									box.folderPath,
								) as TFolder)
							: this.plugin.app.vault.getRoot();

				const zettelId = this.generateZettelId("zettel", box.zettelIdFormat);
				const prefix = box.zettelPrefix ? `${box.zettelPrefix}-` : "";

				let filename: string;
				if (box.mocsUseZettelId) {
					filename =
						box.useSeparatorFormat && title
							? `${prefix}${zettelId}${box.zettelIdSeparator}${title}`
							: `${prefix}${zettelId}`;
				} else {
					filename =
						box.mocsFilenameFormat.replace("{{title}}", title) ||
						`${prefix}${title} MOC`;
				}

				const path = `${folder.path}/${filename}.md`;

				const creator = new FileCreator(
					this.plugin.app,
					path,
					title,
					() => {
						new Notice(`Created MOC: ${title}`);
					},
					box.mocsTemplatePath,
				);
				try {
					await creator.create();
				} catch (error) {
					new Notice(`Error creating MOC: ${error.message}`);
				}
			},
			true,
		).open();
	}

	private registerBoxOpenIndexCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-open-index`,
			name: `${box.name}: Open Index`,
			icon: "folder-open",
			callback: () => this.openIndexForBox(box),
		});
	}

	private async openIndexForBox(box: Box): Promise<void> {
		const titles = await this.getNoteTitlesByTag(box.indexesTag);
		new ZettelSuggester(
			this.plugin.app,
			titles,
			this.currentlySelectedText(),
			(file: TFile) => {
				this.plugin.app.workspace.getLeaf().openFile(file);
			},
		).open();
	}

	private registerBoxCreateIndexCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-create-index`,
			name: `${box.name}: Create Index`,
			icon: "file-plus",
			callback: () => this.createIndexForBox(box),
		});
	}

	private async createIndexForBox(box: Box): Promise<void> {
		const titles = await this.getNoteTitlesByTag(box.indexesTag);
		new CreateNoteWithSuggestModal(
			this.plugin.app,
			titles,
			async (title: string) => {
				const folder =
					box.indexesUseSeparateLocation && box.indexesLocation
						? (this.plugin.app.vault.getAbstractFileByPath(
								box.indexesLocation,
							) as TFolder)
						: box.type === "folder" && box.folderPath
							? (this.plugin.app.vault.getAbstractFileByPath(
									box.folderPath,
								) as TFolder)
							: this.plugin.app.vault.getRoot();

				const zettelId = this.generateZettelId("zettel", box.zettelIdFormat);
				const prefix = box.zettelPrefix ? `${box.zettelPrefix}-` : "";

				let filename: string;
				if (box.indexesUseZettelId) {
					filename =
						box.useSeparatorFormat && title
							? `${prefix}${zettelId}${box.zettelIdSeparator}${title}`
							: `${prefix}${zettelId}`;
				} else {
					filename =
						box.indexesFilenameFormat.replace("{{title}}", title) ||
						`${prefix}${title} Index`;
				}

				const path = `${folder.path}/${filename}.md`;

				const creator = new FileCreator(
					this.plugin.app,
					path,
					title,
					() => {
						new Notice(`Created index: ${title}`);
					},
					box.indexesTemplatePath,
				);
				try {
					await creator.create();
				} catch (error) {
					new Notice(`Error creating index: ${error.message}`);
				}
			},
			true,
		).open();
	}

	/**
	 * Registers "Move to Root" command for a specific box
	 */
	private registerBoxMoveToRootCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-move-to-root`,
			name: `${box.name}: Move to Root`,
			icon: "arrow-up-to-line",
			callback: () => this.moveToRootForBox(box),
		});
	}

	private async moveToRootForBox(box: Box): Promise<void> {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No active file");
			return;
		}

		const currentId = this.extractZettelId(activeFile.basename);
		if (!currentId) {
			new Notice("Active file is not a zettel");
			return;
		}

		const parentId = this.getParentZettelId(currentId);
		if (!parentId) {
			new Notice("This zettel is already at the root level");
			return;
		}

		// Use the same logic as the global command
		// Find all descendants of the current zettel
		const allFiles = this.plugin.app.vault.getMarkdownFiles();
		const descendants: TFile[] = [];

		for (const file of allFiles) {
			const id = this.extractZettelId(file.basename);
			if (id && id.startsWith(currentId) && id !== currentId) {
				descendants.push(file);
			}
		}

		// Generate a new root-level ID
		const newRootId = this.generateZettelId("zettel", box.zettelIdFormat);
		const folder = activeFile.parent || this.plugin.app.vault.getRoot();

		// Check if a file with the new ID already exists
		const existingFile = allFiles.find(
			(f) => this.extractZettelId(f.basename) === newRootId,
		);
		if (existingFile && existingFile.path !== activeFile.path) {
			new Notice(
				`A file with ID ${newRootId} already exists. Cannot move to root.`,
			);
			return;
		}

		try {
			// Rename the active file with the new root ID
			const title = this.getTitleFromFile(activeFile);
			const newFilename = this.buildZettelFilename(newRootId, title, box);
			const newPath = `${folder.path}/${newFilename}.md`;
			await this.plugin.app.fileManager.renameFile(activeFile, newPath);

			// Remove parent link from file (move to root)
			await this.removeParentLinkFromFile(activeFile);

			// Now rename all descendants to maintain the hierarchy
			for (const descendant of descendants) {
				const descendantId = this.extractZettelId(
					descendant.basename,
				);
				if (!descendantId) continue;

				// Transform the descendant ID preserving alternating letter/number pattern
				const newDescendantId = this.transformDescendantId(
					descendantId,
					currentId,
					newRootId,
				);

				const descendantTitle = this.getTitleFromFile(descendant);
				const descendantNewFilename = this.buildZettelFilename(
					newDescendantId,
					descendantTitle,
					box,
				);
				const descendantFolder =
					descendant.parent || this.plugin.app.vault.getRoot();
				const descendantNewPath = `${descendantFolder.path}/${descendantNewFilename}.md`;
				await this.plugin.app.fileManager.renameFile(
					descendant,
					descendantNewPath,
				);
			}

			new Notice(
				`Moved to root and renamed ${descendants.length + 1} file(s) to: ${newRootId}`,
			);

			// Keep the file open after rename
			await this.plugin.app.workspace.getLeaf().openFile(activeFile);
		} catch (error) {
			new Notice(`Error moving to root: ${error.message}`);
		}
	}

	/**
	 * Registers "Move to Correct Location" command for a specific box
	 */
	private registerBoxMoveToCorrectLocationCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-move-to-correct-location`,
			name: `${box.name}: Move to Correct Location`,
			icon: "folder-input",
			callback: () => this.moveToCorrectLocationForBox(box),
		});
	}

	private async moveToCorrectLocationForBox(box: Box): Promise<void> {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No active file");
			return;
		}

		const noteType = this.getNoteTypeFromFile(activeFile);
		const targetFolder = this.getTargetFolderForNoteType(noteType, box);

		if (!targetFolder) {
			new Notice(`Cannot determine target location for ${noteType} notes`);
			return;
		}

		if (activeFile.parent?.path === targetFolder.path) {
			new Notice("File is already in the correct location");
			return;
		}

		try {
			const newPath = `${targetFolder.path}/${activeFile.name}`;
			await this.plugin.app.fileManager.renameFile(activeFile, newPath);
			new Notice(`Moved ${activeFile.basename} to ${targetFolder.path}`);
		} catch (error) {
			new Notice(`Error moving file: ${error.message}`);
		}
	}

	/**
	 * Registers "Batch Move to Correct Location" command for a specific box
	 */
	private registerBoxBatchMoveToCorrectLocationCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-batch-move-to-correct-location`,
			name: `${box.name}: Batch Move to Correct Location`,
			icon: "folder-input",
			callback: () => this.batchMoveToCorrectLocationForBox(box),
		});
	}

	private async batchMoveToCorrectLocationForBox(box: Box): Promise<void> {
		new FolderSuggestModal(this.plugin, async (folder: TFolder) => {
			try {
				const allFiles = this.plugin.app.vault
					.getMarkdownFiles()
					.filter((file) => file.path.startsWith(folder.path));

				let movedCount = 0;

				for (const file of allFiles) {
					const noteType = this.getNoteTypeFromFile(file);
					const targetFolder = this.getTargetFolderForNoteType(
						noteType,
						box,
					);

					if (
						targetFolder &&
						file.parent?.path !== targetFolder.path
					) {
						const newPath = `${targetFolder.path}/${file.name}`;
						await this.plugin.app.fileManager.renameFile(
							file,
							newPath,
						);
						movedCount++;
					}
				}

				if (movedCount > 0) {
					new Notice(`Moved ${movedCount} file(s) to correct locations`);
				} else {
					new Notice("All files are already in correct locations");
				}
			} catch (error) {
				new Notice(`Error moving files: ${error.message}`);
			}
		}).open();
	}

	/**
	 * Registers "Tag as Correct Type" command for a specific box
	 */
	private registerBoxTagAsCorrectTypeCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-tag-as-correct-type`,
			name: `${box.name}: Tag as Correct Type`,
			icon: "tag",
			callback: () => this.tagAsCorrectTypeForBox(box),
		});
	}

	private async tagAsCorrectTypeForBox(box: Box): Promise<void> {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No active file");
			return;
		}

		const noteType = this.getNoteTypeFromFile(activeFile);
		const correctTag = this.getTagForNoteType(noteType, box);

		if (!correctTag) {
			new Notice(`Cannot determine tag for ${noteType} notes`);
			return;
		}

		try {
			await this.plugin.app.fileManager.processFrontMatter(
				activeFile,
				(frontmatter) => {
					if (!frontmatter.tags) {
						frontmatter.tags = [];
					}
					if (!Array.isArray(frontmatter.tags)) {
						frontmatter.tags = [frontmatter.tags];
					}
					if (!frontmatter.tags.includes(correctTag)) {
						frontmatter.tags.push(correctTag);
					}
				},
			);
			new Notice(`Tagged ${activeFile.basename} as ${correctTag}`);
		} catch (error) {
			new Notice(`Error tagging file: ${error.message}`);
		}
	}

	/**
	 * Registers "Batch Tag as Correct Type" command for a specific box
	 */
	private registerBoxBatchTagAsCorrectTypeCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-batch-tag-as-correct-type`,
			name: `${box.name}: Batch Tag as Correct Type`,
			icon: "tag",
			callback: () => this.batchTagAsCorrectTypeForBox(box),
		});
	}

	private async batchTagAsCorrectTypeForBox(box: Box): Promise<void> {
		new FolderSuggestModal(this.plugin, async (folder: TFolder) => {
			try {
				const allFiles = this.plugin.app.vault
					.getMarkdownFiles()
					.filter((file) => file.path.startsWith(folder.path));

				let taggedCount = 0;

				for (const file of allFiles) {
					const noteType = this.getNoteTypeFromFile(file);
					const correctTag = this.getTagForNoteType(noteType, box);

					if (correctTag) {
						await this.plugin.app.fileManager.processFrontMatter(
							file,
							(frontmatter) => {
								if (!frontmatter.tags) {
									frontmatter.tags = [];
								}
								if (!Array.isArray(frontmatter.tags)) {
									frontmatter.tags = [frontmatter.tags];
								}
								if (!frontmatter.tags.includes(correctTag)) {
									frontmatter.tags.push(correctTag);
									taggedCount++;
								}
							},
						);
					}
				}

				if (taggedCount > 0) {
					new Notice(`Tagged ${taggedCount} file(s) with correct types`);
				} else {
					new Notice("All files already have correct tags");
				}
			} catch (error) {
				new Notice(`Error tagging files: ${error.message}`);
			}
		}).open();
	}

	/**
	 * Helper method to get target folder for a note type in a box
	 */
	private getTargetFolderForNoteType(
		noteType: string,
		box: Box,
	): TFolder | null {
		let targetPath: string | null = null;

		switch (noteType) {
			case "zettel":
				targetPath =
					box.type === "folder"
						? box.folderPath || null
						: null;
				break;
			case "fleeting":
				targetPath =
					box.enableFleetingNotes &&
					box.fleetingNotesUseSeparateLocation
						? box.fleetingNotesLocation
						: box.type === "folder"
							? box.folderPath || null
							: null;
				break;
			case "moc":
				targetPath =
					box.enableMocs && box.mocsUseSeparateLocation
						? box.mocsLocation
						: box.type === "folder"
							? box.folderPath || null
							: null;
				break;
			case "index":
				targetPath =
					box.enableIndexes && box.indexesUseSeparateLocation
						? box.indexesLocation
						: box.type === "folder"
							? box.folderPath || null
							: null;
				break;
		}

		if (!targetPath) return null;

		const folder =
			this.plugin.app.vault.getAbstractFileByPath(targetPath);
		return folder instanceof TFolder ? folder : null;
	}

	/**
	 * Helper method to get tag for a note type in a box
	 */
	private getTagForNoteType(noteType: string, box: Box): string | null {
		switch (noteType) {
			case "zettel":
				return box.zettelTag;
			case "fleeting":
				return box.enableFleetingNotes ? box.fleetingNotesTag : null;
			case "moc":
				return box.enableMocs ? box.mocsTag : null;
			case "index":
				return box.enableIndexes ? box.indexesTag : null;
			default:
				return null;
		}
	}

	/**
	 * Registers "Fix Filenames" command for a specific box
	 */
	private registerBoxFixFilenamesCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-fix-filenames`,
			name: `${box.name}: Fix Filenames (Current File)`,
			icon: "file-check",
			callback: () => this.fixFilenamesForBox(box),
		});
	}

	/**
	 * Registers "Batch Fix Filenames" command for a specific box
	 */
	private registerBoxBatchFixFilenamesCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-batch-fix-filenames`,
			name: `${box.name}: Batch Fix Filenames`,
			icon: "folder-check",
			callback: () => this.batchFixFilenamesForBox(box),
		});
	}

	/**
	 * Registers "Fix MOC Filename" command for a specific box
	 */
	private registerBoxFixMocFilenameCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-fix-moc-filename`,
			name: `${box.name}: Fix MOC Filename (Current File)`,
			icon: "file-check",
			callback: () => this.fixMocFilenameForBox(box),
		});
	}

	/**
	 * Registers "Batch Fix MOC Filenames" command for a specific box
	 */
	private registerBoxBatchFixMocFilenamesCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-batch-fix-moc-filenames`,
			name: `${box.name}: Batch Fix MOC Filenames`,
			icon: "folder-check",
			callback: () => this.batchFixMocFilenamesForBox(box),
		});
	}

	/**
	 * Registers "Fix Index Filename" command for a specific box
	 */
	private registerBoxFixIndexFilenameCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-fix-index-filename`,
			name: `${box.name}: Fix Index Filename (Current File)`,
			icon: "file-check",
			callback: () => this.fixIndexFilenameForBox(box),
		});
	}

	/**
	 * Registers "Batch Fix Index Filenames" command for a specific box
	 */
	private registerBoxBatchFixIndexFilenamesCommand(box: Box): void {
		this.plugin.addCommand({
			id: `box-${box.id}-batch-fix-index-filenames`,
			name: `${box.name}: Batch Fix Index Filenames`,
			icon: "folder-check",
			callback: () => this.batchFixIndexFilenamesForBox(box),
		});
	}

	/**
	 * Fix filenames for a box (current file and its siblings/descendants)
	 */
	private async fixFilenamesForBox(box: Box): Promise<void> {
		try {
			const activeFile = this.plugin.app.workspace.getActiveFile();
			if (!activeFile) {
				new Notice("No active file.");
				return;
			}

			const currentId = this.extractZettelId(activeFile.basename);
			if (!currentId) {
				new Notice("Active file is not a zettel.");
				return;
			}

			// Check if active file belongs to this box
			if (!this.fileMatchesBox(activeFile, box)) {
				new Notice(
					`Active file does not belong to the "${box.name}" box.`,
				);
				return;
			}

			const allFiles = this.plugin.app.vault.getMarkdownFiles();
			const zettels: TFile[] = [];

			// Find all files with zettel IDs that belong to this box
			for (const file of allFiles) {
				const id = this.extractZettelId(file.basename);
				if (id && this.fileMatchesBox(file, box)) {
					zettels.push(file);
				}
			}

			// Build parent-child relationships
			const childrenMap = new Map<string, TFile[]>();

			for (const file of zettels) {
				const id = this.extractZettelId(file.basename)!;
				const parentId = this.getParentZettelId(id);

				if (parentId) {
					if (!childrenMap.has(parentId)) {
						childrenMap.set(parentId, []);
					}
					childrenMap.get(parentId)!.push(file);
				}
			}

			// Find siblings of the current zettel
			const siblings = await this.findSiblingZettels(currentId);
			const siblingsToProcess = siblings.filter(
				(s) => this.extractZettelId(s.basename) !== null,
			);

			let fixedCount = 0;

			// Process each sibling and its descendants
			for (const siblingFile of siblingsToProcess) {
				const count = await this.fixZettelFilenameRecursive(
					siblingFile,
					childrenMap,
					undefined,
					box,
				);
				fixedCount += count;
			}

			if (fixedCount > 0) {
				new Notice(
					`Fixed ${fixedCount} filename(s) to consistent length.`,
				);
			} else {
				new Notice("All filenames are already correct.");
			}
		} catch (error) {
			new Notice(`Error fixing filenames: ${error.message}`);
		}
	}

	/**
	 * Batch fix filenames for a box (all files in the box)
	 */
	private async batchFixFilenamesForBox(box: Box): Promise<void> {
		try {
			const allFiles = this.plugin.app.vault.getMarkdownFiles();

			// Find all files with zettel IDs that belong to this box
			const zettels = allFiles.filter(
				(file) =>
					this.extractZettelId(file.basename) &&
					this.fileMatchesBox(file, box),
			);

			if (zettels.length === 0) {
				new Notice(`No zettels found in the "${box.name}" box.`);
				return;
			}

			// Build parent-child relationships
			const childrenMap = new Map<string, TFile[]>();

			for (const file of zettels) {
				const id = this.extractZettelId(file.basename)!;
				const parentId = this.getParentZettelId(id);

				if (parentId) {
					if (!childrenMap.has(parentId)) {
						childrenMap.set(parentId, []);
					}
					childrenMap.get(parentId)!.push(file);
				}
			}

			// Find root zettels (those without parents)
			const rootZettels = zettels.filter((file) => {
				const id = this.extractZettelId(file.basename);
				if (!id) return false;
				const parentId = this.getParentZettelId(id);
				return !parentId;
			});

			let fixedCount = 0;

			// Process each root and its descendants
			for (const rootFile of rootZettels) {
				const count = await this.fixZettelFilenameRecursive(
					rootFile,
					childrenMap,
					undefined,
					box,
				);
				fixedCount += count;
			}

			if (fixedCount > 0) {
				new Notice(
					`Fixed ${fixedCount} filename(s) in the "${box.name}" box.`,
				);
			} else {
				new Notice(
					`All filenames in the "${box.name}" box are already correct.`,
				);
			}
		} catch (error) {
			new Notice(`Error fixing filenames: ${error.message}`);
		}
	}

	/**
	 * Fix MOC filename for a box (current file)
	 */
	private async fixMocFilenameForBox(box: Box): Promise<void> {
		try {
			const activeFile = this.plugin.app.workspace.getActiveFile();
			if (!activeFile) {
				new Notice("No active file.");
				return;
			}

			// Check if active file belongs to this box
			if (!this.fileMatchesBox(activeFile, box)) {
				new Notice(
					`Active file does not belong to the "${box.name}" box.`,
				);
				return;
			}

			const noteType = this.getNoteTypeFromFile(activeFile);
			if (noteType !== "moc") {
				new Notice("Active file is not a MOC.");
				return;
			}

			const fixed = await this.fixMocFilename(activeFile, box);
			if (fixed) {
				new Notice("MOC filename fixed.");
			} else {
				new Notice("MOC filename is already correct.");
			}
		} catch (error) {
			new Notice(`Error fixing MOC filename: ${error.message}`);
		}
	}

	/**
	 * Batch fix MOC filenames for a box (all MOCs in the box)
	 */
	private async batchFixMocFilenamesForBox(box: Box): Promise<void> {
		try {
			const allFiles = this.plugin.app.vault.getMarkdownFiles();

			let fixedCount = 0;
			for (const file of allFiles) {
				// Check if file belongs to this box
				if (!this.fileMatchesBox(file, box)) {
					continue;
				}

				const noteType = this.getNoteTypeFromFile(file);
				if (noteType !== "moc") {
					continue;
				}

				const fixed = await this.fixMocFilename(file, box);
				if (fixed) {
					fixedCount++;
				}
			}

			if (fixedCount > 0) {
				new Notice(
					`Fixed ${fixedCount} MOC filename(s) in the "${box.name}" box.`,
				);
			} else {
				new Notice(
					`All MOC filenames in the "${box.name}" box are already correct.`,
				);
			}
		} catch (error) {
			new Notice(`Error fixing MOC filenames: ${error.message}`);
		}
	}

	/**
	 * Fix Index filename for a box (current file)
	 */
	private async fixIndexFilenameForBox(box: Box): Promise<void> {
		try {
			const activeFile = this.plugin.app.workspace.getActiveFile();
			if (!activeFile) {
				new Notice("No active file.");
				return;
			}

			// Check if active file belongs to this box
			if (!this.fileMatchesBox(activeFile, box)) {
				new Notice(
					`Active file does not belong to the "${box.name}" box.`,
				);
				return;
			}

			const noteType = this.getNoteTypeFromFile(activeFile);
			if (noteType !== "index") {
				new Notice("Active file is not an Index.");
				return;
			}

			const fixed = await this.fixIndexFilename(activeFile, box);
			if (fixed) {
				new Notice("Index filename fixed.");
			} else {
				new Notice("Index filename is already correct.");
			}
		} catch (error) {
			new Notice(`Error fixing Index filename: ${error.message}`);
		}
	}

	/**
	 * Batch fix Index filenames for a box (all Indexes in the box)
	 */
	private async batchFixIndexFilenamesForBox(box: Box): Promise<void> {
		try {
			const allFiles = this.plugin.app.vault.getMarkdownFiles();

			let fixedCount = 0;
			for (const file of allFiles) {
				// Check if file belongs to this box
				if (!this.fileMatchesBox(file, box)) {
					continue;
				}

				const noteType = this.getNoteTypeFromFile(file);
				if (noteType !== "index") {
					continue;
				}

				const fixed = await this.fixIndexFilename(file, box);
				if (fixed) {
					fixedCount++;
				}
			}

			if (fixedCount > 0) {
				new Notice(
					`Fixed ${fixedCount} Index filename(s) in the "${box.name}" box.`,
				);
			} else {
				new Notice(
					`All Index filenames in the "${box.name}" box are already correct.`,
				);
			}
		} catch (error) {
			new Notice(`Error fixing Index filenames: ${error.message}`);
		}
	}
}
