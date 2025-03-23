const mongoose = require('mongoose');

// Define a schema
export const socialMediaSchema = new mongoose.Schema({
  url: String,
  following: String,
  type : String,
  userId : String,
  registrationDate : Date,
  postsNbr: String
});

// Create a model
export const socialMediaModel = mongoose.model('social-media', socialMediaSchema);