# macOS Packaging, Signing, and Installer Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the macOS packaging path explicit, split local verification from release installer generation, and align repo docs with electron-builder's official signing and notarization variables.

**Architecture:** Keep `apps/desktop/electron-builder.yml` as the single packaging source of truth. Add explicit desktop package scripts for the local ad-hoc directory build and the release `.dmg` build, then document the operational path in one new engineering guide and the existing release / CI docs.

**Tech Stack:** TypeScript, Electron, electron-vite, electron-builder, pnpm, markdownlint, Prettier, Apple `codesign`, `spctl`, `notarytool`, and `stapler`.

---

## Scope Check

This plan implements `docs/superpowers/specs/2026-05-18-macos-packaging-signing-installers-design.md`.

In scope:

- Add explicit macOS package scripts for local directory packaging and release `.dmg` packaging.
- Keep `apps/desktop/electron-builder.yml` as the canonical build config and make its macOS arch target explicit.
- Add a dedicated macOS packaging guide with prerequisites, commands, signing / notarization variables, verification commands, and failure triage order.
- Update engineering navigation, local dev docs, desktop README, distribution-and-signing design, CI / CD docs, release playbook, status, and changelog.
- Normalize Apple credential naming to `APPLE_APP_SPECIFIC_PASSWORD`.

Out of scope:

- Do not add Mac App Store distribution.
- Do not add universal2.
- Do not add Windows signing changes.
- Do not add auto-update implementation.
- Do not add custom signing or notarization scripts.
- Do not implement the release workflow itself.

## File Structure

Create or modify these files:

- Modify `apps/desktop/package.json`
  - Adds `package:mac:dir` and `package:mac:dmg` scripts.
- Modify `apps/desktop/electron-builder.yml`
  - Makes the macOS target explicitly `dmg` on `arm64`.
- Create `docs/engineering/macos-packaging.md`
  - Owns the Mac packaging / signing / installer runbook.
- Modify `docs/engineering/README.md`
  - Adds the new packaging guide to the engineering index and reading order.
- Modify `docs/engineering/local-dev-setup.md`
  - Points the local mac packaging path at the explicit `package:mac:dir` command.
- Modify `apps/desktop/README.md`
  - Documents package-level macOS commands and smoke checks.
- Modify `docs/design/distribution-and-signing.md`
  - Aligns the conceptual flow with the actual package commands and official env vars.
- Modify `docs/engineering/ci-cd.md`
  - Normalizes macOS secret names and release command examples.
- Modify `docs/engineering/release-playbook.md`
  - Replaces placeholder signing steps with the explicit release packaging flow.
- Modify `docs/STATUS.md`
  - Records that the macOS packaging baseline is documented and commandized.
- Modify `CHANGELOG.md`
  - Records the packaging / signing baseline update.

## Task 1: Desktop Packaging Scripts And Builder Defaults

**Files:**

- Modify: `apps/desktop/package.json`
- Modify: `apps/desktop/electron-builder.yml`
- Test: `pnpm --filter @cairn/desktop run`
- Test: `pnpm --filter @cairn/desktop package:mac:dir`

- [ ] **Step 1: Add explicit macOS package scripts**

Add these scripts under `scripts` in `apps/desktop/package.json`:

```json
"package": "electron-builder --dir",
"package:mac:dir": "electron-builder --mac --dir -c.mac.identity=-",
"package:mac:dmg": "electron-builder --mac"
```

Keep the existing `dev`, `dev:debug`, `preview`, `typecheck`, `lint`, `build`, and `clean` entries unchanged.

- [ ] **Step 2: Make the macOS builder target explicit**

Update `apps/desktop/electron-builder.yml` so the mac section is explicit about the first-release architecture:

```yml
mac:
  category: public.app-category.developer-tools
  target:
    - target: dmg
      arch:
        - arm64
```

Leave `files`, `directories`, `win`, and `linux` unchanged.

- [ ] **Step 3: Verify the script surface**

Run:

```bash
pnpm --filter @cairn/desktop run
```

Expected: the script list includes `package:mac:dir` and `package:mac:dmg`.

- [ ] **Step 4: Verify the local directory package path**

Run:

```bash
pnpm --filter @cairn/desktop package:mac:dir
```

