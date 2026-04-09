# Repository Guidelines

## Project Structure & Module Organization

This repository is a static multi-page site prototype. Main entry pages live in the root:

- `index.html` is the primary landing page.
- `index-3.html`, `index-3-02.html`, `index-3-03.html` are alternate homepage variants.
- `news01.html`, `01.html`, `og.html`, `og-list.html`, `rockets.html` are section pages.

Assets are organized as follows:

- `dist/css/` for Bootstrap and project CSS.
- `dist/js/` for vendor and local JavaScript.
- `dist/img/` for page imagery and illustrations.
- `dist/fonts/` for fonts.
- `icons/` and `img/` for additional SVG/image assets.

There is no `src/` or test directory; edit files in place.

## Build, Test, and Development Commands

No build step is required. Open pages directly or serve the folder locally.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/index.html`.

Useful checks:

```bash
rg 'href="' *.html
rg --files dist/css dist/js dist/img
```

Use these to review links and locate assets quickly.

## Coding Style & Naming Conventions

Use 2-space indentation in HTML, CSS, and inline markup to match the existing files. Keep filenames lowercase with hyphen-separated names, for example `og-list.html` and `style2-main.css`.

Preserve the current stack:

- Bootstrap 5 classes for layout/components
- local CSS in `dist/css/`
- direct script includes instead of bundlers

Avoid large structural rewrites unless updating all related pages consistently.

## Testing Guidelines

There is no automated test suite in this repository. Validate changes manually:

- open edited pages in a browser;
- confirm navigation links resolve;
- check desktop and narrow mobile widths;
- verify images, icons, and theme switching still load.

When fixing links, test both the source page and destination page.

## Commit & Pull Request Guidelines

Git history is not available in this workspace, so follow a simple convention:

- commit messages in imperative mood, e.g. `Fix broken links on news page`
- keep one logical change per commit

For pull requests, include:

- a short summary of changed pages;
- screenshots for visual changes;
- a note about manual checks performed;
- a list of any remaining broken or placeholder links.

## Content & Asset Notes

Several pages are prototype variants and some links point to missing files. Before adding new pages, prefer updating `index.html` and linking only to files that exist in the repository.
