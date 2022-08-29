import RingBuffer from 'ring-buffer-ts';

export type Config = {
  // all time intervals are in miliseconds
  PING_INTERVAL: number; // Agents sends ping to management server every `PING_INTERVAL`
  PING_MESSAGE: string;
  RECONNECT_INTERVAL: number; // If in any case the connection is broken then a reconnect attempt is made every `RECONNECT_INTERVAL`
  MSG_BUFFER_SIZE: number; // number of messages to remember and send later (if the connection doesnot exist, or is broken)
};

// WSAgent provides a reliable websocket connection
// it sends heartbeats (ping), reconnects if connection is broken
// and also keeps a buffer for messages that were send while the connection is down
// and those messages are later sent when connection is up
export class ReliableWS {
  private ws?: WebSocket;
  private address: string;
  private config: Config;

  private wsOpen: boolean = false;
  private onceOpened: boolean = false;
  private msgBuffer: RingBuffer.RingBuffer<any>;
  private pingTimer?: ReturnType<typeof setInterval>;
  private reconnectTimeout?: ReturnType<typeof setTimeout>;
  private shuttingDown: boolean = false;

  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(address: string, options: Config) {
    this.address = address;
    this.config = options;
    this.msgBuffer = new RingBuffer.RingBuffer(this.config.MSG_BUFFER_SIZE);
    this.setupConnection();
  }

  private setupConnection() {
    if (this.shuttingDown) return;
    this.changeConfig(this.config);
    this.ws = new WebSocket(this.address);
    this.ws.onerror = event => {
      if (this.onerror) this.onerror(event);
    };

    this.ws.onopen = (event: Event) => {
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
    };

    this.ws.onclose = (event: Event) => {
      if (this.shuttingDown) {
        if (this.onclose) this.onclose(event);
        return;
      }
      // this means connection was closed unexpetedly
      this.wsOpen = false;
      if (this.pingTimer) clearInterval(this.pingTimer);
      this.reconnectTimeout = setTimeout(
        this.setupConnection.bind(this),
        this.config.RECONNECT_INTERVAL,
      );
    };
  }

  changeConfig(config: Config) {
    this.config = config;
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }
    if (this.config.PING_INTERVAL != 0)
      this.pingTimer = setInterval(this.pingIfUp.bind(this), this.config.PING_INTERVAL);
    if (this.msgBuffer.getSize() != this.config.MSG_BUFFER_SIZE) {
      const newBuffer = new RingBuffer.RingBuffer<string>(this.config.MSG_BUFFER_SIZE);
      newBuffer.add(...this.msgBuffer.toArray());
      this.msgBuffer = newBuffer;
    }
  }

  private pingIfUp() {
    this.ws?.send(this.config.PING_MESSAGE);
  }

  send(msg: any) {
    if (this.wsOpen && this.ws) {
      this.ws.send(msg);
    } else if (this.msgBuffer.getSize() != 0) {
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
