import { ReliableWS as WS } from '@bhoos/websocket-base'
export { Config, BufferType } from '@bhoos/websocket-base'
export class ReliableWS extends WS<Event, CloseEvent, MessageEvent, string | string[]> {
}
