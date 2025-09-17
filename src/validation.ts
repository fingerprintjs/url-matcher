import { SUPPORTED_PROTOCOLS } from './const'
import { InvalidProtocolError } from './errors'
import { stripEnd } from './utils'

/**
 * Checks if the given protocol is supported.
 * Note: The validated protocol should include the colon (:) at the end.
 *
 * @param {string} protocol - The protocol to be checked for support.
 * @return {boolean} Returns true if the protocol is supported, otherwise false.
 */
export function isSupportedProtocol(protocol: string): boolean {
  return SUPPORTED_PROTOCOLS.includes(protocol)
}

/**
 * Validates whether the specified protocol is supported.
 * Throws an error if the protocol is invalid.
 *
 * @param {string} protocol - The protocol to validate.
 * @return {void} This function does not return a value.
 */
export function validateProtocol(protocol: string): void {
  if (!isSupportedProtocol(protocol)) {
    throw new InvalidProtocolError(stripEnd(protocol))
  }
}
