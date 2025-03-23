import mongoose, { Document, Model } from 'mongoose';

// Define a schema
const webSiteSchema = new mongoose.Schema({
  url: String,
  hostDomain: String,
  type: String,
  userId: String,
  registrationDate: Date,
  expiryDate: Date,
  originId: String,
});

// Define types for document and model
interface WebSite {
  url: string;
  hostDomain?: string;
  type: string;
  userId: string;
  registrationDate?: Date;
  expiryDate?: Date;
  originId?: string;
}

interface WebSiteDocument extends WebSite, Document {}

// Create a model
const WebSiteModel: Model<WebSiteDocument> = mongoose.model<WebSiteDocument>('web-site', webSiteSchema);
export { WebSiteModel, WebSite, WebSiteDocument };