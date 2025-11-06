# Deployment

Deployments target GitHub Pages using the `gh-pages` branch.

## Manual deployment

1. Build the project with the GitHub Pages base path: `npm run build:gh`
2. Publish the `dist` folder: `npm run deploy`

The deploy script runs `gh-pages -d dist`, which creates/updates the `gh-pages` branch and pushes
it using the current Git remote. The `build:gh` script sets the `GITHUB_PAGES` flag so the Vite
config can emit the correct base path for GitHub Pages.

## GitHub Actions workflow (optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches:
      - main
permissions:
  contents: write
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build:gh
      - run: npm run deploy -- --user "github-actions-bot <github-actions[bot]@users.noreply.github.com>"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Set the repository's GitHub Pages source to the `gh-pages` branch (root).
