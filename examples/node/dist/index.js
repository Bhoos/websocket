"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const websocket_1 = require("@bhoos/websocket");
const config = {
    PING_INTERVAL: 1000,
    RECONNECT_INTERVAL: 5000,
    MSG_BUFFER_SIZE: 20,
    PING_MESSAGE: 'ping'
};
const agent = new websocket_1.ReliableWS('ws://localhost:3030/subscribe/', config);
agent.send(JSON.stringify({ type: 'ping' }));
agent.onerror = (event) => {
    console.log("Error: ", event.message);
};
agent.onopen = (event) => {
    console.log("Opened!!");
    agent.close();
};
agent.onmessage = (event) => {
    console.log(event.data);
};
agent.onclose = (ev) => {
    console.log("closed");
};
setTimeout(() => { console.log('1s'); }, 1000);
//# sourceMappingURL=index.js.map