# Bugfix plan — obsidian-zettelkasten v0.1.20

Found on 2026-10-05 during a read-through of `src/` at commit `de9c40e` (tag `0.1.20`, clean tree). Items marked **Reproduced** were executed against the plugin's own modules with fake `TFile`s. Written for an AI agent (or developer) to execute.

The plugin is **in daily use** in the owner's main vault, so the sequence-editing commands (indent, outdent, assign parent/child) are currently unsafe. Work packages 1–5 fix that.

> **Executor instructions**
>
> - Read this whole file first. Do the work packages **in order**; later ones depend on earlier ones.
> - Write tests **first** for each package (they should fail), then fix until they pass.
> - One conventional commit per work package (e.g. `fix(sequences): natural zettel id ordering`).
> - Run each package's **Verify** steps before moving on. If a **STOP condition** triggers, stop and report.
> - Do **not** bump the version, tag, publish, push or open a PR unless the operator asks.
> - **Never touch the owner's real vault** (`~/Obsidian/ZK2026`): don't use it for fixtures, don't copy builds into it, and don't run commands against it. Manual checks happen only in the dev vault this repo lives in (`~/Developer/obsidian-plugins`).
> - Update the status table as you go (`DONE`, `SKIPPED — reason`, `BLOCKED — reason`).

## Drift check (run first)

```sh
git log --oneline de9c40e..HEAD -- src/
```

If any file named below changed, re-read it and confirm the bug still exists before fixing it.

## Changes since `de9c40e` (branch `zettelkasten-compliance`, 2026-10-22)

Restructure for the strict Zettelkasten skill. Line numbers in packages 1–4 and 6 are stale for these files; re-read before fixing:

- Boxes removed (`BoxService`, `BoxManager`, box modals, `open-box-palette`); zettels always go to `zettel.defaultFolder` (default `slipbox`, was `slip-box` before `75a0ff8`).
- `assignParent`, `assignChild`, `indentZettel`, `outdentZettel` rewritten onto `src/base/sequenceEdit.ts` and `src/ui/ZettelSelectorModal.ts`.
- `createIndexNote` makes structure notes; `openIndex` opens `slipbox/Index.md`; `OpenIndexModal` and `CreateZettelFuzzyModal` deleted.
- `SettingsManager.load` runs `migrateToSlipBox` before the merge (package 7 still applies to `migrate()`).

## Baseline (2026-10-05)

- `./node_modules/.bin/tsc -noEmit -skipLibCheck` → exit 0
- `./node_modules/.bin/eslint .` → exit 0
- **No test runner and no tests.** Package 0 adds them.

## Commands

| Purpose                 | Command                                         | Expected                                                                    |
| ----------------------- | ----------------------------------------------- | --------------------------------------------------------------------------- |
| Install                 | `pnpm install`                                  | exit 0                                                                      |
| Typecheck               | `./node_modules/.bin/tsc -noEmit -skipLibCheck` | exit 0                                                                      |
| Tests (after package 0) | `pnpm test`                                     | all pass                                                                    |
| Lint (check only)       | `pnpm exec eslint .`                            | exit 0. **Don't** use `pnpm lint`; it runs `--fix`                          |
| Build                   | `pnpm build`                                    | exit 0. Writes `main.js` into this dev-vault plugin folder; that's expected |

## Status

