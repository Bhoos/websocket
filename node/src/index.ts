import WebSocket from 'ws';
import { ClientOptions, CloseEvent, MessageEvent, ErrorEvent} from 'ws';
import { ClientRequestArgs } from 'http';
import { ReliableWS as WS, BufferType } from '@bhoos/websocket-base'

type NodeWS = WebSocket
declare global {
  type WebSocket = NodeWS
  var WebSocket: new (
    address: string | URL,
    protocols?: string | string[],
    options?: WebSocket.ClientOptions | ClientRequestArgs,
  ) => WebSocket
}

export class ReliableWS extends WS<ErrorEvent, CloseEvent, MessageEvent, ClientOptions | ClientRequestArgs> {
}
export {BufferType}
