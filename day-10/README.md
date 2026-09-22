# Rankendra Singh — Portfolio (production build)

This replaces the Tailwind CDN `<script>` (dev-only, and the source of that
console warning) with a real compiled stylesheet via the Tailwind CLI.

## Folder contents

```
portfolio-build/
├── index.html          the site — links to ./dist/output.css
├── tailwind.config.js  theme (colors, fonts) matching the design
├── src/input.css       Tailwind's entry point (@tailwind directives)
├── package.json        build scripts
└── dist/output.css     generated on build — not included yet
```

## One-time setup

You need [Node.js](https://nodejs.org) installed (v18+ is fine). Then, inside
the `portfolio-build` folder:

```bash
npm install
```

## Build the CSS

```bash
npm run build
```

This scans `index.html` for every class you're using and generates a minified
`dist/output.css` containing only those styles — typically a few KB instead of
Tailwind's full multi-MB CDN bundle. Open `index.html` in a browser afterward;
no more console warning, and it loads faster too.

## While you're still editing

```bash
npm run dev
```

This watches `index.html` and rebuilds `dist/output.css` automatically as you
change classes, so you can keep tweaking the design without re-running the
build manually.

## Deploying

Once `dist/output.css` exists, the whole folder (or just `index.html` +
`dist/output.css`) is a static site — drop it on Netlify, Vercel, GitHub
Pages, or any static host. No server or build step needed at deploy time as
long as you commit the generated `dist/output.css`.
