// worker.js

import { connect } from "./mongodb/mongo-connection";
import { createTwitterWebSite } from "./services/web-site.service";
const { parentPort } = require('worker_threads');

connect()
// Worker thread logic
parentPort.on('message', async (message) => {
  console.log("message ", message);
  
  const result = await performComputation(message.url, message.path);
  parentPort.postMessage(result);
});

// Example: Perform some computation
function performComputation(url, path) {
  return createTwitterWebSite(url, null, path)
}