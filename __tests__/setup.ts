import { TextEncoder, TextDecoder } from 'util'
import { ReadableStream } from 'stream/web'

// Assigns global variables needed for the miniflare
Object.assign(globalThis, {
  TextEncoder,
  TextDecoder,
  ReadableStream,
  MessagePort: class MessagePort {},
})
