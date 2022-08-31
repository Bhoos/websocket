import { ReliableWS as WS } from './index.js'
export { Config } from './index.js'
export class ReliableWS extends WS<Event, Event, CloseEvent, MessageEvent> {
}
