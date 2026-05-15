# PR #5 Update Notes — UI Preview Systemization

## Summary

This update systematizes the Cairn UI preview after the initial static preview baseline. It keeps the preview static and backend-free while tightening page structure, preview data boundaries, artifact safety semantics, shared tokens, and primitive accessibility.

## Added / changed

- Added staged design + implementation docs under `docs/superpowers/specs/`:
  - UI preview systemization design
  - Phase 1 structure cleanup plan
  - Phase 2 ViewModel boundary plan
  - Phase 3 sensitive path / artifact safety API plan
  - Phase 4 tokens / theme responsibility cleanup plan
  - Phase 5 primitives accessibility hardening plan
- Refactored `apps/ui-preview/src`:
  - `preview-data/` holds static fixture data
  - `preview-sections/` holds page section JSX
  - `preview-models/` holds preview-only ViewModels
  - page files now mostly compose sections and local state wiring
- Added preview-only ViewModel boundary:
  - `home-inbox-view-model.ts`
  - `run-detail-view-model.ts`
  - `artifact-review-view-model.ts`
  - `components-gallery-view-model.ts`
  - `preview-types.ts`
- Hardened artifact/path safety API in `@cairn/ui`:
  - `CairnArtifactPathDisplayMode = 'hidden' | 'relative' | 'full'`
  - `CairnArtifactSensitivity = 'none' | 'local_path' | 'secret_risk'`
  - `ArtifactCard` now defaults to hidden paths unless callers explicitly opt into `relative` or `full`
  - retained legacy `sensitive` compatibility
  - updated `DiagnosticExportPanel` copy around local path export risk
- Clarified token/theme responsibilities:
  - added `cairnColors`, `cairnElevation`, and `cairnCssVariables`
  - moved preview CSS toward `--cairn-*` shared semantics plus `--preview-*` shell aliases
- Improved primitive accessibility:
  - `Tabs` now supports optional `onValueChange`
  - Tabs trigger/panel id linkage via `aria-controls` / `aria-labelledby`
  - roving `tabIndex` and Arrow/Home/End focus navigation
  - `DialogPanel` adds `aria-modal="true"`
  - `Dialog` supports optional Escape/backdrop close and initial focus handling
  - `ProtectedActionDialog` routes Escape/backdrop close through `onCancel`

## Non-goals preserved

- No backend/runtime/workspace-core connection.
- No real filesystem mutation.
- No token/secret scanning engine.
- No theme provider or Tailwind migration.
- No visual redesign beyond preserving existing preview semantics.
- No complete focus trap / portal implementation.

## Validation

Latest local validation after Phase 0–5 cleanup:

- `pnpm --filter @cairn/ui typecheck`
- `pnpm --filter @cairn/ui lint`
- `pnpm --filter @cairn/ui-preview typecheck`
- `pnpm --filter @cairn/ui-preview lint`
- `pnpm --filter @cairn/ui-preview build`
- `git diff --check origin/develop..HEAD`

All passed locally.

## Notes

- Browser screenshot smoke check was attempted against local `127.0.0.1`, but the OpenClaw browser policy blocked local navigation in this session. Build/lint/typecheck/diff-check were used as the verification gate.
- This branch is currently local-only ahead of `origin/feat/ui-desktop-v0`; push is required before PR #5 reflects these commits.
