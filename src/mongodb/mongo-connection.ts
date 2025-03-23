const mongoose = require('mongoose');

async function connect() {
  try {
    await mongoose.connect('mongodb-connection');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Function to disconnect from MongoDB
async function disconnect(): Promise<void> {
  return await mongoose.disconnect().then(() => {
    console.log('Disconnected from MongoDB');
  }).catch((err) => {
    console.log("err", err);
    
  });
}

export { connect, disconnect };