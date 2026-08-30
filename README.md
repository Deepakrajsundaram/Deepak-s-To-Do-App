# Minimal To-Do — V1

Mobile-first minimal To-Do prototype, optimized for an iPhone 13-sized viewport.

## Files
- `index.html` — app structure
- `style.css` — UI
- `app.js` — interactions and local persistence

## V1
- Today view
- Complete tasks
- Progress indicator
- Priorities
- Overdue section
- Quick Add
- Browser localStorage persistence

## Run
Open `index.html`, or use a local server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Data
Tasks are stored under `minimal-todo-tasks-v1` in localStorage. Future versions should migrate this data rather than clear it.
