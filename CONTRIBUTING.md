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
- Run `npm run check` before submitting. CI runs it on every pull request.
- Follow existing code style.

## Releases and the docs site

The site at reallysimpledocs.com deploys from the `release` branch, not `main`, so the docs always match the version on npm. Nobody commits to `release` directly. Every other branch, `main` included, only gets a Cloudflare preview build.

To release:

1. Bump the version in `package.json` (for example to `1.0.14`) and commit.
2. Tag that commit with the same version, with no `v` prefix, and push: `git tag 1.0.14 && git push origin main 1.0.14`.
3. Publish a GitHub release for the tag, for example `gh release create 1.0.14 --generate-notes`.
4. Approve the staged version on npmjs.com, in the package's Staged Packages tab, or with `npm stage approve <stage-id>`. Both ask for 2FA. The site deploys once the approved version is on npm.

Publishing the release runs `.github/workflows/release.yml`. It checks that the tag is on `main` and that the version in `package.json` matches it, runs the build checks, and stages that version on npm with `npm stage publish`, using trusted publishing. A staged version is not installable until a maintainer approves it. If the version is already staged or published, the workflow skips this step. If staging fails, the site is not deployed.

The site only goes live after you approve the staged version. The workflow checks npm every 30 seconds for up to about 6 hours. Once the version is published, it points `release` at the tag, and Cloudflare builds and deploys the site. If the version was already on npm, it deploys right away. If you approve after the wait times out, open the workflow run and re-run the failed `deploy-site` job. If you reject the staged version, nothing is deployed. Let the wait time out, or cancel the run.

Do not run `npm publish` by hand. Versions reach npm only through this workflow and your approval. The workflow needs no npm token and adds a provenance statement linking each version to the commit it was built from. Prereleases are neither staged nor deployed.

To redeploy or roll back the site, run the Release workflow manually from the Actions tab with the tag you want live. A manual run only moves `release`. It never publishes to npm.

Thanks for helping!
