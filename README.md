# @eslint/create-config

Utility to create ESLint config files

## <a name="usage"></a>Usage

Prerequisites: [Node.js](https://nodejs.org/) (`^12.22.0`, `^14.17.0`, or `>=16.0.0`) built with SSL support. (If you are using an official Node.js distribution, SSL is always built in.)

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
# use `eslint-config-semistandard` shared config
# npm 6.x
npm init @eslint/config --config semistandard

# ⚠️ npm 7+, extra double-dash is needed:
npm init @eslint/config -- --config semistandard

# or (`eslint-config` prefix is optional)
npm init @eslint/config -- --config eslint-config-semistandard
```

The `--config` flag also supports passing in arrays:

```bash
npm init @eslint/config -- --config semistandard,standard
# or
npm init @eslint/config -- --config semistandard --config standard
```
