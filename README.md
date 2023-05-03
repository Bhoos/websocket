# websocket
Reliable Websocket Client Library

This library provides a reliable websocket connection. It sends heartbeats (pings), reconnects if connection is broken and also keeps a buffer for messages that were send while the connection is down and those messages are later sent when connection is up.

Buffer for message can be a ring buffer (older messages are dropped) or a Queue (newer messages are dropeed)

# Use
For node application use @bhoos/websocket-node and for react native application/browser use @bhoos/websocket-browser. The only difference is in the client arguments to the WebSocket connection.

```shell
yarn add @bhoos/websocket-node
```

For example, the code below is for node. You can use this same code in browser except for the `clientArgs` argument. In node `clientArgs` is of type `http.ClientRequestArgs | ws.ClientOptionsbrowser` which includes port number, auth headers and other headers. But in browser `clientArgs` is just only `string | string[] | undefined` which is the list of supported protocols.

```ts
import {ReliableWS, BufferType} from '@bhoos/websocket-node'

const config = {
  PING_INTERVAL: 1000, // ms
  RECONNECT_INTERVAL: 5000, // ms
  MSG_BUFFER_SIZE: 20,
  PING_MESSAGE : 'ping',
  BUFFER_TYPE: BufferType.RingBuffer
}

const clientArgs = {
    port: 1234
}

const agent = new ReliableWS('ws://localhost:3030/subscribe/', config, clientArgs);

agent.send('Hi');

agent.onopen = (event) => {
  console.log("Connection Opened!!");
}

agent.onmessage = (event) => {
  console.log('Recived message', event.data);
};

agent.onerror = (event) => {
  console.log("Error: ", event.message);
}

agent.ondisconnect = (event, tries) => {
 console.log(`Disconnected ${tries} times. Will Automatically reconnect`);
}


agent.onclose = (event) => {
  console.log('Connection Closed successfully');
}

// agent.close()
```

#### Note:
After updating the code kindly run ``yarn lerna version --no-push --no-git-tag-version`` to update the versions.
