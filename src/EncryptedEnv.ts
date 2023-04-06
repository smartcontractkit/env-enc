import fs from 'fs'
import path from 'path'
import os from 'os'
import crypto from 'crypto'
import readline from 'readline'
import { Writable } from 'stream'

type Base64 = string

export default class EncryptedEnv {
  private password?: string
  private envPath: string
  private envVars: Record<string, string> = {}

  constructor(options?: { path?: string }) {
    this.password = process.env['ENV_ENC_PASSWORD']

    // Resolve file path if provided, else default to ".env.enc" in current working directory
    if (options?.path) {
      this.envPath = this.resolveHome(options.path)
    } else {
      this.envPath = path.resolve(process.cwd(), '.env.enc')
    }
  }

  public setVars = async (): Promise<void> => {
    if (fs.existsSync(this.envPath) && !this.isFileEmpty(this.envPath)) {
      if (!this.readEnvEncFile()) {
        return
      }
    } else {
      if (!this.password) {
        console.log(`Please set an encryption password by running: ${text.yellow}npx env-enc set-pw${text.reset}\n`)
        return
      }
    }

    const mutableStream = new Writable({
      write: (chunk, encoding, callback) => {
        process.stdout.write(chunk, encoding)
        callback()
      },
    })

    let linesToClear = 0
    let numVars = 0

    while (true) {
      const prompt = readline.createInterface({
        input: process.stdin,
        output: mutableStream,
      })
      const name = await new Promise<string>((resolve) => {
        prompt.question(
          `${text.yellow}${
            numVars > 0 ? 'Would you like to set another variable? ' : ''
          }Please enter the variable name (or press ${text.green}ENTER${text.yellow} to finish): \n${text.reset}`,
          (input) => {
            resolve(input)
          },
        )
      })
      prompt.close()
      linesToClear += 2

      if (name === '') {
        for (let i = 0; i < linesToClear; i++) {
          this.clearLine()
        }
        mutableStream.end()
        return
      }

      if (!this.isValidEnvVarName(name)) {
        mutableStream.write(
          `${name} is an invalid name for an environment variable.\nVariable names must start with an underscore or upper-case character may only contain upper-case characters, underscores, and numbers.\n`,
        )
        linesToClear += 2
        continue
      }

      const value = await this.getHiddenInput(
        `${text.yellow}Please enter the variable value (input will be hidden): \n${text.reset}`,
      )
      linesToClear += 2

      this.envVars[name] = value

      numVars += 1

      this.writeEnvEncFile()
    }
  }

  public removeVar = (name: string): void => {
    if (!fs.existsSync(this.envPath)) {
      console.log(`Encrypted environment variable file ${text.yellow}${this.envPath}${text.reset} not found`)
      return
    }

    if (!this.readEnvEncFile()) {
      return
    }

    if (!this.envVars[name]) {
      console.log(`No saved variable with the name ${text.yellow}${name}${text.reset} was found`)
      return
    }
    delete this.envVars[name]
    this.writeEnvEncFile()
  }

  public removeAll = (): void => {
    if (!fs.existsSync(this.envPath)) {
      console.log(`Encrypted environment variable file ${text.yellow}${this.envPath}${text.reset} not found`)
      return
    }

    fs.unlinkSync(this.envPath)
  }

  public viewVars = async (): Promise<void> => {
    if (!fs.existsSync(this.envPath)) {
      console.log(`Encrypted environment variable file ${text.yellow}${this.envPath}${text.reset} not found`)
      return
    }

    if (!this.readEnvEncFile()) {
      return
    }

    const mutableStream = new Writable({
      write: (chunk, encoding, callback) => {
        process.stdout.write(chunk, encoding)
        callback()
      },
    })

    const prompt = readline.createInterface({
      input: process.stdin,
      output: mutableStream,
    })

    if (Object.keys(this.envVars).length === 0) {
      mutableStream.write(`There are currently no variables stored in ${text.yellow}${this.envPath}${text.reset}\n`)
      await new Promise((resolve) => {
        prompt.question(`${text.green}Press ENTER to continue${text.reset}`, resolve)
      })
      this.clearLine()
      this.clearLine()
      mutableStream.end()
      return
    }

    mutableStream.write(
      `${text.underline}The following variables are encrypted and stored in ${text.yellow}${this.envPath}${text.reset}\n`,
    )
    for (const name in this.envVars) {
      mutableStream.write(`${text.yellow}${name} = ${text.reset}${this.envVars[name]}\n`)
    }

    await new Promise((resolve) => {
      prompt.question(`${text.green}Press ENTER to continue${text.reset}`, resolve)
    })

    for (let i = 0; i < Object.keys(this.envVars).length + 2; i++) {
      this.clearLine()
    }

    mutableStream.end()
  }

  public load = (): void => {
    if (fs.existsSync(this.envPath) && this.readEnvEncFile()) {
      for (const name in this.envVars) {
        process.env[name] = this.envVars[name]
      }
    }
  }

