# Minimal To-Do — V1.2

Mobile-first To-Do app optimized for an iPhone 13-sized viewport.

## V1.1 changes
- Swipe a task left to reveal Delete
- Delete tasks with one tap
- Today tab
- Tasks tab with All / Active / Completed filters
- Task search
- Calendar tab with month navigation
- Dark mode with saved preference
- Working menu and more/settings actions
- Select a calendar date and see its tasks
- LocalStorage persistence

## Files
- `index.html`
- `style.css`
- `app.js`
- `README.md`

## Run
Open `index.html`, or use:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Data
Tasks are stored in browser localStorage under `minimal-todo-tasks-v1`. Future versions should migrate this data rather than clear it.
