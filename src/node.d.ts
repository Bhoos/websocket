import { CloseEvent, Event, ErrorEvent, MessageEvent } from 'ws';
import { ReliableWS as WS } from './index.js';

export declare class ReliableWS extends WS {
  onopen: ((event: Event) => void) | null;
    onerror: ((event: ErrorEvent) => void) | null;
    onclose: ((event: CloseEvent) => void) | null;
    onmessage: ((event: MessageEvent) => void) | null;

}
