import {ReliableWS, BufferType} from '@bhoos/websocket-browser';
const config = {
  PING_INTERVAL: 1000, // ms
  RECONNECT_INTERVAL: 5000, // ms
  MSG_BUFFER_SIZE: 2,
  PING_MESSAGE : '{"type" : "ping"}',
  BUFFER_TYPE: BufferType.FixedSizeQueue,
}

const agent = new ReliableWS('ws://localhost:3030/subscribe/', config);

agent.send(JSON.stringify({type: 'msg1'}));
agent.send(JSON.stringify({type: 'msg2'}));
agent.send(JSON.stringify({type: 'msg3'}));
agent.send(JSON.stringify({type: 'msg4'}));
agent.send(JSON.stringify({type: 'msg5'}));
agent.onerror = (event) => {
  console.log("Error: ", event);
}

agent.onopen = (event : Event) => {
  console.log("Opened!!", event);
}

agent.onmessage = (event) => {
  console.log(event.data);
};

agent.onclose = (ev : CloseEvent) => {
  console.log("closed", ev.code);
}

setTimeout(() => {console.log('1s') }, 1000);


document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div> Check the console logs</div>
`
