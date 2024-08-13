# Changelog

## [1.3.1](https://github.com/eslint/create-config/compare/v1.3.0...v1.3.1) (2024-08-13)


### Bug Fixes

* re-trigger release-please ([#145](https://github.com/eslint/create-config/issues/145)) ([6fbb932](https://github.com/eslint/create-config/commit/6fbb9326280847b7ad58fa0049ce086398dede39))

## [1.3.0](https://github.com/eslint/create-config/compare/v1.2.0...v1.3.0) (2024-08-04)


### Features

* typescript-eslint v8 has supported eslint v9 ([#141](https://github.com/eslint/create-config/issues/141)) ([f8d9c30](https://github.com/eslint/create-config/commit/f8d9c30af6b8e88a627730745127c48692c98ef6))

## [1.2.0](https://github.com/eslint/create-config/compare/v1.1.6...v1.2.0) (2024-07-22)


### Features

* `eslint-plugin-react` supports ESLint v9 ([#139](https://github.com/eslint/create-config/issues/139)) ([359cf50](https://github.com/eslint/create-config/commit/359cf50eabc0790f3514ffcc1af27c16e297ac0e))

## [1.1.6](https://github.com/eslint/create-config/compare/v1.1.5...v1.1.6) (2024-07-12)


### Bug Fixes

* Add custom ts parser for vue projects ([#136](https://github.com/eslint/create-config/issues/136)) ([0098452](https://github.com/eslint/create-config/commit/00984525e17e926dec9184e9bf2502326894f089))

## [1.1.5](https://github.com/eslint/create-config/compare/v1.1.4...v1.1.5) (2024-06-19)


### Bug Fixes

* add files globs to be linted ([#130](https://github.com/eslint/create-config/issues/130)) ([19d7d6f](https://github.com/eslint/create-config/commit/19d7d6f111db4f78d0fc454662342ea1e810afe9))
* add warning message for ESLint v9 with npm `--force` flag ([#132](https://github.com/eslint/create-config/issues/132)) ([f8178a8](https://github.com/eslint/create-config/commit/f8178a85e0e2147e2097ab03a87290e53f066a98))

## [1.1.4](https://github.com/eslint/create-config/compare/v1.1.3...v1.1.4) (2024-06-10)


### Bug Fixes

* enable linting `.jsx` files when React is selected ([#126](https://github.com/eslint/create-config/issues/126)) ([6736f3d](https://github.com/eslint/create-config/commit/6736f3dc19682d2cead9aef67b0f27ec51700658))

## [1.1.3](https://github.com/eslint/create-config/compare/v1.1.2...v1.1.3) (2024-06-04)


### Bug Fixes

* do not use `--force` when choosing yarn/eslint v8 ([#123](https://github.com/eslint/create-config/issues/123)) ([b377ad7](https://github.com/eslint/create-config/commit/b377ad7828cf39840c5a70d5a018d0368dbb43ec))

## [1.1.2](https://github.com/eslint/create-config/compare/v1.1.1...v1.1.2) (2024-05-26)


### Bug Fixes

* use `--force` to install eslint v9 + tseslint ([#118](https://github.com/eslint/create-config/issues/118)) ([27a207e](https://github.com/eslint/create-config/commit/27a207ec209500da88a95f8c50dece16ae0f072b))

## [1.1.1](https://github.com/eslint/create-config/compare/v1.1.0...v1.1.1) (2024-05-17)


### Bug Fixes

* use @eslint/compat to fix eslint v9 + react plugin ([#113](https://github.com/eslint/create-config/issues/113)) ([61a385e](https://github.com/eslint/create-config/commit/61a385ebf2bc2d57074614160210530c7dfb04b9))

## [1.1.0](https://github.com/eslint/create-config/compare/v1.0.3...v1.1.0) (2024-04-28)


### Features

* remove style guides ([#108](https://github.com/eslint/create-config/issues/108)) ([de1d085](https://github.com/eslint/create-config/commit/de1d085e0c7f465492a352f577e14535cd745399))


### Chores

* run tests in Node.js 22 ([#109](https://github.com/eslint/create-config/issues/109)) ([b2320d8](https://github.com/eslint/create-config/commit/b2320d8ac16e5d9d545e132fe7d0ec662f7c8420))

## [1.0.3](https://github.com/eslint/create-config/compare/v1.0.2...v1.0.3) (2024-04-22)


### Documentation

* use @eslint/create-config latest ([#103](https://github.com/eslint/create-config/issues/103)) ([8366a9e](https://github.com/eslint/create-config/commit/8366a9e5fe97ed9614040fc5bddbf794be70d183))

## [1.0.2](https://github.com/eslint/create-config/compare/v1.0.1...v1.0.2) (2024-04-16)


### Bug Fixes

* not install multi tseslint versions ([#94](https://github.com/eslint/create-config/issues/94)) ([ba1a02c](https://github.com/eslint/create-config/commit/ba1a02c420273f2510dca20ae15c73c55ef1977a))

## [1.0.1](https://github.com/eslint/create-config/compare/v1.0.0...v1.0.1) (2024-04-10)


### Bug Fixes

* use eslint-config-airbnb-base by default ([#92](https://github.com/eslint/create-config/issues/92)) ([627306a](https://github.com/eslint/create-config/commit/627306a3bb09a6b5e2b52a856d6caa41cb629a3e)), closes [#87](https://github.com/eslint/create-config/issues/87)


### Chores

* run `npm install` before npm publish ([#88](https://github.com/eslint/create-config/issues/88)) ([136df22](https://github.com/eslint/create-config/commit/136df22d16be0ffda1aa64ed9dc8d040e32f19e5))

## [1.0.0](https://github.com/eslint/create-config/compare/v0.4.6...v1.0.0) (2024-04-05)


### ⚠ BREAKING CHANGES

* support flat config ([#81](https://github.com/eslint/create-config/issues/81))
* Require Node.js ^18.18.0 || ^20.9.0 || >=21.1.0 ([#80](https://github.com/eslint/create-config/issues/80))

### Features

* add bun package manager ([#78](https://github.com/eslint/create-config/issues/78)) ([903f929](https://github.com/eslint/create-config/commit/903f92984ea6fc84c52638849c6d70ef629ef1d6))
* Require Node.js ^18.18.0 || ^20.9.0 || &gt;=21.1.0 ([#80](https://github.com/eslint/create-config/issues/80)) ([f893814](https://github.com/eslint/create-config/commit/f89381432c95d9b782b31c6685ddcff3d1f181a2))
* support flat config ([#81](https://github.com/eslint/create-config/issues/81)) ([54ac1f2](https://github.com/eslint/create-config/commit/54ac1f2bb213e60c9b387c01cc674cb03b1aafed))


### Bug Fixes

* add `log.warn` ([#85](https://github.com/eslint/create-config/issues/85)) ([3749cd6](https://github.com/eslint/create-config/commit/3749cd62b780473e767f07a2fa1680d88a9298ad))
* Remove Google style guide ([#82](https://github.com/eslint/create-config/issues/82)) ([9c4214b](https://github.com/eslint/create-config/commit/9c4214bc879cc892fd8ba4f1259c7d0686b0d7c2)), closes [#75](https://github.com/eslint/create-config/issues/75)


### Chores

* run tests in Node.js 21 ([#76](https://github.com/eslint/create-config/issues/76)) ([bd20976](https://github.com/eslint/create-config/commit/bd209765bb01fe30c5281443aecc312dcb9141de))
* run tests on all supported versions of Node.js ([#77](https://github.com/eslint/create-config/issues/77)) ([f7da13a](https://github.com/eslint/create-config/commit/f7da13a07978d0674fee4371002053d7b24ef489))
* standardize npm script names ([#69](https://github.com/eslint/create-config/issues/69)) ([38d293a](https://github.com/eslint/create-config/commit/38d293af65e467829d286911442a124a10d9b926))
* switch to eslint flat config ([#73](https://github.com/eslint/create-config/issues/73)) ([4bde28a](https://github.com/eslint/create-config/commit/4bde28a7011591cfaa6d86c852f4fb41b6e5be08))

## [0.4.6](https://github.com/eslint/create-config/compare/v0.4.5...v0.4.6) (2023-07-24)


### Chores

* generate provenance statements when release ([#67](https://github.com/eslint/create-config/issues/67)) ([99488cf](https://github.com/eslint/create-config/commit/99488cf62cc50ca8649f0151d8ee5193aa24c6cc))

## [0.4.5](https://github.com/eslint/create-config/compare/v0.4.4...v0.4.5) (2023-06-16)


### Bug Fixes

* add cjs override for esm projects (fixes [#59](https://github.com/eslint/create-config/issues/59)) ([#63](https://github.com/eslint/create-config/issues/63)) ([2568629](https://github.com/eslint/create-config/commit/2568629207e3372c6836476e18f6e709e16b13e4))


### Chores

* trigger release-please ([#65](https://github.com/eslint/create-config/issues/65)) ([6c0e7a1](https://github.com/eslint/create-config/commit/6c0e7a186bc18415562e0d3f107ca4d4acec3af0))

## [0.4.4](https://github.com/eslint/create-config/compare/v0.4.3...v0.4.4) (2023-06-01)


### Bug Fixes

* generated vue-ts config ([#64](https://github.com/eslint/create-config/issues/64)) ([0be55af](https://github.com/eslint/create-config/commit/0be55af5f18733d00172348c75ef7bd8e0f2a502))


### Chores

* run tests on Node.js v20 ([#60](https://github.com/eslint/create-config/issues/60)) ([72ffdcd](https://github.com/eslint/create-config/commit/72ffdcd7f5b902e95a65feac73224691f4626ae5))
* Update tweet message ([#61](https://github.com/eslint/create-config/issues/61)) ([e956b80](https://github.com/eslint/create-config/commit/e956b800898f56fdf60983ada4bd08434414578c))

## [0.4.3](https://github.com/eslint/create-config/compare/v0.4.2...v0.4.3) (2023-04-09)


### Documentation

* remove extra custom anchor ([#52](https://github.com/eslint/create-config/issues/52)) ([c486ddf](https://github.com/eslint/create-config/commit/c486ddf6a118510a2ac50c1ce59b4ea1db15fe4b))
* sync `--config` examples with ESLint Getting Started docs ([#55](https://github.com/eslint/create-config/issues/55)) ([4e48315](https://github.com/eslint/create-config/commit/4e483153bd7ed438de856d2091ed36a44a126313))


### Chores

* add triage action ([#50](https://github.com/eslint/create-config/issues/50)) ([81d7730](https://github.com/eslint/create-config/commit/81d773025762d3a0352580ff257a14e6fe4dd45e))
* Also post releases to Mastodon ([#56](https://github.com/eslint/create-config/issues/56)) ([9fc2de4](https://github.com/eslint/create-config/commit/9fc2de4eb76dd04218b5a4c72a6006563c74f589))
* include all commits in the changelog ([#57](https://github.com/eslint/create-config/issues/57)) ([6f6308a](https://github.com/eslint/create-config/commit/6f6308a19b3530f180170fa19c2438e15c245e97))
* set up release-please ([#54](https://github.com/eslint/create-config/issues/54)) ([5216efa](https://github.com/eslint/create-config/commit/5216efaa1cfe83f54b8cb28dde9d5d2ffb5d8ef6))
* use LTS node version in lint job ([#53](https://github.com/eslint/create-config/issues/53)) ([a0d54a1](https://github.com/eslint/create-config/commit/a0d54a1ba57d88e22113e7364a44ecef139bfebd))

v0.4.2 - December 30, 2022

* [`561970e`](https://github.com/eslint/create-config/commit/561970ef90d631749dbc067706ae06f50852df49) docs: sync `--config` instructions in README with eslint Getting Started (#45) (Milos Djermanovic)
* [`66cc96c`](https://github.com/eslint/create-config/commit/66cc96c0d597bc7d736d65447d0c26c6537aedd7) ci: add Node v19 (#44) (Milos Djermanovic)

v0.4.1 - October 31, 2022

* [`d42d866`](https://github.com/eslint/create-config/commit/d42d8668ec562286d4c8178b630ef2e04b179035) docs: update `--config` usage for npm v7+ (#42) (唯然)

v0.4.0 - October 21, 2022

* [`a0fa620`](https://github.com/eslint/create-config/commit/a0fa6204abdd07525bf0e6bade0f5caf916c60bd) feat: support `--config` (#38) (Percy Ma)
* [`368a1a3`](https://github.com/eslint/create-config/commit/368a1a39d4cd8db3baeb507a8123f4b0983a7b40) chore: Remove unused code (#36) (Brandon Mills)

v0.3.1 - August 13, 2022

* [`bf2a259`](https://github.com/eslint/create-config/commit/bf2a259097157d29748c7c3912b4961824ca1acd) fix: remove airbnb/google in style guides when using ts (#33) (唯然)

v0.3.0 - July 1, 2022

* [`f446191`](https://github.com/eslint/create-config/commit/f44619170e6e8a0881901f844a3604276e1d5424) feat: support vue3 (#34) (唯然)

v0.2.0 - May 4, 2022

* [`3c6197b`](https://github.com/eslint/create-config/commit/3c6197be5544a43b13a595e29a7f488e098f2f92) build: add node v18 (#29) (唯然)
* [`dbd5e34`](https://github.com/eslint/create-config/commit/dbd5e34b96995d4732442783689f868aabbbb819) fix: throw error and exit when `package.json` not found (#27) (Strek)
* [`8a26ef4`](https://github.com/eslint/create-config/commit/8a26ef4aef266d676302ffad89cb50e90aa8ad7a) feat: added yarn and pnpm installations (#24) (Strek)
* [`a9841e2`](https://github.com/eslint/create-config/commit/a9841e2c297f7caff47317fdddc6853e24f293c8) chore: upgrade esmock (#26) (唯然)

v0.1.2 - January 7, 2022

* [`c8ba806`](https://github.com/eslint/create-config/commit/c8ba80657784f0076b6b247b24996df567058f43) fix: Wrong info about globally-installed copy of ESLint (#18) (唯然)
* [`da0fcbb`](https://github.com/eslint/create-config/commit/da0fcbb760c21a75c530d70391211a80c85a7d60) fix: cannot find installed eslint (#15) (唯然)
* [`859b379`](https://github.com/eslint/create-config/commit/859b379f99daf47790ebd049af7e2e752d635f59) fix: missing question to confirm installing dependencies (#14) (唯然)

v0.1.1 - December 17, 2021

* [`48d8025`](https://github.com/eslint/create-config/commit/48d8025e1d1b607d95dd93ac261aa9990104851f) fix: import("eslint") doesn't work (#9) (唯然)

v0.1.0 - December 15, 2021

* [`6d20aa3`](https://github.com/eslint/create-config/commit/6d20aa375ba3a4a408b1f751796450f8c6808189) chore:  add `publishConfig` field in `package.json` (#6) (Nitin Kumar)
* [`5cb3a94`](https://github.com/eslint/create-config/commit/5cb3a941ac90e1aaa58ca5c1d0c4dcf196167355) fix: upgrade esmock v1.7.0 (#5) (唯然)
* [`bd6eb01`](https://github.com/eslint/create-config/commit/bd6eb01e5a4b4902c981e80dbfa15ce0040d97bf) ci: use node v16 (#3) (Nitin Kumar)
* [`d054ce7`](https://github.com/eslint/create-config/commit/d054ce78be788e78046faa8af9cd080721e04232) feat: move eslint --init (#1) (唯然)
* [`f90b605`](https://github.com/eslint/create-config/commit/f90b605402e25327546a3ae3b197fdc8cfc7f7b4) Initial commit (Nicholas C. Zakas)
