import axios from 'axios';
import cheerio from 'cheerio';
import { createWebSitePath, twitterKeys, websiteKeys } from '../constant/key-words.constant';
import { createTwitterWebSite, createWebSite } from '../services/web-site.service';
const { Worker } = require('worker_threads');
const path = require('path');

const whois = require('whois-json');
const TelegramBot = require('node-telegram-bot-api');
const { Client, GatewayIntentBits } = require('discord.js');
const puppeteer = require('puppeteer');

const isWixWebSite = async (url: string) => {
  try {
    let userId: string | null = null;
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const scripts: string[] = [];
    const isWixSite = $('meta[name^="wix-"]')?.length > 0 ||
      $('.wix-logo-container, .wix-view, .wix-renderer')?.length > 0 ||
      url.includes('.wixsite.com') || url.includes('/site/');
    $('script').each((index, element) => {
      scripts.push($(element).html());
    });
    scripts.forEach(script => {
      const match = script.match(/['"]userId['"]:['"]([^'"]+)['"]/);
      (match && match[1]) && (userId = match[1]);
    });

    return {
      type: isWixSite ? "Wix" : "Other",
      userId: userId
    }
  } catch (error) {
    return {
      type: "Other",
      userId: null
    }
  }
}

const extractTwitterAccountInfo = async (url: string) => {
  try {
    const html = await getTwitterHtml(url);
    let postsNbr: any;
    let id: any;
    let accountCreation: any;

    const $ = cheerio.load(html);
    const followingNbr = $('.css-1rynq56').text().match(/Following\s*([^ ]+)/)
    $('.css-1rynq56').each((i, element) => {
      postsNbr == null && (postsNbr = $(element).html().match(/(.+?) posts/));
      id == null && (id = $(element).html().match(/@(\w+)/));
      accountCreation == null && (accountCreation = $(element).html().match(/Joined (\w+ \d{4})/));
    });
    return { postsNbr: postsNbr[0], id: id[0], accountCreation: accountCreation[1], followingNbr: followingNbr[1] }
  } catch (error) {
    console.log("Error :", error)
  }
}

const getTwitterHtml = async (url: string) => {
  try {
    const user_email = "email";
    const user_handle = "username"; //either your handle or phone number
    const password = "password";
    const browser = await puppeteer.launch({
      headless: 'new',
      // `headless: true` (default) enables old Headless;
      // `headless: 'new'` enables new Headless;
      // `headless: false` enables “headful” mode.
    });
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });
    // Navigate to Twitter login page
    await page.goto("https://twitter.com/i/flow/login");
    await page.waitForNetworkIdle({ idleTime: 1500 });
    ///////////////////////////////////////////////////////////////////////////////////
    // Select the user input
    //await page.waitForSelector("[autocomplete=username]");
    await page.type("input[autocomplete=username]", user_handle, { delay: 50 });

    await page.waitForNetworkIdle({ idleTime: 1500 });

    // Wait for the button to be present in the DOM
    await page.waitForSelector('.css-175oi2r.r-sdzlij.r-1phboty.r-rs99b7.r-lrvibr.r-ywje51.r-usiww2.r-13qz1uu.r-2yi16.r-1qi8awa.r-ymttw5.r-1loqt21.r-o7ynqc.r-6416eg.r-1ny4l3l');

    // Click the "Suivant" button
    await page.click('.css-175oi2r.r-sdzlij.r-1phboty.r-rs99b7.r-lrvibr.r-ywje51.r-usiww2.r-13qz1uu.r-2yi16.r-1qi8awa.r-ymttw5.r-1loqt21.r-o7ynqc.r-6416eg.r-1ny4l3l');
    await page.waitForNetworkIdle({ idleTime: 2000 });
    const extractedText = await page.$eval("*", (el) => el.innerText);

    // Select the password input
    await page.waitForSelector('[autocomplete="current-password"]');
    await page.type('[autocomplete="current-password"]', password, { delay: 50 });
    // Press the Login button
    await page.click('div[data-testid="LoginForm_Login_Button"]');

    await page.waitForNetworkIdle({ idleTime: 2000 });
    await page.goto(url, { waitUntil: 'networkidle2' });
    ////console.log("2 extractedTextssss #####", await page.$eval("*", (el) => el.innerText));
    await page.waitForTimeout(3000);
    const html = await page.content();
    await browser.close();
    return html;
  } catch (err) {
    console.log("err", err);
  }
}

const sendTelegramMessage = async (message: string) => {
  const botToken = "";
  const chatId = ""
  const bot = new TelegramBot(botToken, { polling: true });
  bot.sendMessage(chatId, message)
    .then((data) => {
      bot.stopPolling();
    })
    .catch((error) => {
      bot.stopPolling();
    });
}

const sendDiscordMessage = async (body: string) => {
  const botToken = "";
  const channelId = '';
  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
  client.login(botToken);
  client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    await client.channels.fetch(channelId).then(channel => {
      channel.send(body);
      console.log('Message Discord sent successfully', body);
      client.destroy();
    }).catch(error => {
      console.log('Error sending Discord message:', error);
      client.destroy();
    });
  });
}

