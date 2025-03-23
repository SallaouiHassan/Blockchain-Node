import express from 'express';
import http from 'http';
import cors from 'cors';
import { connect } from './mongodb/mongo-connection';
import { createWebSite, findWebSites, findWebSitesByUrl, findWebSitesByUserId, createTwitterWebSite } from './services/web-site.service';
import axios from 'axios';
import { extractUrl, discordMirror } from './utils/utils';
import { Server } from 'socket.io';
import { Config } from './discord-mirror/config';
import { MirrorClient } from './discord-mirror/client';
import { createWebSitePath } from './constant/key-words.constant';
const ioClient = require('socket.io-client');
const { Worker, isMainThread, parentPort } = require('worker_threads');

const app = express();
const server = http.createServer(app);
const port = 3001;
const io = new Server(server);
connect();
process.setMaxListeners(15);
console.log(`Main thread ${process.pid} is running`);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());


// Route to check if a website is built with Wix
app.get('/getUrlInfo/:url', async (req, res) => {
  try {
    const stringUrl = "https://crypto.com";
    console.log("stringUrl", stringUrl);
    const Model = await createWebSite(stringUrl, null, createWebSitePath.OTHER)
    res.send(Model)
  } catch (err) {
    console.log("ERR", err);
  }
});

app.get('/getWebSites/:page/:size/:url?', async (req, res) => {
  try {
    const url = req.params?.url;
    const page = Number(req.params?.page);
    const size = Number(req.params?.size);
    const webSites = await findWebSites(url, page, size)
    res.send(await webSites)
  } catch (e) {
    console.log("ERR", e);
  }
});

app.get('/getWebSitesByUserId/:userId', async (req, res) => {
  try {
    const userId = req.params?.userId;
    const webSites = await findWebSitesByUserId(userId)
    res.send(await webSites)
  } catch (e) {
    console.log("ERR", e);
  }
});

app.get('/test', async (req, res) => {
  try {
    const data = await axios.get("https://seashell-app-y8s6f.ondigitalocean.app/api/tokens-list/getFirstPage")
    const contracts = data?.data?.VerifiedContracts?.length ? data?.data?.VerifiedContracts : []
    if (contracts.length) {
      contracts.forEach((element) => {
        const foundcontent = element?.json?.foundcontent != undefined ? element?.json?.foundcontent : []
        if (foundcontent?.length) {
          console.log("######", foundcontent?.length);
          foundcontent.forEach(async (html) => {
            const extractedUrl = extractUrl(html);
            const match = (
              extractedUrl.match(/https:\/\/t.me/) != null ||
              extractedUrl.match(/https:\/\/twitter.com/) != null ||
              extractedUrl.match(/https:\/\/x.com/) != null
            );
            if (!match) {
              await createWebSite(extractedUrl, null, createWebSitePath.OTHER)
            } else {

            }
          })
        }
      });
    }
    res.send("Done")
  } catch (e) {
    console.log("ERR", e);
  }
});

app.get('/testsss', async (req, res) => {
  try {
    ["dcom(Funding: Binance 20)"].forEach((e, index) => {
      createTwitterWebSite(e, createWebSitePath.OTHER)
    })
    res.send("Done")
  } catch (e) {
    console.log("ERR", e);
  }
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  const socket = ioClient('http://localhost:3000/');
  socket.on('Messages', (data) => {
    console.log('Received data from server:', data?.msg?.socialresults ? data?.msg?.socialresults : data?.msg);
    // console.log('Received data from server:', data);
    if (data && data?.type == 'erc20') {
      console.log("ERC20 : ", data?.msg?.name);
      
      [data?.msg?.name].forEach((e) => {
        createWebSite(e, null, createWebSitePath.OTHER, data?.msg?.address, data?.msg?.owner, e);
        createTwitterWebSite(e, createWebSitePath.OTHER);
      });
    }
  });
  // const config = new Config("config.yml");
  // const client = new MirrorClient(config);

  // client.login(config.getToken());
  //discordMirror()
});