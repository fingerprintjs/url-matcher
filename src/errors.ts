import { SUPPORTED_PROTOCOLS } from './const'
import { stripEnd } from './utils'

export class InvalidProtocolError extends Error {
  private static supportedProtocols = SUPPORTED_PROTOCOLS.map(stripEnd).join(', ')

  constructor(protocol: string) {
    super(`Invalid protocol: ${protocol}. Supported protocols are: ${InvalidProtocolError.supportedProtocols}`)
    this.name = 'InvalidProtocolError'
  }
}
