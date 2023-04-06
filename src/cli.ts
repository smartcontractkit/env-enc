#! /usr/bin/env node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { runShellScriptInSameTerminal } from './runSetPasswordScripts'
import EncryptedEnv from './EncryptedEnv'

let encryptedEnv: EncryptedEnv

interface PathArgs {
  path?: string
}

interface RemoveArgs extends PathArgs {
  name: string
}

yargs(hideBin(process.argv))
  .option('path', {
    alias: 'p',
    type: 'string',
    description: 'Path to encrypted env file',
  })
  .command<PathArgs>(
    'set-pw',
    'Sets the password to encrypt and decrypt the environment variable file',
    (yargs) => yargs,
    (args) => {
      runShellScriptInSameTerminal()
    },
  )
  .command<PathArgs>(
    'view',
    'Shows all currently saved variables in the encrypted environment variable file',
    (yargs) => yargs,
    async (args) => {
      encryptedEnv = new EncryptedEnv({ path: args.path })
      await encryptedEnv.viewVars()
      process.exit(0)
    },
  )
  .command<PathArgs>(
    'set',
    'Saves new variables to the encrypted environment variable file',
    (yargs) => yargs,
    async (args) => {
      encryptedEnv = new EncryptedEnv({ path: args.path })
      await encryptedEnv.setVars()
      process.exit(0)
    },
  )
  .command<RemoveArgs>(
    'remove <name>',
    'Removes a variable from the encrypted environment variable file',
    (yargs) =>
      yargs.positional('name', {
        type: 'string',
        describe: 'Name of the environment variable to remove',
      }),
    (args) => {
      if (!args.name || args.name.length === 0) {
        throw Error('Invalid command format. Expected "remove <name>"')
      }
      encryptedEnv = new EncryptedEnv({ path: args.path })
      encryptedEnv.removeVar(args.name)
      process.exit(0)
    },
  )
  .command<PathArgs>(
    'remove-all',
    'Deletes the encrypted environment variable file',
    () => {},
    (args) => {
      encryptedEnv = new EncryptedEnv({ path: args.path })
      encryptedEnv.removeAll()
      process.exit(0)
    },
  )
  .demandCommand(1, 'You must provide a valid command.')
  .help()
  .alias('h', 'help')
  .strict().argv
