# env-enc

A tool for loading and storing encrypted environment variables

## What

This is a tool for keeping environment variables such as private keys and other credentials encrypted at rest.
This reduces the risk of credential exposure by ensuring credentials are not visible in plaintext or in terminal history.
It also allows an encrypted environment variables to be stored on Github, provided they are protected with a secure password.

For loading environment variables, this works in a similar manner to the NPM package `dotenv` where environment variables are loaded from a `.env` file.
However, this plugin instead uses CLI commands to create an `.env.enc` file which stores environment variables that are encrypted using a password.
Then, when the `config()` method is called, these variables will be decrypted and loaded into the environment.

## Installation

1. Install `@chainlink/env-enc` from NPM
2. Import the package in your project's main file (this will be `hardhat.config.js` or `hardhat.config.ts` for HardHat projects)

- For JavaScript projects, add the following line to the top of main file (usually `index.js`):

  ```
  require("@chainlink/env-enc").config();
  ```

- For Typescript projects, add the following lines to the top of main file (usually `index.ts`):

  ```
  import * as envEnc from "@chainlink/env-enc";
  envEnc.config();
  ```

## Commands

The following commands accept an optional `--path` flag followed by a path to the desired encrypted environment variable file.
If one does not exist, it will be created automatically by the `npx env-enc set` command.

The `--path` flag has no effect on the `npx env-enc set-pw` command as the password is stored as an ephemeral environment variable for the current terminal session.

| Command                     | Description                                                                                                                                       | Parameters            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `npx env-enc set-pw`        | Sets the password to encrypt and decrypt the environment variable file **NOTE:** On Windows, this command may show a security confirmation prompt |                       |
| `npx env-enc set`           | Sets and saves variables to the encrypted environment variable file                                                                               |                       |
| `npx env-enc view`          | Shows all currently saved variables in the encrypted environment variable file                                                                    |                       |
| `npx env-enc remove <name>` | Removes a variable from the encrypted environment variable file                                                                                   | `name`: Variable name |
| `npx env-enc remove-all`    | Deletes the encrypted environment variable file                                                                                                   |                       |

## Configuration

By default, all encrypted environment variables will be stored in a file named `.env.enc` in the root directory of your project.
However, this file path can be configured using the `path` option in the `config()` method as shown below:

```
require("@chainlink/env-enc").config({ path: './your_directory/my_env.enc' });
```

## Usage

First, set the encryption password by running the command `npx env-enc set-password`.
The password must be set at the beginning of each new session.
If this password is lost, there will be no way to recover the encrypted environment variables.

When running this command on a Windows machine, you may receive a security confirmation prompt. Enter "r" to proceed.

> **NOTE:** When you finish each work session, exit your terminal to prevent your password from becoming exposes if your machine is compromised.

Run the command `npx env-enc set` to set and save environment variables.
These variables will be loaded into your environment when the `config()` method is called.
Use `npx env-enc view` to view all currently saved environment variables.
When pressing _ENTER_, the terminal will be cleared to prevent these values from remaining visible.
Running `npx env-enc remove VAR_NAME_HERE` deletes the specified environment variable.
The command `npx env-enc remove-all` deletes the entire saved environment variable file.

If you lose your password, delete your encrypted environment variable file. If you attempt to load an encrypted environment variable file without the correct password, it will cause an error.