const discordMirror = async () => {
  const botToken = "";
  const serverAId = "";
  const channelAId = '';
  const clientA = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  clientA.login(botToken);

  clientA.on('messageCreate', async (message) => {
    // Check if the message is from the desired server and channel
    if (message.guild.id === serverAId && message.channel.id === channelAId) {
      console.log(`Message Discord sent successfully To Channel ${message.content}`);
    }
  });
}

const serverInformations = async (stringUrl) => {
  try {
    const domain = fixTheUrl(stringUrl)
    const results = await whois(domain);
    return results?.registrar ? getDataFromWhoIs(results) : await scrapingFromWhoIs(domain)
  } catch (error) {
    console.log("who is error");
    return null
  }
}

const scrapingFromWhoIs = async (domain) => {
  const response = await axios.get("https://who.is/whois/" + domain);
  const html = response.data;
  const $ = cheerio.load(html);
  const mapper = { 'name': 'hostDomain', 'expires on': 'expiryDate', 'registered on': 'registrationDate' }
  const exractData = {}
  $('.queryResponseBodyRow').each((index, element) => {
    const text = $(element).find('.queryResponseBodyKey').text().trim();
    const key = $(element).find('.queryResponseBodyValue').text().trim();
    text && (exractData[mapper[text.toLocaleLowerCase()]] = key)
  });
  console.log("scrapingFromWhoIs", exractData);
  return exractData;
}

const getDataFromWhoIs = async (data) => {
  const mapper = { 'registrar': 'hostDomain', 'registrarRegistrationExpirationDate': 'expiryDate', 'creationDate': 'registrationDate' }
  const exractData = {}
  for (const property in data) {
    exractData[mapper[property]] = data[property]
  }
  return exractData
}

const fixTheUrl = (stringUrl) => {
  try {
    const url = new URL(stringUrl)
    const domain = url.hostname.split('.').slice(-2).join('.');
    return domain
  } catch (error) {
    console.log("URL INVALID");
    return null;
  }
}

const tryYourChance = async (url, originId) => {
  const domain = fixTheUrl(url)
  const domainName = domain.match(/^([^.]+)\./)
  const webSiteName = domainName.length && domainName[1];
  const topLevelDomain = domain.match(/\.([a-zA-Z]+)$/) && domain.match(/\.([a-zA-Z]+)$/)[0];
  console.log("webSiteName", webSiteName);

  await delayedForEach(websiteKeys, async (key, index) => {
    const newUrl = "https://www." + webSiteName + key;
    console.log("test", newUrl, key, topLevelDomain);
    try {
      const response = await axios.get(newUrl);
      if (response.status >= 200 && response.status < 300) {
        console.log(`Website ${newUrl} exists.`);
        topLevelDomain != key && createWebSite(newUrl, originId, createWebSitePath.TRY_YOUR_CHANCE)
      } else {
        console.log(`Website ${newUrl} returned status code ${response.status}.`);
        topLevelDomain != key && createWebSite(newUrl, originId, createWebSitePath.TRY_YOUR_CHANCE)
      }
    } catch (error) {
      if (error?.response) {
        console.log(` Website ${newUrl} returned status code ${error.response.status}.`);
      } else {
        console.log(`Error accessing website ${newUrl}: ${error.message}`);
      }
    }
  }, 50);
}

const tryYourChanceContractERC = async (url, originId) => {
  console.log("url : ", url);
  const websitesList = []
  let webSiteName = url;
  const urlRegex = /^(?:(?!:\/\/))(?:(?:www\.|(?!www))[^\s.]+\.[^\s]{2,}|localhost[\:?\d]*)\S*$/;
  if (urlRegex.test(url)) {
    const domain = fixTheUrl(url)
    console.log("domain : ", domain);
    const domainName = domain.match(/^([^.]+)\./)
    console.log("domainName : ", domainName);
    webSiteName = domainName.length && domainName[1];
  }
  
  console.log("webSiteName", webSiteName);
  const result = (await Promise.all(websiteKeys.map( async key => {
    const newUrl = "https://www." + webSiteName + key;
    console.log("test", newUrl, key);
    try {
      const response = await axios.get(newUrl);

      if (response.status >= 200 && response.status < 300) {
        console.log(`Website ${newUrl} exists.`);
        // topLevelDomain != key && createWebSite(newUrl, originId, createWebSitePath.TRY_YOUR_CHANCE)
        const website = await createWebSite(newUrl, originId, createWebSitePath.TRY_YOUR_CHANCE)
        website != null && websitesList.push(website)
        return website
      } else {
        console.log(`Website ${newUrl} returned status code ${response.status}.`);
        // topLevelDomain != key && createWebSite(newUrl, originId, createWebSitePath.TRY_YOUR_CHANCE)
        const website = await createWebSite(newUrl, originId, createWebSitePath.TRY_YOUR_CHANCE)
        website != null && websitesList.push(website)
        return website
      }
    } catch (error) {
      if (error?.response) {
        console.log(` Website ${newUrl} returned status code ${error.response.status}.`);
      } else {
        console.log(`Error accessing website ${newUrl}: ${error.message}`);
      }
    }
  }))).filter(result => result !== null && result !== undefined);
  return result
}

