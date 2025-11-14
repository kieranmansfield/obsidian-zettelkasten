import { MarkdownView, Notice, TFile, TFolder } from "obsidian";
import { FileCreator } from "../classes/fileCreator";
import { ZettelSuggester } from "../ui/ZettelSuggester";
import { CreateNoteWithSuggestModal } from "../ui/CreateNoteWithSuggestModal";
import { NavigatorModal, NavigationOption } from "../ui/NavigatorModal";
import type ZettelkastenPlugin from "../../main";

// Manages all plugin commands
export class CommandManager {
	constructor(private plugin: ZettelkastenPlugin) {}

	/**
	 * Registers all commands with the plugin
	 */
	registerCommands(): void {
		this.registerOpenZettelCommand();
		this.registerOpenParentZettelCommand();
		this.registerOpenChildZettelCommand();
		this.registerOpenSiblingZettelCommand();
		this.registerZettelkastenNavigatorCommand();
		this.registerAssignParentCommand();
		this.registerAssignChildCommand();
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

									// Get the folder where zettels are stored
									const folder = this.getNoteTypeFolder(
										this.plugin.settings
											.zettelsUseSeparateLocation,
										this.plugin.settings.zettelsLocation,
									);

									// Generate new child ID based on parent
									const newChildId =
										await this.generateChildZettelId(
											parentId,
											folder,
											activeFile,
										);

									// Rename the file with the new child ID
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

									new Notice(
										`Assigned parent and renamed to: ${newChildId}`,
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

									new Notice(
										`Assigned child and renamed to: ${newChildId}`,
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
			checkCallback: (checking: boolean) => {
				if (!this.plugin.settings.enableFleetingNotes) {
					return false;
				}

				if (checking) {
					return true;
				}

				// Get existing fleeting notes for autocomplete
				this.getNoteTitlesByTag(
					this.plugin.settings.fleetingNotesTag,
				).then((notesMap) => {
					new CreateNoteWithSuggestModal(
						this.plugin.app,
						notesMap,
						async (title: string) => {
							const folder = this.getNoteTypeFolder(
								this.plugin.settings
									.fleetingNotesUseSeparateLocation,
								this.plugin.settings.fleetingNotesLocation,
							);
							const filename = this.buildFleetingFilename(title);
							const path = `${folder.path}/${filename}.md`;

							const creator = new FileCreator(
								this.plugin.app,
								path,
								title,
								() => {
									new Notice(
										`Created fleeting note: ${title}`,
									);
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
						true,
					).open();
				});

				return true;
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
	 * Extracts zettel ID from filename
	 * Looks for timestamp-based ID with optional hierarchy at the start of filename
	 */
	private extractZettelId(filename: string): string | null {
		// Match timestamp pattern (13+ digits to handle various formats) with optional alternating letters/numbers
		// Examples: 2025111321511, 20251114154532123, 20251114154532123a, 20251114154532123a1
		const match = filename.match(/^(\d{13,}(?:[a-z]+|\d+)*)/);
		return match ? match[1] : null;
	}

	/**
	 * Generates a child zettel ID based on parent ID
	 * Alternates between letters and numbers: 123 -> 123a -> 123a1 -> 123a1a -> 123a1a1
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
			// Find all children with letters (e.g., 123a, 123b, 123c)
			const childPattern = new RegExp(
				`^${this.escapeRegex(parentId)}([a-z])(?![a-z0-9])`,
			);
			let maxLetter = "";

			for (const file of files) {
				const match = file.basename.match(childPattern);
				if (match) {
					const letter = match[1];
					if (!maxLetter || letter > maxLetter) {
						maxLetter = letter;
					}
				}
			}

			// Return next available letter (a if none exist, otherwise increment)
			const nextLetter = maxLetter
				? String.fromCharCode(maxLetter.charCodeAt(0) + 1)
				: "a";
			return `${parentId}${nextLetter}`;
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
	 * Determines if the next child should use a letter or number
	 * Alternates based on hierarchy depth
	 */
	private shouldUseLetterForChild(parentId: string): boolean {
		// Remove the timestamp portion (first 14+ digits)
		const hierarchyPart = parentId.replace(/^\d{14,}/, "");

		if (!hierarchyPart) {
			// No hierarchy yet, first level should use letters
			return true;
		}

		// Count the depth by counting letters and numbers
		const letterMatches = hierarchyPart.match(/[a-z]/g);
		const numberMatches = hierarchyPart.match(/\d+/g);

		const letterCount = letterMatches ? letterMatches.length : 0;
		const numberCount = numberMatches ? numberMatches.length : 0;

		// If counts are equal, use letter; otherwise use number
		return letterCount === numberCount;
	}

	/**
	 * Escapes special regex characters in a string
	 */
	private escapeRegex(str: string): string {
		return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

		new Notice(`Indented to ${newId}`);
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

		new Notice(`Outdented to ${newId}`);
	}

	/**
	 * Gets the parent zettel ID from a child ID
	 */
	private getParentZettelId(childId: string): string | null {
		// Remove the timestamp portion to get hierarchy
		const hierarchyPart = childId.replace(/^(\d{13,})/, "");

		if (!hierarchyPart) {
			// No hierarchy, this is a root zettel
			return null;
		}

		// Remove the last segment (letter or number)
		const parentHierarchy = hierarchyPart.replace(/[a-z]+$|[0-9]+$/, "");
		const timestamp = childId.match(/^(\d{13,})/)?.[1];

		return timestamp ? timestamp + parentHierarchy : null;
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

		let childPattern: RegExp;
		if (shouldUseLetter) {
			// Match letter children: parentId + single letter
			childPattern = new RegExp(
				`^${this.escapeRegex(parentId)}[a-z](?![a-z0-9])`,
			);
		} else {
			// Match number children: parentId + digits
			childPattern = new RegExp(
				`^${this.escapeRegex(parentId)}\\d+(?![a-z0-9])`,
			);
		}

		for (const file of files) {
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

		// Check if the last character is a letter or part of a number sequence
		const lastChar = hierarchyPart.charAt(hierarchyPart.length - 1);

		if (/[a-z]/.test(lastChar)) {
			// Last character is a letter, so siblings have letter suffixes
			parentId = timestamp + hierarchyPart.slice(0, -1);
			siblingPattern = new RegExp(
				`^${this.escapeRegex(parentId)}[a-z](?![a-z0-9])`,
			);
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
	private generateZettelId(): string {
		const format = this.plugin.settings.zettelIdFormat || "YYYYMMDDHHmmss";
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

		return id;
	}

	/**
	 * Builds filename based on settings (with or without title)
	 */
	private buildFilename(title: string): string {
		const { addTitleToFilename } = this.plugin.settings;

		if (addTitleToFilename) {
			return `${title}`;
		}

		return title;
	}

	/**
	 * Builds fleeting note filename based on settings
	 */
	private buildFleetingFilename(title: string): string {
		const { fleetingNotesUseZettelId, fleetingNotesFilenameFormat } =
			this.plugin.settings;

		if (fleetingNotesUseZettelId) {
			// Use zettel ID format
			return this.generateZettelId();
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
	private buildMocFilename(title: string): string {
		const { mocsUseZettelId, mocsFilenameFormat } = this.plugin.settings;

		if (mocsUseZettelId) {
			// Use zettel ID format
			return title;
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
	private buildIndexFilename(title: string): string {
		const { indexesUseZettelId, indexesFilenameFormat } =
			this.plugin.settings;

		if (indexesUseZettelId) {
			// Use zettel ID format
			return title;
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
}
