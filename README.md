# websocket
Reliable Websocket Client Library

This library provides a reliable websocket connection. It sends heartbeats (pings), reconnects if connection is broken and also keeps a buffer for messages that were send while the connection is down and those messages are later sent when connection is up.

# Use
```ts
import WSAgent from 'websocket';

// websocket options + ping, reconnect & buffer options
const config = {
  PING_INTERVAL: 5000, // ms
  RECONNECT_INTERVAL: 5000, // ms
  MSG_BUFFER_SIZE: 20,
  headers : {
	 Authorization : 'Bearer <<TOKEN>>'
  }

}

const agent = new WSAgent('ws://abcd.com/efgh', config);

agent.send('Hi!');
```
