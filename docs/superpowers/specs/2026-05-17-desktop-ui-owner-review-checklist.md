# Desktop UI Owner Review Checklist

> Date: 2026-05-17  
> Scope: owner review checklist for Desktop Shell IA preview  
> Related: PR #10 `feat(ui-preview): add desktop shell IA preview`  
> Status: Draft for owner review

## 1. Review goal

Use this checklist to decide whether the Desktop Shell IA in PR #10 is stable enough to become the basis for a minimal `apps/desktop` skeleton.

This is not a visual-polish review. The main question is:

> Does this shell explain Cairn's desktop product shape clearly enough to start engineering the real desktop frame?

## 2. Recommended review path

Open the UI preview and review in this order:

1. Desktop Shell
2. Home / Inbox
3. Run Detail
4. Artifact Review
5. Components, only if shared UI primitives need spot-checking

Expected product path:

```text
Desktop Shell → Home / Inbox → Run Detail → Artifact Review → approve / reject / export
```

## 3. Desktop Shell checklist

### Product shape

- [ ] First screen feels like Cairn's main desktop workspace, not just a component demo.
- [ ] The page communicates local-first behavior without requiring docs.
- [ ] It is clear that Cairn coordinates multi-agent work, not generic task management.
- [ ] The shell does not feel like an enterprise approval dashboard.

### Navigation

- [ ] Left navigation labels make sense for v0:
  - Mission Control
  - Inbox
  - Runs
  - Artifacts
  - Source Roots
  - Settings
- [ ] Mission Control is an acceptable default first tab.
- [ ] Settings and Source Roots are present as shell-level destinations, but not overbuilt.

### Runtime / workspace state

- [ ] Runtime health is visible enough.
- [ ] Local-first status is visible enough.
- [ ] Sync / backup / updates are clearly placeholders, not promised finished features.
- [ ] Risk warnings are visible without dominating the page.

### Main work area

- [ ] Handoff items are visible in the first screen.
- [ ] Pinned / active runs are visible in the first screen.
- [ ] The operator can tell what needs attention first.
- [ ] The shell does not duplicate too much of Home / Inbox.

Decision:

- [ ] Accept Shell IA.
- [ ] Accept with copy/layout tweaks.
- [ ] Needs another preview pass before desktop implementation.

## 4. Home / Inbox checklist

### Role inside Shell

- [ ] Home / Inbox feels like a focused work area inside Desktop Shell.
- [ ] It no longer reads as a separate product homepage.
- [ ] Workspace identity and global navigation correctly belong to Shell, not Home.

### Operator attention

- [ ] Handoff / approval / review / diagnostic requests are clearly prioritized.
- [ ] Active runs show enough status to choose between open, take over, cancel, or ignore.
- [ ] Filters match the likely operator workflow.
- [ ] The side panel supports decision-making instead of repeating shell-level state.

Decision:

- [ ] Accept Home / Inbox boundary.
- [ ] Needs copy tweaks.
- [ ] Needs IA changes.

## 5. Run Detail checklist

### Diagnosis and intervention

- [ ] Run title, summary, status, and id are clear.
- [ ] Breadcrumb makes the path from Shell/Home understandable.
- [ ] Task tree makes blocked work visible without relying only on color.
- [ ] Evidence timeline explains what happened and why.
- [ ] Protected actions are visibly distinct from safe actions.
- [ ] Intervention composer feels like a controlled operator action, not freeform automation.

### Artifact transition

- [ ] Artifact cards make it clear that `打开审阅` leads to Artifact Review.
- [ ] Artifact state, source, sensitivity, and verification are visible enough.
- [ ] Run Detail does not try to perform final artifact approval inline.

Decision:

- [ ] Accept Run Detail IA.
- [ ] Needs copy tweaks.
- [ ] Needs layout changes.

## 6. Artifact Review checklist

### Review decision

- [ ] Artifact identity and review state are clear.
- [ ] Breadcrumb makes the path from Run Detail understandable.
- [ ] Approve / request changes / reject actions are clear.
- [ ] Provenance is visible enough to justify a review decision.
- [ ] Diff / risk / decision tabs cover the right review context.

### Safety defaults

- [ ] Local paths are hidden by default.
- [ ] Export/share warnings are explicit enough.
- [ ] Including logs or paths feels like an intentional opt-in.
- [ ] The UI does not encourage leaking local filesystem details.

Decision:

- [ ] Accept Artifact Review IA.
- [ ] Needs copy tweaks.
- [ ] Needs stronger safety treatment.

## 7. Desktop implementation decision

After reviewing the four pages, choose one:

### Option A — Start minimal `apps/desktop` plan

Choose this if:

- Shell IA feels stable.
- Home / Run / Artifact boundaries are clear.
- Remaining issues are mostly copy, density, or state variants.

Next action:

- Draft `apps/desktop` minimal skeleton plan.
- Do not implement business logic yet.

### Option B — One more preview-only state pass

Choose this if:

- Shell shape is mostly right, but important states are under-modeled.
- Runtime offline/degraded or empty workspace states could change layout decisions.
- Export risk needs stronger visual treatment.

Next action:

- Build a Desktop Shell state matrix before starting desktop.

### Option C — Rework IA before desktop

Choose this if:

- The core navigation feels wrong.
- Shell / Home boundaries are still confusing.
- The review path is not understandable.

Next action:

- Revise Desktop Shell IA inside `apps/ui-preview`.
- Do not start `apps/desktop` yet.

## 8. Owner notes

Use this section during review:

- Biggest thing that feels right:
- Biggest thing that feels wrong:
- Must fix before desktop:
- Can wait until after desktop skeleton:
- Decision: Option A / B / C

## 9. Review outcome template

```text
Decision: Option A / B / C

Accepted:
- ...

Change before next PR:
- ...

Can defer:
- ...
```
