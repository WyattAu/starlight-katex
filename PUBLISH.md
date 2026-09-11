# Publish checklist — `@wyatt/starlight-katex`

Scoped npm packages (`@wyatt/...`) are **private by default** — `--access public` is required on every publish. 2FA is enforced on this account, so every publish needs a fresh OTP from your authenticator.

## 0. Preflight (once)

- [ ] You are logged in: `npm whoami` → `wyatt` (or your npm username)
- [ ] The `@wyatt` scope exists on your npm account (it is created automatically when you publish the first scoped package, or manually at npmjs.com → org settings)
- [ ] Authenticator app available for OTP codes
- [ ] Local npm works: `npm --version` — if npm itself is broken on this machine (seen before), fix it first (`sudo npm i -g npm@latest` or reinstall Node) or publish from another machine/CI

## 1. Release checks

```bash
cd ~/dev/src/github.com/WyattAu/starlight-katex
git checkout main && git pull
git status                 # must be clean
npm ci                     # clean install from lockfile
npm run typecheck          # tsc --noEmit
npm test                   # full vitest suite
npm run build              # tsc → dist (declarations; sanity check)
```

CI should be green on main: <https://github.com/WyattAu/starlight-katex/actions/workflows/ci.yml>

## 2. Version bump

This repo uses a **manual changelog convention** (no changesets). Flow:

1. Choose the bump:
   - bugfix → `npm version patch`
   - new feature / option → `npm version minor`
   - breaking change (Starlight/Astro major, option removed) → `npm version major` (stay 0.x until stable: `0.1.0 → 0.2.0`)
2. `npm version <patch|minor|major>` bumps `package.json`, commits, and creates a `vX.Y.Z` git tag.
3. Update `CHANGELOG.md` — add a `## [X.Y.Z] - YYYY-MM-DD` section describing what shipped.

## 3. Dry run

```bash
npm run build
npm publish --dry-run --access public
```

Verify in the dry-run output that the tarball contains exactly: `package.json`, `README.md`, `LICENSE`, `src/`, `styles/` — nothing else, no stray files.

## 4. Publish

```bash
npm publish --access public --otp=<6-digit-code-from-authenticator>
```

The OTP expires every ~30 s — generate it right before running the command.

## 5. Post-publish

```bash
git push --follow-tags          # pushes main + vX.Y.Z tag (triggers any tag automation)
npm view @wyatt/starlight-katex version          # confirms the new version
```

- [ ] npm page looks right: <https://www.npmjs.com/package/@wyatt/starlight-katex> (README renders, correct version, "public" badge)
- [ ] Smoke test in a scratch project: `npm install @wyatt/starlight-katex` in a fresh Starlight site and build once
- [ ] If something is broken: `npm deprecate @wyatt/starlight-katex@X.Y.Z "broken, use X.Y.Z+1"` then fix and republish. npm allows unpublish within 72 h as a last resort (`npm unpublish @wyatt/starlight-katex@X.Y.Z`)

## Version history convention

Every published version gets a section in `CHANGELOG.md` matching its git tag. Never publish without a changelog entry.
