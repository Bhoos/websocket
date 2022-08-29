# websocket
Reliable Websocket Client Library

This library provides a reliable websocket connection. It sends heartbeats (pings), reconnects if connection is broken and also keeps a buffer for messages that were send while the connection is down and those messages are later sent when connection is up.

# Use
```ts
import {ReliableWS} from 'reliable-websocket'

const config = {
  PING_INTERVAL: 1000, // ms
  RECONNECT_INTERVAL: 5000, // ms
  MSG_BUFFER_SIZE: 20,
  headers : {
	 Authorization : 'Bearer <<TOKEN>>'
  }
}

const agent = new ReliableWS('ws://localhost:3030/subscribe/', config);

agent.send('Hi');

agent.onerror = (event) => {
  console.log("Error: ", event);
}

agent.onopen = (event) => {
  console.log("Opened!!");
}

agent.onmessage = (event) => {
  console.log(event.data);
};
```
