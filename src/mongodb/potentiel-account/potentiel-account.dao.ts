import { potentielAccountModel } from "./model";

const createPotentielAccount = async (stringUrl: string, webSiteInfo: any, webSiteType: string): Promise< any | null> => {
  return await potentielAccountModel.findOneAndUpdate({ url: stringUrl }, {
    url: stringUrl,
    type: webSiteType,
    userId: webSiteInfo.id,
    registrationDate: webSiteInfo.accountCreation !== '' ? new Date(webSiteInfo.accountCreation) : new Date(),
    following: webSiteInfo.followingNbr,
    postsNbr: webSiteInfo.postsNbr,
    originId : null
  }, {
    upsert: true,
    new: true,
  });
}

export { createPotentielAccount };