  private resolveHome = (envPath: string): string => {
    return envPath[0] === '~' ? path.join(os.homedir(), envPath.slice(1)) : envPath
  }

  private getHiddenInput = async (promptText: string): Promise<string> => {
    const hiddenStream = new Writable({
      write: (_chunk, _encoding, callback) => {
        callback()
      },
    })

    return new Promise(async (resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: hiddenStream,
        terminal: true,
      })

      readline.emitKeypressEvents(process.stdin, rl)

      process.stdout.write(promptText)

      let input = ''

      const keypressHandler = async (
        str: string | undefined,
        key: { name: string; ctrl: boolean; meta: boolean; shift: boolean; sequence: string },
      ) => {
        if (!str) {
          return
        }
        const keyCode = str.charCodeAt(0)

        if (keyCode === 13) {
          // Enter key
          process.stdin.removeListener('keypress', keypressHandler)
          process.stdout.write('\n')
          rl.close()
          resolve(input)
        } else if (keyCode === 8 || keyCode === 127) {
          // Backspace key (8 on Windows, 127 on Unix systems)
          if (input.length > 0) {
            input = input.slice(0, -1)
            process.stdout.write('\b \b') // Move cursor back, write a space to overwrite, and move cursor back again
          }
        } else {
          input += str
          process.stdout.write('*'.repeat(str.length))
        }
      }

      process.stdin.on('keypress', keypressHandler)
      process.stdin.setRawMode(true)
    })
  }

  private isFileEmpty = (path: string): boolean => {
    return fs.readFileSync(path).toString().replace(/\s+/g, '').length === 0
  }

  private readEnvEncFile = (): boolean => {
    if (!this.password) {
      console.log(
        `Please set the encryption password by running: ${text.yellow}npx env-enc set-pw${text.reset}\nIf you do not know your password, delete the file ${text.yellow}${this.envPath}${text.reset} and set a new password. (Note: This will cause you to lose all encrypted variables.)\n`,
      )
      return false
    }
    try {
      const lines = fs.readFileSync(this.envPath).toString().split('\n')
      for (const line of lines) {
        const sanitizedLine = line.replace(/[ \t]+/g, '')
        if (sanitizedLine.length > 2) {
          const [name, value] = sanitizedLine.split(':')
          if (typeof name !== 'string' || typeof value !== 'string') {
            throw Error('Invalid encrypted environment variable file format')
          }
          // Slice off "ENCRYPTED|" prefix
          this.envVars[name] = this.decrypt(value.slice(10))
        }
      }
    } catch (e) {
      console.log(
        `Error loading encrypted environment variables from file ${text.yellow}${this.envPath}${text.reset}.\nIf you do not know your password, delete the file ${text.yellow}${this.envPath}${text.reset} and set a new password. (Note: This will cause you to lose all encrypted variables.)\n${e}`,
      )
      return false
    }
    return true
  }

  private writeEnvEncFile = (): void => {
    const lines: string[] = []
    for (const name in this.envVars) {
      lines.push(`${name}: ENCRYPTED|${this.encrypt(this.envVars[name])}`)
    }
    fs.writeFileSync(this.envPath, lines.join('\n'))
  }

  private encrypt = (plaintext: string): Base64 => {
    // Generate a random salt and initialization vector (IV)
    const salt = crypto.randomBytes(16)
    const iv = crypto.randomBytes(16)
    // Derive a cryptographic key from the password using the salt
    const key = crypto.scryptSync(this.password as string, salt, 32)

    // Encrypt the plaintext using the key and IV
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()

    // Combine the encrypted data, IV, salt, and tag
    const encryptedData = Buffer.concat([salt, iv, tag, encrypted]).toString('base64')

    return encryptedData
  }

  private decrypt = (encrypted: Base64): string => {
    // Decode the encrypted data and extract the salt, IV, tag, and encrypted text
    const dataBuffer = Buffer.from(encrypted, 'base64')
    const salt = dataBuffer.slice(0, 16)
    const iv = dataBuffer.slice(16, 32)
    const tag = dataBuffer.slice(32, 48)
    const encryptedText = dataBuffer.slice(48)

    // Derive the same cryptographic key using the password and salt
    const key = crypto.scryptSync(this.password as string, salt, 32)

    // Decrypt the encrypted text using the key, IV, and tag
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()])

    return decrypted.toString('utf8')
  }

  private isValidEnvVarName = (name: string): boolean => {
    const regex = /^[A-Z_][A-Z0-9_]*$/
    return regex.test(name)
  }

  private clearLine = () => {
    // Move the cursor up by 1 line
    process.stdout.write('\x1b[1A')
    // Clear the current line
    process.stdout.write('\x1b[0K')
  }
}

const text = {
  reset: '\x1b[0m',
  underline: '\x1b[4m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
}
