import { isWixWebSite, serverInformations, sendTelegramMessage, sendDiscordMessage, messageFormatForWebsiteFinder, extractTwitterAccountInfo, messageTwitterFormat, fixTheUrl, tryYourChance, tryYourChanceWithTwitter, removeTextInParenthesesAndSpaces, tryYourChanceContractERC } from '../utils/utils';
import { create, find, findByUrl, findByUserId } from '../mongodb/web-sites/web-sites.dao';
import { createSocialMedia } from '../mongodb/social-media/social-media.dao';
import { createWebSitePath } from '../constant/key-words.constant';
import { createPotentielAccount } from '../mongodb/potentiel-account/potentiel-account.dao';

// my chatId : -1002103762700
const createWebSite = async (stringUrl: string, originId, path, contractAddress?: any, deployerAddress?: any, tokenName?: string) => {
  // making sure it's a website
  let url;
  const urlRegex = /^(?:(?!:\/\/))(?:(?:www\.|(?!www))[^\s.]+\.[^\s]{2,}|localhost[\:?\d]*)\S*$/;
  console.log(stringUrl, urlRegex.test(stringUrl));
  !urlRegex.test(stringUrl) && (stringUrl = `https://${removeTextInParenthesesAndSpaces(stringUrl)}.com`);
  console.log(stringUrl);
  
  const info = await isWixWebSite(stringUrl);
  const webSiteType = info.type;
  const webSiteUserId = info.userId;
  const webSiteInfo = await serverInformations(stringUrl)
  if(webSiteInfo){
    const model = await create(stringUrl, webSiteInfo, webSiteType, webSiteUserId, originId)
    if(createWebSitePath.OTHER == path){
      const websiteList = await tryYourChanceContractERC(stringUrl, model?.id)
      console.log("websiteList",websiteList);
      if (websiteList && websiteList?.length > 0) {
        const message = messageFormatForWebsiteFinder(tokenName, contractAddress, websiteList, deployerAddress);
        //await sendTelegramMessage(message)
        await sendDiscordMessage(message as any);
      }
      return websiteList;
    } 
    return model
  }
  return null
}

const createTwitterWebSite = async (stringUrl: string, path, contractAddress?: any, deployerAddress?: any, tokenName?: string) => {
  try{
    const urlRegex = /^(?:(?!:\/\/))(?:(?:www\.|(?!www))[^\s.]+\.[^\s]{2,}|localhost[\:?\d]*)\S*$/;
    const url = !urlRegex.test(stringUrl) ? removeTextInParenthesesAndSpaces(stringUrl) : stringUrl
    console.log(stringUrl, urlRegex.test(stringUrl));
    !urlRegex.test(stringUrl) && (stringUrl = `https://twitter.com/${url}`);
    console.log("|||||||||",stringUrl, path);
    if(createWebSitePath.OTHER == path) {
      await tryYourChanceWithTwitter(url)
    }else{
      const info = await extractTwitterAccountInfo(stringUrl);
      const model = await createPotentielAccount(stringUrl, info, "twitter") //await createSocialMedia(stringUrl, info, "twitter")
      console.log("model", model);
      return model
    }
    //const message = messageTwitterFormat(model);
    //createWebSitePath.OTHER == path && await sendTelegramMessage(message)
    //createWebSitePath.OTHER == path && await sendDiscordMessage(message)
    return null;
  }catch{
    console.log("ERR createTwitterWebSite");
  }
}

const findWebSites = async (url: string, page: number, size: number) => {
  return await find(url, page, size)
}

const findWebSitesByUrl = async (url: string) => {
  return await findByUrl(url)
}

const findWebSitesByUserId = async (userId: string) => {
  return await findByUserId(userId)
}

export {
  createWebSite,
  findWebSites,
  findWebSitesByUrl,
  findWebSitesByUserId,
  createTwitterWebSite,
};