const tryYourChanceWithTwitter = async (userId) => {
  let index = 0;
  console.log("userId", userId);
  for (let i = 0; i < 8; i++) {
    try {
      index = await executeWorkerGroup(userId, index, twitterKeys.length)
      console.log("index", index);
      
    } catch (error) {
      console.log("error");
    }
  }
}

const executeWorkerGroup = async (userId, index, lenght) => {
  console.log("index", index, index + 4);
  console.log("lenght", lenght);
  // Loop to create and start each worker in the group
  let counter = 0;
  const workerPromises = [];
  for (let i = index; i < index + 4; i++) {
    counter = i;
    let key = twitterKeys[i]
    const newUrl = "https://twitter.com/" + userId + key;
    console.log("test", newUrl, key);
    const workerPromise = new Promise<void>((resolve, reject) => {
      const worker = new Worker(path.join(__dirname, 'worker2.ts'));
      worker.on('message', async message => {
        // bilal ila bghiti tbadal message
        worker.postMessage("exit");
        if(message != null && message != undefined){
          console.log(`Received message from worker: `,message?._doc);
          const msg = messageTwitterFormat(message?._doc);
          await sendDiscordMessage(msg)
        }
        worker.terminate();
        resolve();
      });
      worker.postMessage({ url: newUrl, path: createWebSitePath.TRY_YOUR_CHANCE });
      worker.on('error', reject);
    });
    workerPromises.push(workerPromise);
  }
  // Wait for all workers in the group to finish
  await Promise.all(workerPromises);
  return index + 4;
};

async function delayedForEach(array, callback, delay) {
  for (let i = 0; i < array.length; i++) {
    await new Promise(resolve => setTimeout(resolve, delay));
    callback(array[i], i, array);
  }
}

const extractUrl = (html) => {
  const $ = cheerio.load(html);
  const existingUrl = $('a').attr('href');
  return existingUrl
}

const getTheDomainName = (data) => {
  const match = data.match(/\sin\s([^'"]+)./);
  return match && match[1]
}

const messageFormatForWebsiteFinder = (tokenName: string, contractAddress: string, websiteList: any, deployer: string) => {
  // const registrationDate = new Date(model?.registrationDate);
  // const expiryDate = new Date(model?.expiryDate);
  // return `
  // Website found! 

  // ${model?.url}
  // Contract 0x82a0fd3562416b978b38291ec63f0a75cc427c1a
  // ${model?.hostDomain} 
  // type: ${model?.type} 
  // ${registrationDate?.getDate()}/${registrationDate?.getMonth()}/${registrationDate?.getFullYear()} - ${expiryDate?.getDate()}/${expiryDate?.getMonth()}/${expiryDate?.getFullYear()}
  // `;
  let websitesValuesStr = ``;
  let registrationDateValuesStr = ``;
  websiteList?.forEach((website: any) => {
    websitesValuesStr += `${website?.url}\n`;
    const registrationDate = new Date(website?.registrationDate);
    registrationDateValuesStr += `${registrationDate.getMonth()+1}/${registrationDate.getDate()}/${registrationDate.getFullYear()}\n`;
  });
  const body = {
    "content": null,
    "embeds": [
      {
        "description": "```Contract : "+ contractAddress + "``````Deployer : " + deployer + "```\n**Potential Websites**",
        "color": null,
        "fields": [
          {
            "name": "Links",
            "value": websitesValuesStr,
            "inline": true
          },
          // {
          //   "name": "Countries",
          //   "value": "Morocco\nUSA\nUSA\nUSA\nUSA\nUSA",
          //   "inline": true
          // },
          {
            "name": "Registration",
            "value": registrationDateValuesStr,
            "inline": true
          }
        ],
        "author": {
          "name": tokenName
        }
      }
    ],
    "username": "Seercord",
    "avatar_url": "https://i.imgur.com/imOdteG.png",
    "attachments": []
  };
  return body;
}

const messageTwitterFormat = (model: any) => {
  const registrationDate = new Date(model?.registrationDate);
  return `
  Twitter Account! 

  ${model?.url}
  ID ${model.userId}
  Type: ${model?.type} 
  Following : ${model?.following}
  Posts : ${model?.postsNbr}
  ${registrationDate?.getDate()}/${registrationDate?.getMonth()}/${registrationDate?.getFullYear()}
  `;
}

const removeTextInParenthesesAndSpaces = (text) => {
  const withoutParentheses = text.replace(/\([^()]*\)/g, '');
  const withoutSpaces = withoutParentheses.replace(/\s/g, '');
  return withoutSpaces?.toLowerCase();
}

export {
  isWixWebSite,
  serverInformations,
  sendTelegramMessage,
  sendDiscordMessage,
  fixTheUrl,
  messageFormatForWebsiteFinder,
  extractUrl,
  extractTwitterAccountInfo,
  messageTwitterFormat,
  discordMirror,
  tryYourChance,
  tryYourChanceWithTwitter,
  removeTextInParenthesesAndSpaces,
  tryYourChanceContractERC
};