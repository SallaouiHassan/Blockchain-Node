const mongoose = require('mongoose');

// Define a schema
export const potentielAccountSchema = new mongoose.Schema({
  url: String,
  following: String,
  type : String,
  userId : String,
  registrationDate : Date,
  postsNbr: String,
  originId: String
});

// Create a model
export const potentielAccountModel = mongoose.model('potentiel-account', potentielAccountSchema);