Expected: an unpacked macOS app is produced under `apps/desktop/release/`, and the build does not require release notarization credentials.

## Task 2: Mac Packaging Guide And Engineering Navigation

**Files:**

- Create: `docs/engineering/macos-packaging.md`
- Modify: `docs/engineering/README.md`
- Modify: `docs/engineering/local-dev-setup.md`
- Modify: `apps/desktop/README.md`
- Modify: `docs/design/distribution-and-signing.md`

- [ ] **Step 1: Write the dedicated packaging guide**

Create `docs/engineering/macos-packaging.md` with these sections, in this order:

1. Prerequisites
2. Local package
3. Release installer
4. Signing and notarization variables
5. Validation commands
6. Failure triage order

Use the following command set in the guide:

```bash
pnpm --filter @cairn/desktop package:mac:dir
pnpm --filter @cairn/desktop package:mac:dmg
codesign -dv --verbose=4 "apps/desktop/release/Cairn.app"
spctl -a -vv --type execute "apps/desktop/release/Cairn.app"
xcrun notarytool log <submission-id>
xcrun stapler validate "apps/desktop/release/Cairn.dmg"
```

Document these credential families exactly:

```text
CSC_LINK + CSC_KEY_PASSWORD
CSC_NAME
APPLE_API_KEY + APPLE_API_KEY_ID + APPLE_API_ISSUER
APPLE_ID + APPLE_APP_SPECIFIC_PASSWORD + APPLE_TEAM_ID
```

- [ ] **Step 2: Wire the new guide into the engineering index**

Update `docs/engineering/README.md` so `macos-packaging.md` appears in the file list and in the "发布前" reading path alongside `release-playbook.md` and `ci-cd.md`.

- [ ] **Step 3: Replace the generic local package command in the desktop docs**

Update `docs/engineering/local-dev-setup.md` and `apps/desktop/README.md` so the macOS packaging section uses `pnpm --filter @cairn/desktop package:mac:dir` for local verification and `pnpm --filter @cairn/desktop package:mac:dmg` for release-style packaging.

Keep the preview-safe smoke checklist intact and continue to state that Desktop does not start Workspace Core sidecar yet.

- [ ] **Step 4: Reframe the macOS distribution design**

Update `docs/design/distribution-and-signing.md` so the macOS section says the build flow is driven by `electron-builder`, not custom signing scripts, and that the release path uses `APPLE_APP_SPECIFIC_PASSWORD` when the Apple ID notarization flow is chosen.

## Task 3: CI, Release, Status, And Changelog Alignment

**Files:**

- Modify: `docs/engineering/ci-cd.md`
- Modify: `docs/engineering/release-playbook.md`
- Modify: `docs/STATUS.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Normalize the release docs**

Update `docs/engineering/ci-cd.md` and `docs/engineering/release-playbook.md` so the macOS release examples:

```bash
pnpm --filter @cairn/desktop package:mac:dmg
```

and the Apple ID notarization variables use this exact spelling:

```yaml
APPLE_ID: ${{ secrets.APPLE_ID }}
APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

Keep the `APPLE_API_KEY` family documented as an alternative path if it is already mentioned, but do not use `APPLE_APP_PASSWORD` anywhere.

- [ ] **Step 2: Update the project status baseline**

Update `docs/STATUS.md` so the current capabilities section explicitly says the macOS packaging baseline is documented and commandized, while release automation is still not implemented.

- [ ] **Step 3: Record the change in the changelog**

Add an `[Unreleased]` entry to `CHANGELOG.md` noting that macOS packaging now has explicit local and release commands, a dedicated guide, and normalized Apple signing variable names.

- [ ] **Step 4: Run repo-level checks**

Run:

```bash
pnpm run docs:lint
pnpm run format:check
git diff --check
```

Expected: all pass.

## Coverage Check

This plan covers the spec by:

- Splitting local package and release `.dmg` packaging into named commands.
- Keeping one `electron-builder.yml` as the canonical packaging config.
- Documenting notarization, stapling, and validation with the official Apple and electron-builder variable names.
- Updating the engineering index, local dev setup, desktop README, design docs, CI / CD docs, release playbook, status, and changelog.
- Avoiding Mac App Store, universal2, auto-update, and custom signing scripts.
