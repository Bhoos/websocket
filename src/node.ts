import {WebSocket, Event, CloseEvent, MessageEvent, ErrorEvent} from 'ws';
import { Config, ReliableWS as WS } from './index.js'
//@ts-ignore
global.WebSocket = WebSocket
export class ReliableWS extends WS<Event, ErrorEvent, CloseEvent, MessageEvent> { 
}
