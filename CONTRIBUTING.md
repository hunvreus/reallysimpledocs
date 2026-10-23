# Contributing to ReallySimpleDocs

- Support development by sponsoring the author: https://github.com/sponsors/hunvreus
- Submit pull requests (PRs) against the `main` branch.
- For branches:
  - `main` is the default branch. This is what we publish to https://www.npmjs.com/package/reallysimpledocs.
  - `release` is what we deploy to https://reallysimpledocs.com (see below).
  - New features are worked in `feature/name-of-the-feature` branches.
  - Issues are addressed in `issue/123-main-issue` branches.
  - When ready, open a PR against `main`.
- Keep changes focused: one feature or fix per PR.
- Test locally before submitting.
- Follow existing code style.

## Releases and the docs site

The site at reallysimpledocs.com deploys from the `release` branch, not `main`, so the docs always match the version on npm. Nobody commits to `release` directly. Every other branch, `main` included, only gets a Cloudflare preview build.

To release:

1. Bump the version in `package.json`, commit, tag (for example `1.0.14`) and push.
2. Run `npm publish`.
3. Publish a GitHub release for the tag, for example `gh release create 1.0.14 --generate-notes`.

Publishing the release runs `.github/workflows/deploy-site.yml`, which points `release` at the tag. Cloudflare then builds and deploys the site. To redeploy or roll back, run that workflow manually with the tag you want live.

Thanks for helping!