| #   | Work package                                                      | Priority | Effort | Status |
| --- | ----------------------------------------------------------------- | -------- | ------ | ------ |
| 0   | Test harness (Vitest) and characterisation tests                  | —        | S      | DONE — `pnpm test` (vitest 5), tests next to modules; fake TFiles allowed in `*.test.ts` by eslint override |
| 1   | One ID parser, natural ordering, segment-based hierarchy          | P1       | M      | DONE — `src/base/zettelIdOrder.ts`; core indexes children once; `totalNotes` fixed (`0abdd65`) |
| 2   | Free-ID allocation                                                | P1       | S      | DONE — `nextFreeChildId` (vault-wide, max + 1, no gap refill) |
| 3   | Link-safe, extension-safe renames and one filename builder        | P1       | M      | DONE — `FileService.rename` adds the extension only when missing, `normalizePath`, `fileManager.renameFile`; zettel renames keep the filename title, then frontmatter (`a0c3f8e`) |
| 4   | Subtree moves for indent / outdent / assign parent / assign child | P1       | L      | DONE — `planSubtreeMove`/`planMoveUnder` + `moveUnder` (`src/base/sequenceEdit.ts`), confirm modal, stop on first failure; verified live in the dev vault (`bbf70ca`) |
| 5   | Create files with `vault.create`                                  | P1       | S      | DONE — `vault.create` (throws on existing path), root folder treated as existing, `cachedRead`, unused `write` removed (`a0c3f8e`); verified live |
| 6   | Folder-scope boundary checks                                      | P2       | S      | DONE — `isInFolder` (also treats `/` as root, which `file.parent.path` returns) at every call site (`a0c3f8e`) |
| 7   | Settings migration: semver comparison                             | P2       | S      | DONE — `compareSemver` (`964cdbd`) |
| 8   | Template placeholder replacement                                  | P2       | S      | DONE — `fillTemplate` (`src/base/fileHelpers.ts`) replaces every `{{title}}` and `{{date}}` in all create commands; default templates keep `{{title}}` out of frontmatter |
| 9   | `removeCommand`, and the view-type constant                       | P3       | S      | DONE — `removeCommand(id)` with the unprefixed ID works live; `reloadAll` stub and reload notices removed; view constant imported (`fc48cb6`) |
| 10  | Vault-specific local storage                                      | P3       | S      | DONE — `app.load/saveLocalStorage`, old global key read once as fallback; verified live (`a8cd3a1`) |
| 11  | Docs                                                              | P3       | S      | DONE — AGENTS.md canonical, CLAUDE.md is `@AGENTS.md`; settings/commands READMEs updated; `SETTINGS-INTEGRATION.md` removed as obsolete; typos and package.json fixed (`1030f66`) |
| 12  | Repo hygiene (**operator decision**)                              | P3       | S      | DONE — operator approved; removed with config ignores (`fcf38cf`) |

## Domain rules (the specification for packages 1, 2 and 4)

- **ID** = 17-digit timestamp `YYYYMMDDHHmmssSSS` + segments. A filename may have an optional lowercase prefix and text after the ID.
- **Segments alternate by index**: index 0 is letters, index 1 numbers, index 2 letters, and so on. This matches `ZettelId.nextSegmentforDepth`.
- **Segment ordinals**: numbers use their value (`1`, `2`, …, `10`); letters use bijective base 26 (`a`=1 … `z`=26, `aa`=27, `ab`=28). This matches `incrementSegment` (`z → aa`).
- **Parent** = same timestamp, segments minus the last one. **Child** = exactly one more segment, with the parent's segments as an element-wise prefix. **Descendant** = longer, with the same element-wise prefix. String prefixes are never enough: `a10` is a sibling of `a1`, not its child.
- **Order** = timestamp, then segment by segment by ordinal; a shorter ID (the parent) sorts before its extensions.
- **IDs are unique per vault.** Allocation and collision checks must look at every zettel in the vault, not just the current folder.

---

## 0. Test harness and characterisation tests

