import { socialMediaModel } from "./model";

const createSocialMedia = async (stringUrl: string, webSiteInfo: any, webSiteType: string): Promise< any | null> => {
  return await socialMediaModel.findOneAndUpdate({ url: stringUrl }, {
    url: stringUrl,
    type: webSiteType,
    userId: webSiteInfo.id,
    registrationDate: webSiteInfo.accountCreation !== '' ? new Date(webSiteInfo.accountCreation) : new Date(),
    following: webSiteInfo.followingNbr,
    postsNbr: webSiteInfo.postsNbr
  }, {
    upsert: true,
    new: true,
  });
}

export { createSocialMedia };