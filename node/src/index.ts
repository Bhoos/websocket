import WebSocket from 'ws';
import { ClientOptions, Event, CloseEvent, MessageEvent, ErrorEvent} from 'ws';
import { ClientRequestArgs } from 'http';
import { ReliableWS as WS, BufferType } from '@bhoos/websocket-base'
//@ts-ignore
global.WebSocket = WebSocket
export class ReliableWS extends WS<Event, ErrorEvent, CloseEvent, MessageEvent, ClientOptions | ClientRequestArgs> {
}
export {BufferType}