1. `pnpm add -D vitest@^5.0.1` (same version as the owner's other plugins). Add `"test": "vitest run"` to `package.json` scripts. No config file is needed; put tests next to their modules as `src/**/*.test.ts`.
2. Testable modules may import **types only** from `obsidian` (`import type …`). The `obsidian` npm package has no runtime code, so anything importing `Notice`, `TFile` (as a value) or `normalizePath` can't run under Vitest. Keep that glue in the command and service files.
3. Fake files for tests: `const f = (id: string) => ({ basename: id, path: \`Z/${id}.md\`, extension: 'md', stat: { mtime: 0 } }) as unknown as TFile`.
4. Write **characterisation tests that pass today** for `ZettelId`: `parse`/`toString` round-trip, `nextChild` (`T → Ta`, `Ta → Ta1`), `incrementSegment` (`9 → 10`, `z → aa`, `az → ba`). Also cover `NoteSequenceCore.calculateLevel` (`Ta10 → 2`) and `getParentId` (`Ta10 → Ta`).

**Verify:** `pnpm test` passes; the typecheck and lint commands above still exit 0.

---

## 1. One ID parser, natural ordering, segment-based hierarchy — P1 (Reproduced)

**Where:**

- `src/core/noteSequence.class.ts`: `isDirectChild` (110-126), `findChildren` (156-188), `buildNodeChildren` sort (276), `buildMetadata` (293-320), `findAllRoots` sort (352-356).
- `src/core/zettelId.class.ts`: `compare` (42-50).
- Basename `localeCompare` sorts at `src/commands/indentZettel.ts:54,61`, `outdentZettel.ts:72,79`, `nextChild.ts:56`, `nextSibling.ts:49,69`, `nextSequence.ts:57` and `src/ui/SequenceNavigatorModal.ts:73,86,113`.
- Other ID detectors: `ZettelId.isZettelIdString` (length ≥ 17, unused) and `getZettelFiles` in `src/commands/createZettelNote.ts:75-90` (`^\d{17}`).

**Problem:** hierarchy and ordering are computed on raw strings. Reproduced with `T` plus `a`, `b`, `a1`…`a10`:

```text
children of a   a1 a10 a2 a3 … a9       ← lexical order
children of a1  a10                     ← a10 is a sibling, not a child
compare(a10, a2) = -1                   ← a10 sorts first
sort(b, z, aa)  = aa b z                ← aa sorts before b
totalNotes      = 15 for 13 files       ← root counted twice, plus the duplicated a10
```

**Fix:**

1. Add a pure module, e.g. `src/base/zettelIdOrder.ts` (types-only imports), containing:
   - `parseZettelBasename(basename) → { prefix, id, timestamp, segments } | null`, using the current `extractZettelId` regex plus segment splitting.
   - `segmentOrdinal(seg)` and `ordinalToSegment(n, kind: 'letter' | 'number')`.
   - `compareZettelIds(a, b)`, implementing the order rule above.
   - `isChildOf(child, parent)` and `isDescendantOf(child, ancestor)`, element-wise on segments.
2. Make `NoteSequenceCore` use it everywhere, **keeping its public method signatures** (the views and commands call them): `isDirectChild`, `findChildren` (filter and sort), `buildNodeChildren` sort, `findAllRoots` sort (most recent first = reverse of `compareZettelIds`).
3. **Index once:** in `buildSequence`/`findAllSequences`, parse every file once and build `Map<parentId, files[]>`. This replaces the per-node rescans of all files, which are O(N²) with a regex run per file per node.
4. `buildMetadata`: count each node once, `totalNotes = 1 + (descendant count)` whether or not `includeRoot` is set.
5. Make `ZettelId.compare` delegate to `compareZettelIds`. Delete the unused `isZettelIdString`, or reduce it to the parser.
6. Replace every `basename.localeCompare` sort of zettels listed above with an ID comparison: parse the ID, then `compareZettelIds`. Make `getZettelFiles` use the parser.

**Tests:** using the fixture above, assert:

- `children(a)` = `a1 … a10` in natural order, and `children(a1)` = `[]`
- `aa` is a child of the root (a sibling of `a`)
- `compareZettelIds(Ta2, Ta10) < 0`, `(Tz, Taa) < 0`, `(Tb, Taa) < 0`, `(Ta, Ta1) < 0`
- `totalNotes` = 13

**Verify:** `pnpm test` and typecheck pass. In the dev-vault playground, the sequences view and navigator list `a2` before `a10`.

---

## 2. Free-ID allocation — P1 (Reproduced)

**Where:** ID choice in `src/commands/indentZettel.ts:86-109`, `outdentZettel.ts:90-96`, `assignParent.ts:113-135` and `assignChild.ts:105-126`.

**Problem:** IDs are picked without checking whether they're free.

- Indent searches for the previous sibling's children _inside a siblings-only list_, never finds any, and always picks the first child ID. Reproduced: `b` under `a` → `a1`, which already exists.
- Outdent uses `parent.nextSibling()` unchecked.
- Assign picks "last child + 1" from a lexically sorted list, so with 10 or more children `a9 + 1 = a10`, which exists. This is the open task in the owner's notes: "check the entire sequence for any available ids".

**Fix:** in the pure module, add `nextFreeChildId(parentId, existingIds) → id`. It finds the parent's existing **children** across the whole vault and returns `parent + ordinalToSegment(max ordinal + 1, kind for that depth)`; with no children, the first child (`a` or `1`). Gaps are **not** refilled (always max + 1). All four commands use it in package 4.

**Tests:**

- `nextFreeChildId(Ta, [Ta1…Ta10]) = Ta11`
- `nextFreeChildId(T, [Ta, Tb]) = Tc`
- `nextFreeChildId(T, [Ta…Tz]) = Taa`
- `nextFreeChildId(Ta, []) = Ta1`
- `nextFreeChildId(Ta, [Ta1, Ta3]) = Ta4`
- Grandchildren don't count: `nextFreeChildId(Ta, [Ta1, Ta1a]) = Ta2`

---

## 3. Link-safe, extension-safe renames and one filename builder — P1 (Reproduced)

**Where:** `src/service/file.service.ts:69-86` (`rename`) and all callers. The callers pass `newName` inconsistently: `indentZettel.ts:119` and `outdentZettel.ts:106` without `.md`; `assignParent.ts:161`, `assignChild.ts:154` and `core/{zettel,index,literature,fleeting}Note.class.ts` with `.md`. The filename-building logic is duplicated in each command.

**Problems:**

1. **Extension dropped (Reproduced).** `rename` puts `newName` straight into the path. Indent and outdent pass no extension, so `Z/…b ⁝ Title.md` becomes `Z/…a1 Title`, which Obsidian no longer treats as a note.
2. **Links not updated.** `vault.rename` doesn't update links; `app.fileManager.renameFile` does, following the user's setting. Every indent, outdent and assign currently breaks links to the moved note, and with ID-only filenames that's every `[[ID]]` link.
3. **Filename format ignored.** Indent and outdent build `${id} ${title}` from the frontmatter `title`, even in ID-only mode, without the separator. Without a `title` property they drop the title portion.

**Fix:**

1. `FileService.rename`: keep the `FileRenameInput` shape, but only append `.${file.extension}` when `newName` doesn't already end with it. Don't detect "has an extension" with a regex, because titles can contain dots. Build the path with `normalizePath(\`${file.parent?.path ?? ''}/${name}\`)`and call`await this.app.fileManager.renameFile(file, path)`.
2. Pure `buildZettelBasename(id, title, { filenameFormat, separator })`:
   - ID-only → `id`
   - ID + title → `${id} ${separator} ${title}`, or just `id` when the title is empty
3. Pure `titleFromBasename(basename, separator)` returns the existing title part, i.e. the text after the separator. In ID + title mode, the title is taken from the current filename first, then the frontmatter `title`, then empty.

**Tests:** for the two pure functions, covering both formats, empty titles, titles containing dots, and titles containing the separator character.

**Verify:** typecheck and tests pass. In the dev vault, renaming a note through any command keeps `.md`, and a note linking to it shows the updated link.

---

## 4. Subtree moves for indent / outdent / assign parent / assign child — P1

**Where:** `src/commands/indentZettel.ts`, `outdentZettel.ts`, `assignParent.ts` and `assignChild.ts`.

**Problem:** only the active file is renamed, so its descendants keep the old prefix and drop out of the sequence. A move also **can't be a string-prefix replace**. Indent and outdent change depth by 1, and assign can change it by any amount. When the depth parity changes, every descendant segment has to switch kind (letter ↔ number) while keeping its ordinal. Otherwise IDs merge: moving `Tb` to `Ta11` would turn child `Tb1` into `Ta111`, which parses as a _sibling_ of `Ta11`.

**Fix:**

1. Pure planner `planSubtreeMove(allZettels, fromId, toId) → { renames: Array<{ path, oldId, newId }>, conflicts: string[] }`.
   - The subtree is `fromId` plus all its descendants (package 1 rules), searched across the **whole vault**.
   - Each descendant keeps its segments _relative_ to `fromId`. Each relative segment is re-emitted at its new absolute index with `ordinalToSegment(segmentOrdinal(seg), kind for that index)`.
   - `conflicts` lists target IDs already used by files **outside** the subtree.
2. Validation, before any rename:
   - The target parent can't be the moving note or one of its descendants (assign parent/child: "can't make a note a child of its own descendant").
   - `conflicts` must be empty.
   - Outdenting a direct child of a root keeps its current behaviour: refuse, with a clear Notice.
3. ID choice, using `nextFreeChildId` from package 2:
   - **Indent:** the new parent is the _previous sibling_ in natural order. For a root, that's the previous root among the roots in scope.
   - **Outdent:** `nextFreeChildId(grandparent)`, which **appends at the end of the parent's level**. Say so in the Notice. True "insert directly after the parent" would mean renumbering the following siblings, which is out of scope (see STOP).
   - **Assign parent / assign child:** `nextFreeChildId(chosen parent)`.
4. When more than one file will be renamed, show a confirmation modal listing `old → new` first. On confirm, rename sequentially through `FileService.rename` with filenames from package 3. On the first failure, stop and show a Notice saying which renames finished and which didn't. Log the plan to the console.

**Tests** for `planSubtreeMove` and the validation:

- Indent `Tb` (with `Tb1`, `Tb1a`) under `Ta` (with `Ta1…Ta10`) → `Tb → Ta11`, `Tb1 → Ta11a`, `Tb1a → Ta11a1`
- Outdent `Ta1a` (with `Ta1a1`), where `Ta` has `Ta1…Ta10` → `Ta1a → Ta11`, `Ta1a1 → Ta11a`
- Assigning `Ta` as a child of `Ta1` is rejected (it would be its own descendant)
- A stray existing `Ta11a` is reported in `conflicts`

**Verify:**

- `pnpm test`, typecheck and lint pass.
- **Dev vault only:** make a fixture folder (e.g. `ZK Fixtures/`) of notes named like the tests, using whatever filename format the dev vault's plugin settings use, plus one note that links to `…b1`. Reload the plugin (with the Obsidian CLI if available, otherwise mark this as an operator step) and run each command. Expect:
  - the renames shown in the tests
  - every file still `.md`
  - the link updated
  - no duplicate IDs

**STOP if:** the operator wants outdent to insert directly after the parent (renumbering), or wants an undo or rollback feature. Both are design decisions.

---

## 5. Create files with `vault.create` — P1

**Where:** `src/service/file.service.ts:40-64`.

**Problem:** `create` writes with `vault.adapter.write`, which **silently overwrites** an existing file at the same path, then looks the file up straight away. The vault may not have indexed it yet, so the lookup can return `null` and throw "Failed to create file". `ensureFolder` is also called twice.

**Fix:**

- Use `const file = await this.vault.create(normalizePath(\`${folder}/${filename}.${ext}\`), content)`. It returns the `TFile`and throws if the path exists; surface that as a Notice through the caller's existing`catch`.
- Call `ensureFolder` once. Treat the root folder (`''`) as existing.
- Optional, same package: `read` → `vault.read`/`cachedRead`, and `write` → `vault.modify` (or `vault.process`).

**Verify:** typecheck passes. In the dev vault, creating a zettel works and creating one at a path that already exists shows an error instead of overwriting.

---

## 6. Folder-scope boundary checks — P2

**Where:**

- `src/service/noteSequence.service.ts`: lines 36, 59, 94, 141, 213 and 230.
- `src/commands/nextSequence.ts:45`
- `src/ui/NoteSequencesBasesView.ts:74`

**Problem:** `path.startsWith(folder)` has no trailing slash, so the folder `Notes` also matches `Notes Archive/…`.

**Fix:**

- Add a pure `isInFolder(path, folder)`: true when `folder === ''`, otherwise `path.startsWith(folder + '/')`.
- Use it at every call site. Keep the current "this folder **and its subfolders**" meaning.
- ID allocation and collision checks (packages 2 and 4) stay vault-wide on purpose.

**Tests:** `isInFolder('Notes Archive/x.md', 'Notes') === false`, `isInFolder('Notes/x.md', 'Notes') === true`, `isInFolder('x.md', '') === true`.

---

## 7. Settings migration: semver comparison — P2 (Reproduced)

**Where:** `src/settings/SettingsManager.ts:375-391` (`migrate`).

**Problem:** `currentVersion < '0.1.4'` compares strings, and `'0.1.10' < '0.1.4'` is `true`. This is latent today because the stored version is `0.1.4`, but any future bump past `0.1.9` would be "downgraded" and re-saved on every load.

**Fix:** a pure `compareSemver(a, b)` that splits on `.` and compares numerically, used as `compareSemver(currentVersion ?? '0.0.0', '0.1.4') < 0`.

**Tests:** `compareSemver('0.1.10', '0.1.4') > 0`, `compareSemver('0.1.4', '0.1.4') === 0`, `compareSemver('0.0.9', '0.1.0') < 0`.

---

## 8. Template placeholder replacement — P2

**Where:** `src/commands/createZettelNote.ts:48`. Check the other `create*Note` commands for the same `.replace('{{title}}'`.

**Problem:** `.replace('{{title}}', title)` only replaces the **first** placeholder.

**Fix:** `replaceAll('{{title}}', title)`. Quoting a title inserted into YAML (e.g. `title: "Note: thoughts"`) is out of scope. Mention it in the report if a default template puts `{{title}}` inside frontmatter.

---

## 9. `removeCommand`, and the view-type constant — P3

**Where:** `src/commands/CommandRegistry.ts:125-156`; `src/commands/manageBookmarks.ts:49, 142`.

**Problem:** disabling a command waits for a reload, citing "Obsidian doesn't provide removeCommand()". `Plugin.removeCommand(id)` has been public since Obsidian 1.7.2, and the minimum here is 1.13.0. Separately, `'zettelkasten-view'` is hard-coded instead of importing `VIEW_TYPE_ZETTELKASTEN`.

**Fix:**

- In `disableCommand`, call `this.plugin.removeCommand(commandId)`, then mark the command disabled. Check in the command palette that it disappears. If it doesn't, the method may expect the prefixed ID (`${manifest.id}:${id}`); report which one worked.
- Delete the empty `reloadAll` stub.
- Import the view-type constant in `manageBookmarks.ts`. **Don't** change its value: saved workspaces reference `'zettelkasten-view'`.

---

## 10. Vault-specific local storage — P3

**Where:** `src/ui/ZettelkastenSidebar.ts:47-75`.

**Problem:** collapsed sections are stored with `window.localStorage` under the fixed key `obsidian-zettelkasten.collapsedSections`, so every vault shares them.

**Fix:** use `this.app.loadLocalStorage(key)` and `this.app.saveLocalStorage(key, value)` (vault-specific, since 1.8.7). On first load, if the vault-specific value is empty, read the old global key once.

---

## 11. Docs — P3

1. **Wrong ID format.** `CLAUDE.md:27-40` and `AGENTS.md:30-43` describe it as `20240612T1530a1b2`. Replace that with the real 17-digit `YYYYMMDDHHmmssSSS` plus alternating segments, and add the domain rules above.
2. **Two agent files.** `CLAUDE.md` and `AGENTS.md` are near-duplicates (15 lines differ). Make `AGENTS.md` the canonical file and reduce `CLAUDE.md` to the single line `@AGENTS.md` (Claude Code's import syntax).
3. **Out-of-date settings docs.** `src/commands/SETTINGS-INTEGRATION.md` ("Known Limitations", and the `display()` examples) and `src/settings/README.md` (`display()` examples) predate the declarative settings tab and `removeCommand`. Update them to match the code.
4. **Small fixes:**
   - The title typo "Zettelaksten" in `CLAUDE.md`
   - The error-message typo "myst" in `src/core/zettelId.class.ts:20`
   - `package.json` `description` ("This is a sample plugin…") and the empty `author`

---

## 12. Repo hygiene — P3, **operator decision**

Tracked but unused:

| Path             | Size                  |
| ---------------- | --------------------- |
| `src/old ui/`    | 15 files, 3,752 lines |
| `src-stable/`    | 23 files              |
| `srcOLD/`        | 17 files              |
| `src.zip`        | 32 KB                 |
| `styles.css.bak` | 9.6 KB                |

Git history keeps all of them. **Ask the operator before deleting anything.** If approved, `git rm -r` them in one commit and remove the matching `exclude` entries in `tsconfig.json` and the ignores in `eslint.config.mjs`.

---

## Out of scope (record, don't fix)

- **Sidebar re-renders:** the sidebar re-renders on every `modify`/`changed`/`resolved`/leaf change, which is a design decision (incremental rendering).
- **Undocumented internals:** the `scope.keys` hack in `CreateNoteWithSuggestModal`, `app.commands`, the search view's `setQuery`, the file explorer's `revealInFolder`.
- **The plugin ID:** `obsidian-zettelkasten` contains "obsidian" and would be rejected by the community-plugin validator, but changing it breaks existing installs.
- **CI:** there are no release or attestation workflows (the owner's other plugins have them).
- **`reorderSequence`:** a placeholder that always fails, and a feature to build rather than a bug.

## Done criteria

- [x] Status table updated for every row
- [x] `pnpm test` passes, with tests for packages 0–2, 3 (pure builders), 4 (planner and validation), 6 and 7
- [x] Typecheck, `pnpm exec eslint .` and `pnpm build` exit 0
- [x] Dev-vault manual check (package 4) done, or recorded as an operator step
- [x] Nothing in `~/Obsidian/ZK2026` touched; pushed at the operator's request, nothing tagged or published
