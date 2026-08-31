# Minimal To-Do — V1.9

## Deployment / refresh fix
- CSS and JS use a new release query version.
- HTML includes browser cache-control hints.
- The app records its release version in localStorage.
- When a newer app version loads over an older one, it performs a one-time cache-busting reload with `app_refresh=1` and `v=1.9`.
- Existing task data remains in `minimal-todo-tasks-v1`.

## Features
- Tap task to edit
- Check mark alone toggles completion
- Swipe left to delete
- Today / Tomorrow / Pick date
- Low / Medium / High priority
- No time / Pick time
- Priority + time sorting
- Dark mode
- Today / Tasks / Calendar
- Search and filters


## App icon
Includes the new Deepak's To-Do List Home Screen icon as `icon-180.png` and PWA metadata in `manifest.json`.

## V1.9 fix
- Today > OVERDUE now derives overdue tasks directly from the main task store: any incomplete task with a date before today appears here.
- This keeps the Today tab consistent with the Tasks tab and avoids relying only on the legacy overdue store.
- Deleting an overdue task now removes it from the main task store as well as the legacy overdue store.
- Existing task storage key `minimal-todo-tasks-v1` is unchanged, so existing tasks are preserved.
