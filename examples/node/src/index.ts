import {ReliableWS} from '@bhoos/websocket'; 
const config = {
  PING_INTERVAL: 1000, // ms
  RECONNECT_INTERVAL: 5000, // ms
  MSG_BUFFER_SIZE: 20,
  PING_MESSAGE : 'ping'
}

const agent = new ReliableWS('ws://localhost:3030/subscribe/', config);

agent.send(JSON.stringify({type: 'ping'}));
agent.onerror = (event) => {
  console.log("Error: ", event.message);
}

agent.onopen = (event) => {
  console.log("Opened!!");
  agent.close();
}

agent.onmessage = (event) => {
  console.log(event.data);
};

agent.onclose = (ev) => {
  console.log("closed");
}

setTimeout(() => {console.log('1s') }, 1000);
