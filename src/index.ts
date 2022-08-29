import WebSocket from 'ws';
import RingBuffer from 'ring-buffer-ts';
import { partitionObject } from './utils.js';

export type Config  = {
  // all time intervals are in miliseconds
  PING_INTERVAL: number, // Agents sends ping to management server every `PING_INTERVAL`
  RECONNECT_INTERVAL: number, // If in any case the connection is broken then a reconnect attempt is made every `RECONNECT_INTERVAL`
  MSG_BUFFER_SIZE: number,  // number of messages to remember and send later (if the connection doesnot exist, or is broken)
};

// WSAgent provides a reliable websocket connection
// it sends heartbeats (ping), reconnects if connection is broken
// and also keeps a buffer for messages that were send while the connection is down
// and those messages are later sent when connection is up

export class ReliableWS {
  private ws?: WebSocket;
  private address : string;
  private options : WebSocket.ClientOptions;
  private config : Config;

  private wsOpen: boolean = false;
  private onceOpened : boolean = false;
  private msgBuffer: RingBuffer.RingBuffer<any>;
  private pingTimer?: ReturnType<typeof setInterval>;
  private reconnectTimeout?: ReturnType<typeof setTimeout>;
  private shuttingDown: boolean = false;

  onopen: ((event: WebSocket.Event) => void) | null = null;
  onerror: ((event: WebSocket.ErrorEvent) => void) | null  = null;
  onclose: ((event: WebSocket.CloseEvent) => void) | null = null;
  onmessage: ((event: WebSocket.MessageEvent) => void) | null = null;


  constructor(address : string, options : WebSocket.ClientOptions & Config = { PING_INTERVAL : 5000, RECONNECT_INTERVAL:500, MSG_BUFFER_SIZE:0}) {
    this.address = address;
    const keys = ['PING_INTERVAL', 'RECONNECT_INTERVAL', 'MSG_BUFFER_SIZE'];
    const [config, opts] = partitionObject(options, (key) => {
      return keys.includes(key);
    });
    this.config = config as Config;
    this.options = opts;
    this.msgBuffer = new RingBuffer.RingBuffer(this.config.MSG_BUFFER_SIZE);
    this.setupConnection();
  }

  private setupConnection() {
    if (this.shuttingDown) return;
    this.changeConfig(this.config);
    this.ws = new WebSocket(this.address, this.options);
    this.ws.on('error', (event : WebSocket.ErrorEvent) => {
      if (this.onerror) this.onerror(event);
    });

    this.ws.once('open', (event : WebSocket.Event) => {
      this.wsOpen = true;
      if (this.onopen && !this.onceOpened) this.onopen(event); // this is triggerred on the first time only
      this.onceOpened = true;
      if (this.onmessage && this.ws) this.ws.onmessage = this.onmessage;
      const queued: string[] = this.msgBuffer.toArray();
      this.msgBuffer.clear();
      for (const msg of queued) {
	this.ws?.send(msg);
      }
      if (this.shuttingDown) this.ws?.close();
    });

    this.ws.on('close', (event : WebSocket.CloseEvent) => {
      if (this.shuttingDown) {
	if (this.onclose) this.onclose(event);
	return;
      }
      // this means connection was closed unexpetedly
      this.wsOpen = false;
      if (this.pingTimer) clearInterval(this.pingTimer);
      this.reconnectTimeout = setTimeout(
	this.setupConnection.bind(this),
	this.config.RECONNECT_INTERVAL
      );
    });
  }

  changeConfig(config : Config) {
    this.config = config;
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }
    this.pingTimer = setInterval(this.pingIfUp.bind(this), this.config.PING_INTERVAL);
    if (this.msgBuffer.getSize() != this.config.MSG_BUFFER_SIZE) {
      const newBuffer = new RingBuffer.RingBuffer<string>(this.config.MSG_BUFFER_SIZE);
      newBuffer.add(...this.msgBuffer.toArray());
      this.msgBuffer = newBuffer;
    }
  }

  private pingIfUp(data : any = '') {
    this.ws?.ping(data);
  }

  send(msg : any) {
    if (this.wsOpen && this.ws) {
      this.ws.send(msg);
    } else if (this.msgBuffer.getSize() != 0){
      this.msgBuffer.add(msg);
    }
  }

  close() {
    this.shuttingDown = true;
    if (this.pingTimer) clearInterval(this.pingTimer);
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws && this.wsOpen) this.ws.close();
  }
}
