# Restore Points

This folder holds **known-good snapshots** of FleetPulse for reference and recovery.

## FleetPulseRestoreReference

- **Purpose:** A fully working version of FleetPulse (snapshot from a previous day). Kept so we can compare or restore files when the main project is broken.
- **Use it to:**
  - Compare code: copy specific files or folders from here into the main project root to undo breaking changes.
  - Reference: see how something was implemented when the main codebase has changed.
  - Restore: if the main app is broken, you can copy this folder elsewhere, run `npm install` and `npm run dev`, or copy individual files back into the main project.
- **Do not edit** the contents of `FleetPulseRestoreReference` in place—treat it as read-only. The “live” project is the root FleetPulse folder; this is only a snapshot.

This folder is committed to git so the reference is saved in the repo and available to everyone.
