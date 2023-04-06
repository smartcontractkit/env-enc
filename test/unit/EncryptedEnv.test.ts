import EncryptedEnv from '../../src/EncryptedEnv'
import fs from 'fs'
import readline, { Interface } from 'readline'

jest.mock('fs')
jest.mock('readline')

const mockedFs = fs as jest.Mocked<typeof fs>
const mockedReadline = readline as jest.Mocked<typeof readline>

describe('EncryptedEnv', () => {
  let encryptedEnv: any

  beforeEach(() => {
    process.env['ENV_ENC_PASSWORD'] = 'testPassword'
    encryptedEnv = new EncryptedEnv()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('setVars', () => {
    it('should set encrypted environment variables', async () => {
      mockedFs.existsSync.mockReturnValue(true)
      encryptedEnv.isFileEmpty = jest.fn().mockReturnValue(false)
      encryptedEnv.readEnvEncFile = jest.fn().mockReturnValue(true)
      encryptedEnv.getHiddenInput = () => 'testValue'

      const mockPrompt: Partial<Interface> = {
        question: jest
          .fn()
          .mockImplementationOnce((query, callback) => callback('TEST_VAR'))
          .mockImplementation((query, callback) => callback('')),
        close: jest.fn(),
      }

      mockedReadline.createInterface.mockReturnValue(mockPrompt as Interface)

      await encryptedEnv.setVars()

      expect(mockedReadline.createInterface).toBeCalledTimes(2)
      expect(mockPrompt.question).toBeCalledTimes(2)
      expect(mockPrompt.close).toBeCalledTimes(2)
      expect(encryptedEnv.envVars['TEST_VAR']).toEqual('testValue')
    })
  })

  describe('removeVar', () => {
    it('should remove an encrypted environment variable', () => {
      encryptedEnv.envVars = { TEST_VAR: 'testValue' }
      encryptedEnv.readEnvEncFile = jest.fn().mockReturnValue(true)
      encryptedEnv.writeEnvEncFile = jest.fn()
      mockedFs.existsSync.mockReturnValue(true)

      encryptedEnv.removeVar('TEST_VAR')

      expect(encryptedEnv.readEnvEncFile).toBeCalledTimes(1)
      expect(encryptedEnv.writeEnvEncFile).toBeCalledTimes(1)
      expect(encryptedEnv.envVars['TEST_VAR']).toBeUndefined()
    })
  })

  describe('removeAll', () => {
    it('should remove all encrypted environment variables', () => {
      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.unlinkSync.mockReturnValue()

      encryptedEnv.removeAll()

      expect(mockedFs.unlinkSync).toBeCalledTimes(1)
    })
  })

  describe('viewVars', () => {
    it('should view encrypted environment variables', async () => {
      encryptedEnv.readEnvEncFile = jest.fn().mockReturnValue(true)
      encryptedEnv.envVars = { TEST_VAR: 'testValue' }
      mockedFs.existsSync.mockReturnValue(true)

      const mockPrompt: Partial<Interface> = {
        question: jest.fn().mockImplementation((_, cb) => cb('')),
        close: jest.fn(),
      }
      mockedReadline.createInterface.mockReturnValue(mockPrompt as Interface)

      await encryptedEnv.viewVars()

      expect(mockedReadline.createInterface).toBeCalledTimes(1)
      expect(mockPrompt.question).toBeCalledTimes(1)
    })
  })

  describe('load', () => {
    it('should load encrypted environment variables', () => {
      encryptedEnv.readEnvEncFile = jest.fn().mockReturnValue(true)
      encryptedEnv.envVars = { TEST_VAR: 'testValue' }
      mockedFs.existsSync.mockReturnValue(true)

      encryptedEnv.load()

      expect(encryptedEnv.readEnvEncFile).toBeCalledTimes(1)
      expect(process.env.TEST_VAR).toEqual('testValue')
    })
  })
})
