import { WebSiteModel, WebSiteDocument } from "./model";
import { webSitesAggregation, paginationForm } from "../../utils/mongodbUtils";

const create = async (stringUrl: string, webSiteInfo: any, webSiteType: string, webSiteUserId: string, originId): Promise<WebSiteDocument | null> => {
  try{
    return await WebSiteModel.findOneAndUpdate({ url: stringUrl }, {
      url: stringUrl,
      hostDomain: webSiteInfo?.hostDomain,
      type: webSiteType,
      userId: webSiteUserId,
      registrationDate: webSiteInfo?.registrationDate !== '' ? new Date(webSiteInfo?.registrationDate) : null,
      expiryDate: webSiteInfo?.expiryDate !== '' ? new Date(webSiteInfo?.expiryDate) : null,
      originId : originId,
    }, {
      upsert: true,
      new: true,
    });
  }catch{
    console.log("ERR");
    
  }
  
}

const find = async (url: string, page: number = 1, size: number = 10): Promise<WebSiteDocument[]> => {
  const match : any = { $match : { url: { $regex: url, $options: 'i' } } }
  const { paginatedDataPipeline, totalCountPipeline } = webSitesAggregation(page, size)
  const aggregation = [
    {
      $facet: {
        paginatedData: paginatedDataPipeline,
        totalCount: totalCountPipeline
      }
    },
  ]
  if (url !== undefined) {
    aggregation.unshift(match);
  }
  const mongoResult = await WebSiteModel.aggregate(aggregation);
  const result = paginationForm(mongoResult, size, page);
  return result;
}

const findByUrl = async (url: string): Promise<WebSiteDocument[]> => {
  return await WebSiteModel.find({ url: { $regex: url, $options: 'i' } });
}

const findByUserId = async (userId: string): Promise<WebSiteDocument[]> => {
  return await WebSiteModel.find({ userId: userId });
}

export { create, find, findByUrl, findByUserId };