# Zettelkasten for Obsidian (BETA)

> **⚠️ BETA WARNING**: This plugin is currently in active development with frequent breaking changes. Please freeze your version number and avoid hastily updating until a stable release is announced. The codebase is undergoing significant refactoring and improvements.

Bring the powerful Luhmann Zettelkasten method to Obsidian with this comprehensive plugin. Manage interconnected atomic notes with hierarchical IDs, navigate complex note sequences, and organize your knowledge base with ease.

Inspired by [luhman-obsidian-plugin](https://github.com/Dyldog/luhman-obsidian-plugin).

**Current Version**: 0.1.4 (Beta)

## Features

### 🏷️ Zettelkasten ID System

- **Automatic ID Generation**: Create notes with Luhmann-style alternating letter/number IDs (e.g., `20231127123456a1b2`)
- **Hierarchical Structure**: Build parent-child-grandchild relationships using ID patterns
- **Flexible Prefixes**: Optional custom prefixes for different note types
- **Multiple Formats**: Support for strict, separator, and fuzzy ID matching modes

### 📊 Zettelkasten Panel (Sidebar)

- **Organized Navigation**: Left sidebar panel with customizable sections
- **Inbox Management**: Quick access to fleeting notes and ideas
- **Zettels Collection**: Browse your main zettelkasten notes
- **References**: Manage literature and reference notes
- **Projects**: Dedicated project note organization
- **Bookmarks**: Save frequently accessed files, searches, folders, and graph views
- **Workspaces**: Quick workspace switching (when enabled)
- **Active File Highlighting**: Visual indicator for currently open dashboard files

### 🔗 Note Sequences

- **Sequence View**: Visual cards showing parent notes and their children
- **Sequence Navigator**: Right sidebar panel displaying the current note's hierarchical tree
- **Quick Navigator Modal**: Keyboard-driven navigation through parent/child/sibling relationships
    - Navigate up/down/left/right through your note structure
    - Jump to previous/next sequences
    - Keyboard shortcuts: Arrow keys and Cmd+Arrow combinations
- **Sequence Reordering**: Drag-and-drop interface to reorganize note hierarchies
    - Visual indentation for multi-level structures
    - Automatic ID compaction (e.g., `a`, `c`, `aa` → `a`, `b`, `c`)
    - Hierarchical numbering display
    - Maintains complete note sequence integrity

### 📝 Note Types & Templates

- **Inbox Notes**: Capture fleeting thoughts with optional templates
    - Default mode or fleeting notes mode
    - Configurable locations and templates
    - Custom filename formats
- **Structure Notes**: MOCs (Maps of Content) or Zettelkasten Indexes
    - Switchable modes
    - Separate templates for each type
    - Optional zettel IDs
- **Reference Notes**: Literature and source material organization
- **Project Notes**: Dedicated project management notes

### 🎯 Smart Commands

- **Create Commands**: Quick note creation with templates for all note types
- **Navigation Commands**:
    - Open parent/child/sibling zettels
    - Next/previous in sequence
    - Up/down level navigation
- **Organization Commands**:
    - Assign parent/child relationships
    - Indent/outdent zettels
    - Fix zettel filenames
    - Batch operations
- **Bookmark Commands**: Bookmark active file, current search, or graph view

### 🎨 Customization

- **Panel Customization**:
    - Custom section names
    - Dashboard files for each section
    - Tag-based filtering (any/all matching)
    - Toggle file lists and icons
- **Top-Level Feature Toggles**: Enable/disable entire feature sets
    - Zettelkasten Panel
    - Note Sequences
    - Inbox
    - Structure Notes
    - Reference Notes
    - Projects
- **Folder & Template Management**: Configure locations and templates for each note type

## Installation

### Via BRAT (Recommended for Beta Testing)

1. **Install BRAT Plugin**:
    - Open Obsidian Settings
    - Go to Community Plugins
    - Search for "BRAT" (Beta Reviewer's Auto-update Tool)
    - Install and enable BRAT

2. **Add This Plugin**:
    - Open BRAT settings
    - Click "Add Beta Plugin"
    - Enter the repository URL: `YOUR_GITHUB_USERNAME/obsidian-zettelkasten`
    - Click "Add Plugin"

3. **Freeze Version (Important)**:
    - In BRAT settings, find this plugin in your list
    - **Click "Freeze Version"** to prevent automatic updates
    - This protects you from breaking changes during active development

4. **Enable the Plugin**:
    - Go to Settings → Community Plugins
    - Find "Zettelkasten" and toggle it on

### Manual Installation

1. Download the latest release files:
    - `main.js`
    - `manifest.json`
    - `styles.css`

2. Create a folder in your vault:

    ```
    YourVault/.obsidian/plugins/obsidian-zettelkasten/
    ```

3. Copy the three files into this folder

4. Reload Obsidian and enable the plugin in Settings → Community Plugins

## Getting Started

### Basic Setup

1. **Configure Zettel Location**:
    - Go to Settings → Zettelkasten
    - Set your main zettels folder path
    - Choose detection mode (folder or tag-based)

2. **Set Up the Panel** (optional):
    - Enable "Zettelkasten Panel" toggle
    - Customize section names
    - Configure dashboard files for quick access
    - Add bookmarks to frequently used files

3. **Enable Note Sequences** (optional):
    - Toggle "Note Sequences" feature
    - Enable sequence view and/or sequence navigator
    - Try the "Quick Zettelkasten Navigator" command

4. **Configure Note Types**:
    - Set up Inbox location and template
    - Configure Structure Notes (MOC or Zettelkasten mode)
    - Set up Projects and References as needed

### Creating Your First Zettel

1. Use the command palette (Cmd/Ctrl+P)
2. Type "Create Zettel"
3. Enter a title
4. Your note is created with a timestamp-based ID

### Building Note Sequences

1. Create a parent zettel
2. From within it, use "Create Child Zettel" command
3. This creates a note with ID like `parent-id + a`
4. Create more children - they automatically get `b`, `c`, etc.
5. From a child, create another child to go deeper (e.g., `a1`, `a2`)

### Using the Reorder Modal

1. Open any note in a sequence
2. Run "Reorder Note Sequence" command
3. Drag and drop to reorder notes
4. Use arrow buttons to indent/outdent (change parent)
5. Toggle "Compact IDs" to compress gaps
6. Click "Save Order" to apply changes

## Key Concepts

### Zettelkasten ID Structure

IDs alternate between letters and numbers:

- Parent: `20231127123456`
- Children: `...a`, `...b`, `...c`, ..., `...z`, `...aa`, `...ab`, etc.
- Grandchildren: `...a1`, `...a2`, `...a3`, etc.
- Great-grandchildren: `...a1a`, `...a1b`, etc.

Notes with the same type of suffix are siblings:

- `a`, `b`, `aa`, `ac` are all siblings (all letters)
- `a1`, `a2`, `a12` are all siblings (all numbers)

### ID Compaction

The reorder feature includes automatic ID compaction:

- Gaps are filled: `a`, `c`, `f` → `a`, `b`, `c`
- Multi-letter IDs are compressed: `a`, `b`, `aa` → `a`, `b`, `c`
- Full hierarchy is maintained: children and descendants are updated

## Tips & Best Practices

1. **Start Simple**: Enable just the core zettelkasten features first
2. **Use Templates**: Set up note templates for consistent formatting
3. **Tag Strategically**: Use tags with panel filtering for powerful organization
4. **Dashboard Files**: Create dashboard notes for each panel section to provide context
5. **Freeze Updates**: During beta, always freeze your BRAT version before updating
6. **Backup Regularly**: The plugin modifies filenames - **ALWAYS KEEP REGULAR BACKUPS OF YOUR VAULT**.

## Known Issues & Limitations

- Plugin is in active beta development
- Breaking changes may occur between versions
- Some features may have undiscovered edge cases

## Roadmap

- Stable v1.0 release
- Note Sequence Bases View
- Additional visualization options
- Enhanced search and filtering
- Performance optimizations
- Community plugin store release (post-beta)

## Support & Feedback

- **Issues**: Report bugs via GitHub Issues
- **Feature Requests**: Submit via GitHub Discussions
- **Author**: Kieran Mansfield
- **Website**: [kieranmansfield.com](https://kieranmansfield.com)

## License

MIT License - See LICENSE file for details

---

**Remember**: This is beta software. **_ALWAYS BACK UP YOUR VAULT REGULARLY!!_** Be sure to freeze your version in BRAT and update cautiously!
