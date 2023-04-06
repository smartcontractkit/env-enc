import { spawn } from 'child_process'
import os from 'os'
import path from 'path'

export const runShellScriptInSameTerminal = () => {
  let scriptPath, command, args

  if (isRunningInCmd()) {
    scriptPath = path.join(__dirname, 'scripts', 'setPassword.cmd')
    command = 'cmd.exe'
    args = ['/c', scriptPath]
  } else if (isRunningInPowerShell()) {
    scriptPath = path.join(__dirname, 'scripts', 'setPassword.ps1')
    command = 'powershell.exe'
    args = ['-ExecutionPolicy', 'Unrestricted', '-NoLogo', '-File', scriptPath]
  } else if (isRunningInUnixTerminal()) {
    scriptPath = path.join(__dirname, 'scripts', 'setPassword.sh')
    command = 'bash'
    args = [scriptPath]
  } else {
    console.log('This script is designed to run in Unix terminal, Command Prompt, or PowerShell only.')
    return
  }

  const child = spawn(command, args, { stdio: 'inherit' })

  child.on('error', (error) => {
    console.error(`Error executing the shell script: ${error.message}`)
  })

  child.on('exit', (code) => {
    console.log(`Shell script exited with code: ${code}`)
  })
}

const isRunningInUnixTerminal = () => {
  return os.platform() !== 'win32'
}

const isRunningInPowerShell = () => {
  return process.env.PSModulePath !== undefined
}

const isRunningInCmd = () => {
  return process.env.ComSpec !== undefined && !isRunningInPowerShell()
}
