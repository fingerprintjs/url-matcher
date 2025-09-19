import { SUPPORTED_PROTOCOLS } from './const'
import { InvalidProtocolError } from './errors'
import { stripEnd } from './utils'
import { Protocol } from './types'

/**
 * Checks if the given protocol is supported.
 * Note: The validated protocol should include the colon (:) at the end.
 *
 * @param {string} protocol - The protocol to be checked for support.
 * @return {boolean} Returns true if the protocol is supported, otherwise false.
 */
export function isSupportedProtocol(protocol: string): protocol is Protocol {
  return (SUPPORTED_PROTOCOLS as string[]).includes(protocol)
}

/**
 * Validates whether the specified protocol is supported.
 * Throws an error if the protocol is invalid.
 *
 * @param {string} protocol - The protocol to validate.
 */
export function validateProtocol(protocol: string): asserts protocol is Protocol {
  if (!isSupportedProtocol(protocol)) {
    throw new InvalidProtocolError(stripEnd(protocol))
  }
}
