import EncryptedEnv from './EncryptedEnv'

export let encryptedEnv: EncryptedEnv

export const config = (options?: { path?: string }) => {
  encryptedEnv = new EncryptedEnv(options)
  encryptedEnv.load()
}
