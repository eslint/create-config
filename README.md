# @eslint/create-config

Utility to create ESLint config files

## Usage

Prerequisites: [Node.js](https://nodejs.org/) (`^18.18.0`, `^20.9.0`, or `>=21.1.0`) built with SSL support. (If you are using an official Node.js distribution, SSL is always built in.)

You can use npm/npx(shipped with Node.js).

```bash
# use npm
npm init @eslint/config
```

```bash
# use npx
npx @eslint/create-config
```

If you want to use a specific shareable config that is hosted on npm, you can use the `--config` option and specify the package name:

```bash
# use `eslint-config-standard` shared config
npm init @eslint/config -- --config eslint-config-standard
```

To use an eslintrc-style (legacy) shared config:

```bash
npm init @eslint/config -- --eslintrc --config eslint-config-standard
```
