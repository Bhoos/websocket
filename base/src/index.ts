import { Buffer, createBuffer, BufferType } from './buffer.js';

export { BufferType }

export type Config = {
  // all time intervals are in miliseconds
  PING_INTERVAL: number; // Agents sends ping with PING_MESSAGE to the server every `PING_INTERVAL`
  PING_MESSAGE: string;
  RECONNECT_INTERVAL: number | ((tries: number) => number); // If in any case the connection is broken then a reconnect attempt is made every `RECONNECT_INTERVAL`
  MSG_BUFFER_SIZE: number; // number of messages to remember and send later (if the connection doesnot exist, or is broken)
  BUFFER_TYPE: BufferType;
};

interface Event {
}

// WSAgent provides a reliable websocket connection
// it sends heartbeats (ping), reconnects if connection is broken
// and also keeps a buffer for messages that were send while the connection is down
// and those messages are later sent when connection is up
export class ReliableWS<
  ErrorEv extends Event,
  CloseEv extends Event,
  MessageEv extends Event,
  WSArgs
> {
  private ws?: WebSocket;
  private address: string | (() => string | null);
  private config: Config;

  private wsOpen: boolean = false;
  private onceOpened: boolean = false;
  private msgBuffer: Buffer<any>;
  private pingTimer?: ReturnType<typeof setInterval>;
  private reconnectTimeout?: ReturnType<typeof setTimeout>;
  private shuttingDown: boolean = false;
  private wsargs?: WSArgs;
  private tries: number = 0;

  onopen: (() => void) | null = null;
  onerror: ((event: ErrorEv) => void) | null = null;
  onclose: ((event: CloseEv) => void) | null = null;
  onmessage: ((event: MessageEv) => void) | null = null;
  // this event is issued when the connection is disconnected
  // reliable websocket will nonethless be trying connection attempts.
  // tries: number of times connection has been tried to establish since start or after the last successfull connection
  ondisconnect: ((event: CloseEv, tries: number) => void) | null = null;
  onreconnect: (() => void) | null = null;

  constructor(address: string | (() => string | null), options: Config, wsargs?: WSArgs) {
    this.address = address;
    this.config = options;
    this.wsargs = wsargs;
    this.msgBuffer = createBuffer<string>(this.config.MSG_BUFFER_SIZE, this.config.BUFFER_TYPE);
    this.changeConfig(this.config);
    this.setupConnection();
  }

  private setupConnection() {
    if (this.shuttingDown) return;
    let address;
    if (typeof this.address === 'string')
      address = this.address
    else
      address = this.address();

    if (address === null) {
      this.reconnectTimeout = setTimeout(
        this.setupConnection.bind(this),
        this.getReconnectionInterval(),
      );
      return;
    }
    //@ts-ignore
    this.ws = new WebSocket(address, this.wsargs);

    this.ws.onerror = _event => {
      const event = _event as unknown as ErrorEv;
      if (this.onerror) this.onerror(event);
    };

    this.ws.onopen = () => {
      this.wsOpen = true;
      this.tries = 0;
      if (this.onopen && !this.onceOpened) {
        this.onceOpened = true;
        this.onopen(); // this is triggerred on the first time only
      } else if (this.onreconnect && this.onceOpened) {
        this.onreconnect();
      }

      if (this.ws)
        this.ws.onmessage = _event => {
          const event = _event as unknown as MessageEv;
          if (this.onmessage) this.onmessage(event);
        };

      this.msgBuffer.forEach((msg) => {
        this.ws?.send(msg);
      })
      this.msgBuffer.clear();
      if (this.shuttingDown) {
        this.ws?.close();
      } else {
        this.setupPingTimer();
      }
    };

    this.ws.onclose = _event => {
      const event = _event as unknown as CloseEv;
      this.tries++;
      if (this.shuttingDown) {
        if (this.onclose) this.onclose(event);
        return;
      } else {
        if (this.ondisconnect) this.ondisconnect(event, this.tries);
      }
      // this means connection was closed unexpetedly
      this.wsOpen = false;
      this.ws = undefined;
      this.clearPingTimer();
      this.reconnectTimeout = setTimeout(
        this.setupConnection.bind(this),
        this.getReconnectionInterval(),
      );
    };
  }

  tryConnection() {
    if (this.shuttingDown) return false;
    if (this.wsOpen || this.ws) return false;
    clearTimeout(this.reconnectTimeout)
    this.setupConnection();
  }

  changeConfig(config: Config) {
    this.config = config;
    if (this.pingTimer) { // if connection is ok and ping is running, reset its timer.
      this.clearPingTimer();
      this.setupPingTimer();
    }
    if (this.msgBuffer.size != this.config.MSG_BUFFER_SIZE) {
      const newBuffer = createBuffer<string>(this.config.MSG_BUFFER_SIZE, this.config.BUFFER_TYPE);
      newBuffer.add(...this.msgBuffer.toArray());
      this.msgBuffer = newBuffer;
    }
  }

  private pingIfUp() {
    if (this.wsOpen)
      this.ws?.send(this.config.PING_MESSAGE);
  }

  private clearPingTimer() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = undefined;
  }

  private setupPingTimer() {
    if (this.config.PING_INTERVAL != 0 && !this.pingTimer) {
      this.pingTimer = setInterval(this.pingIfUp.bind(this), this.config.PING_INTERVAL);
    }
  }

  private getReconnectionInterval() {
    return (typeof this.config.RECONNECT_INTERVAL === 'number')
      ? this.config.RECONNECT_INTERVAL
      : this.config.RECONNECT_INTERVAL(this.tries);
  }

  send(msg: any, queue: boolean = true): boolean {
    if (this.wsOpen && this.ws) {
      this.ws.send(msg);
      return true;
    } else if (queue) {
      return this.msgBuffer.add(msg);
    } else {
      return false;
    }
  }

  close() {
    this.shuttingDown = true;
    if (!this.onceOpened && this.getReconnectionInterval() != 0)
      console.debug(
        '.close() called on Reliable Websocket, before any connection was successful. Be careful',
      );
    if (this.pingTimer) this.clearPingTimer();
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws && this.wsOpen) this.ws.close();
    this.msgBuffer.clear();
  }
}
