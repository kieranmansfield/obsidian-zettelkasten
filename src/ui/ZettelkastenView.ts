import { ItemView, WorkspaceLeaf, TFolder, TFile, setIcon, getAllTags } from "obsidian";
import type ZettelkastenPlugin from "../../main";

export const VIEW_TYPE_ZETTELKASTEN = "zettelkasten-view";

interface MenuItem {
	name: string;
	icon: string;
	folderName: string;
	dashboardPath?: string;
	filterTags?: string[];
}

export class ZettelkastenView extends ItemView {
	private collapsedSections: Set<string> = new Set();
	plugin: ZettelkastenPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: ZettelkastenPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_ZETTELKASTEN;
	}

	getDisplayText(): string {
		return "Zettelkasten";
	}

	getIcon(): string {
		return "square-library";
	}

	async onOpen(): Promise<void> {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass("zettelkasten-view");

		const menuItems: MenuItem[] = [
			{
				name: "Inbox",
				icon: "inbox",
				folderName: this.plugin.settings.inboxLocation || "Inbox",
				dashboardPath: this.plugin.settings.panelInboxDashboard,
				filterTags: this.plugin.settings.panelInboxFilterTags
			},
			{
				name: "Zettels",
				icon: "file-text",
				folderName: this.plugin.settings.zettelsLocation || "Zettels",
				dashboardPath: this.plugin.settings.panelZettelsDashboard,
				filterTags: this.plugin.settings.panelZettelsFilterTags
			},
			{
				name: "References",
				icon: "book-open",
				folderName: this.plugin.settings.referenceLocation || "References",
				dashboardPath: this.plugin.settings.panelReferencesDashboard,
				filterTags: this.plugin.settings.panelReferencesFilterTags
			},
		];

		menuItems.forEach((item) => {
			this.createMenuItem(container, item);
		});

		// Add Bookmarks section
		this.createBookmarksMenuItem(container);
	}

	private createBookmarksMenuItem(container: HTMLElement): void {
		const itemEl = container.createDiv({ cls: "zk-menu-item" });

		// Header with icon and name
		const headerEl = itemEl.createDiv({ cls: "zk-menu-header" });

		// Collapse icon
		const collapseIconEl = headerEl.createDiv({ cls: "zk-collapse-icon" });
		const isCollapsed = this.collapsedSections.has("Bookmarks");
		setIcon(collapseIconEl, isCollapsed ? "chevron-right" : "chevron-down");

		// Item icon
		const iconEl = headerEl.createDiv({ cls: "zk-menu-icon" });
		setIcon(iconEl, "bookmark");

		// Item name
		headerEl.createDiv({
			cls: "zk-menu-name",
			text: "Bookmarks"
		});

		// Content area (collapsible)
		const contentEl = itemEl.createDiv({ cls: "zk-menu-content" });
		if (isCollapsed) {
			contentEl.style.display = "none";
		}

		// Add click handler to header (only toggle collapse for bookmarks)
		headerEl.addEventListener("click", async (e) => {
			e.stopPropagation();

			const isCurrentlyCollapsed = this.collapsedSections.has("Bookmarks");

			if (isCurrentlyCollapsed) {
				this.collapsedSections.delete("Bookmarks");
				contentEl.style.display = "block";
				setIcon(collapseIconEl, "chevron-down");
			} else {
				this.collapsedSections.add("Bookmarks");
				contentEl.style.display = "none";
				setIcon(collapseIconEl, "chevron-right");
			}
		});

		// Display bookmarks
		this.displayBookmarks(contentEl);
	}

	private displayBookmarks(container: HTMLElement): void {
		const bookmarks = this.plugin.settings.panelBookmarks;

		if (bookmarks.length === 0) {
			container.createDiv({
				cls: "zk-no-files",
				text: "No bookmarks yet"
			});
			return;
		}

		bookmarks.forEach((bookmark) => {
			const bookmarkContainer = container.createDiv({
				cls: "zk-bookmark-item"
			});

			// Icon based on type
			const iconEl = bookmarkContainer.createDiv({
				cls: "zk-bookmark-icon"
			});

			let iconName = "file";
			switch (bookmark.type) {
				case "file":
					iconName = "file-text";
					break;
				case "search":
					iconName = "search";
					break;
				case "graph":
					iconName = "git-branch-plus";
					break;
				case "folder":
					iconName = "folder";
					break;
			}
			setIcon(iconEl, iconName);

			// Title
			const titleEl = bookmarkContainer.createDiv({
				text: bookmark.title
			});

			bookmarkContainer.addEventListener("click", async () => {
				await this.handleBookmarkClick(bookmark);
			});
		});
	}

	private async handleBookmarkClick(bookmark: {
		type: "file" | "search" | "graph" | "folder";
		path?: string;
		title: string;
		query?: string;
	}): Promise<void> {
		switch (bookmark.type) {
			case "file":
				if (bookmark.path) {
					const file = this.app.vault.getAbstractFileByPath(bookmark.path);
					if (file instanceof TFile) {
						await this.app.workspace.getLeaf(false).openFile(file);
					}
				}
				break;

			case "search":
				if (bookmark.query) {
					// Open search view with the query
					const searchLeaf = this.app.workspace.getLeavesOfType("search")[0];
					if (searchLeaf) {
						this.app.workspace.revealLeaf(searchLeaf);
						// @ts-ignore - accessing internal API
						searchLeaf.view.setQuery(bookmark.query);
					}
				}
				break;

			case "graph":
				// Open graph view
				this.app.workspace.getLeaf(false).setViewState({
					type: "graph",
					active: true,
				});
				break;

			case "folder":
				if (bookmark.path) {
					const folder = this.app.vault.getAbstractFileByPath(bookmark.path);
					if (folder instanceof TFolder) {
						// Reveal folder in file explorer
						// @ts-ignore - accessing internal API
						this.app.workspace.getLeavesOfType("file-explorer")[0]?.view.revealInFolder(folder);
					}
				}
				break;
		}
	}

	private createMenuItem(container: HTMLElement, item: MenuItem): void {
		const itemEl = container.createDiv({ cls: "zk-menu-item" });

		// Header with icon and name
		const headerEl = itemEl.createDiv({ cls: "zk-menu-header" });

		// Collapse icon
		const collapseIconEl = headerEl.createDiv({ cls: "zk-collapse-icon" });
		const isCollapsed = this.collapsedSections.has(item.name);
		setIcon(collapseIconEl, isCollapsed ? "chevron-right" : "chevron-down");

		// Item icon
		const iconEl = headerEl.createDiv({ cls: "zk-menu-icon" });
		setIcon(iconEl, item.icon);

		// Item name
		headerEl.createDiv({
			cls: "zk-menu-name",
			text: item.name
		});

		// Content area (collapsible)
		const contentEl = itemEl.createDiv({ cls: "zk-menu-content" });
		if (isCollapsed) {
			contentEl.style.display = "none";
		}

		// Add click handler to header to open index file
		headerEl.addEventListener("click", async (e) => {
			e.stopPropagation();

			// If clicking on the collapse icon, toggle collapse
			if (e.target === collapseIconEl || collapseIconEl.contains(e.target as Node)) {
				const isCurrentlyCollapsed = this.collapsedSections.has(item.name);

				if (isCurrentlyCollapsed) {
					this.collapsedSections.delete(item.name);
					contentEl.style.display = "block";
					setIcon(collapseIconEl, "chevron-down");
				} else {
					this.collapsedSections.add(item.name);
					contentEl.style.display = "none";
					setIcon(collapseIconEl, "chevron-right");
				}
			} else {
				// Otherwise open the index file
				await this.openIndexFile(item);
			}
		});

		// Display folder contents with filter tags
		this.displayFolderContents(contentEl, item);
	}

	private async openIndexFile(item: MenuItem): Promise<void> {
		// Use dashboard path if specified, otherwise try default paths
		let filePath = item.dashboardPath;

		if (!filePath) {
			// Fallback to old logic
			const folderBasename = item.folderName.split('/').pop() || item.folderName;
			filePath = `${item.folderName}/${folderBasename}.md`;
		}

		const file = this.app.vault.getAbstractFileByPath(filePath);

		if (file instanceof TFile) {
			await this.app.workspace.getLeaf(false).openFile(file);
		} else {
			console.log("ZK Panel - Dashboard file not found:", filePath);
		}
	}

	private async displayFolderContents(container: HTMLElement, item: MenuItem): Promise<void> {
		const folder = this.app.vault.getAbstractFileByPath(item.folderName);

		console.log("ZK Panel - Looking for folder:", item.folderName);

		if (!(folder instanceof TFolder)) {
			console.log("ZK Panel - Folder not found:", item.folderName);
			container.createDiv({
				cls: "zk-no-folder",
				text: "Folder not found"
			});
			return;
		}

		// Get the default folder note name for fallback exclusion
		const folderBasename = item.folderName.split('/').pop() || item.folderName;
		const excludeFileName = `${folderBasename}.md`;

		console.log("ZK Panel - Excluding file:", excludeFileName);

		// Get all files in folder (recursively)
		const files = this.getFilesInFolder(folder);

		console.log("ZK Panel - Files before filter:", files.map(f => f.basename));

		// Filter files by tags if specified (only if tags array is not empty)
		let filteredFiles = files;
		if (item.filterTags && item.filterTags.length > 0) {
			filteredFiles = await this.filterFilesByTags(files, item.filterTags);
		}
		// If no tags specified, show all files

		// Exclude the dashboard file if it exists
		if (item.dashboardPath) {
			const dashboardFileName = item.dashboardPath.split('/').pop() || '';
			filteredFiles = filteredFiles.filter(file => file.name !== dashboardFileName);
		} else {
			// Fallback: exclude the folder note
			filteredFiles = filteredFiles.filter(file => file.name !== excludeFileName);
		}

		console.log("ZK Panel - Files after exclusion:", filteredFiles.map(f => f.basename));

		if (filteredFiles.length === 0) {
			container.createDiv({
				cls: "zk-no-files",
				text: "No files found"
			});
			return;
		}

		// Display files
		filteredFiles.forEach(file => {
			const displayName = this.cleanFileName(file.basename);
			const fileEl = container.createDiv({
				cls: "zk-file-link",
				text: displayName
			});

			fileEl.addEventListener("click", async () => {
				await this.app.workspace.getLeaf(false).openFile(file);
			});
		});
	}

	private cleanFileName(filename: string): string {
		// Remove emoji prefix (any emoji at the start followed by space)
		// This regex matches emoji characters and removes them if at the start
		let cleaned = filename.replace(/^[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier_Base}\p{Emoji_Component}]+\s*/gu, '');

		// Also remove common emoji patterns like "📝 " or similar
		cleaned = cleaned.replace(/^[\u{1F300}-\u{1F9FF}]\s*/u, '');

		return cleaned;
	}

	private getFilesInFolder(folder: TFolder): TFile[] {
		const files: TFile[] = [];

		for (const child of folder.children) {
			if (child instanceof TFile && child.extension === "md") {
				files.push(child);
			} else if (child instanceof TFolder) {
				files.push(...this.getFilesInFolder(child));
			}
		}

		return files;
	}

	private async filterFilesByTags(files: TFile[], tags: string[]): Promise<TFile[]> {
		const filteredFiles: TFile[] = [];
		const matchMode = this.plugin.settings.panelTagMatchMode;

		console.log("ZK Panel - Filter tags:", tags);
		console.log("ZK Panel - Match mode:", matchMode);
		console.log("ZK Panel - Total files to filter:", files.length);

		for (const file of files) {
			const cache = this.app.metadataCache.getFileCache(file);
			if (!cache) {
				console.log("ZK Panel - No cache for:", file.path);
				continue;
			}

			const fileTags = getAllTags(cache);
			console.log("ZK Panel - File:", file.basename, "Tags:", fileTags);

			if (!fileTags) continue;

			let matches = false;

			if (matchMode === "all") {
				// ALL tags must match (AND)
				matches = tags.every(tag => {
					const normalizedTag = tag.startsWith("#") ? tag : `#${tag}`;
					return fileTags.includes(normalizedTag);
				});
			} else {
				// ANY tag matches (OR) - default
				matches = tags.some(tag => {
					const normalizedTag = tag.startsWith("#") ? tag : `#${tag}`;
					return fileTags.includes(normalizedTag);
				});
			}

			if (matches) {
				console.log("ZK Panel - Match found! File:", file.basename);
				filteredFiles.push(file);
			}
		}

		console.log("ZK Panel - Filtered files count:", filteredFiles.length);
		return filteredFiles;
	}

	async onClose(): Promise<void> {
		// Cleanup if needed
	}
}
