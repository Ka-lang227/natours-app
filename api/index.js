const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars (for local development; Vercel uses dashboard env vars)
dotenv.config({ path: './config.env' });

const app = require('../app');

// Connect to MongoDB (with caching for serverless)
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  
  const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
  );
  
  await mongoose.connect(DB);
  isConnected = true;
  console.log('DB connection successful!');
};

// Wrap the app to ensure DB connection
module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
