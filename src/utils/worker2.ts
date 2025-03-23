// worker.js

import { connect, disconnect } from "../mongodb/mongo-connection";
import { createTwitterWebSite } from "../services/web-site.service";
const { parentPort } = require('worker_threads');
const TelegramBot = require('node-telegram-bot-api');
const { Client, GatewayIntentBits } = require('discord.js');

connect()

// Handle messages received from the main thread
parentPort.on('message', async (message) => {
  if(message === "exit"){
    console.log("exit the worker");
    parentPort.emit('exit', 0);
  }else{
    console.log("Received message from main thread:", message);
    try {
        const result = await performComputation(message.url, message.path);
        parentPort.postMessage(result);
    } catch (error) {
      console.log("ERR Worker");
      parentPort.postMessage({ error: error.message });
    }
  }
  
});

// Example: Perform some computation
async function performComputation(newUrl, path) {
  const model = await createTwitterWebSite(newUrl, path);
  return model
}

// Clean up resources when the worker exits
parentPort.on('exit', () => {
  console.log("Worker thread has exited.");
  disconnect();
});