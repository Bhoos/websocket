# websocket
Reliable Websocket Client Library

This library provides a reliable websocket connection. It sends heartbeats (pings), reconnects if connection is broken and also keeps a buffer for messages that were send while the connection is down and those messages are later sent when connection is up.

Buffer for message can be a ring buffer (older messages are dropped) or a Queue (newer messages are dropeed)

# Use
Use either @bhoos/websocket-node or @bhoos/websocket-browser

```ts
import {ReliableWS, BufferType} from '@bhoos/websocket-node'

const config = {
  PING_INTERVAL: 1000, // ms
  RECONNECT_INTERVAL: 5000, // ms
  MSG_BUFFER_SIZE: 20,
  PING_MESSAGE : 'ping',
  BUFFER_TYPE: BufferType.RingBuffer
}

const agent = new ReliableWS('ws://localhost:3030/subscribe/', config);

agent.send('Hi');

agent.onerror = (event) => {
  console.log("Error: ", event.message);
}

agent.onopen = (event) => {
  console.log("Opened!!");
}

agent.onmessage = (event) => {
  console.log(event.data);
};
```

#### Note:
After updating the code kindly run ``yarn lerna version --no-push --no-git-tag-version`` to update the versions.