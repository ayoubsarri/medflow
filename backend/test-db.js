// we're trying the connection to the database here if it works we know our config/database.js is correct
require('dotenv').config();
const { connectToDatabase } = require('./config/database');

async function test() {
  const db = await connectToDatabase();
  console.log('✅ Connection successful!');
  process.exit();
}

test();