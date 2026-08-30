# Minimal To-Do — V1.7

## Deployment / refresh fix
- CSS and JS use a new release query version.
- HTML includes browser cache-control hints.
- The app records its release version in localStorage.
- When a newer app version loads over an older one, it performs a one-time cache-busting reload with `app_refresh=1` and `v=1.7`.
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
