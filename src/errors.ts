import { SUPPORTED_PROTOCOLS } from './const'
import { stripEnd } from './utils'

export class InvalidProtocolError extends Error {
  private static supportedProtocols = SUPPORTED_PROTOCOLS.map(stripEnd).join(', ')

  constructor(protocol: string) {
    super(`Invalid protocol: ${protocol}. Supported protocols are: ${InvalidProtocolError.supportedProtocols}`)
    this.name = 'InvalidProtocolError'
  }
}

export type InvalidPatternErrorCode = 'ERR_QUERY_STRING' | 'ERR_INFIX_WILDCARD'

export class InvalidPatternError extends Error {
  readonly code: InvalidPatternErrorCode

  constructor(message: string, code: InvalidPatternErrorCode) {
    super(`${code}: ${message}`)
    this.code = code
    this.name = 'InvalidPatternError'
  }
}
