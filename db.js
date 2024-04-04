// db.js (неизмененный)

const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://REMY:lFyjD804j4tfFGy7@apple-home.6anx59i.mongodb.net/";
const dbName = "AppleHome";

async function connectToDatabase() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to the database");
    return client.db(dbName);
  } catch (error) {
    console.error("Error connecting to the database:", error);
    return null;
  }
}

module.exports = { connectToDatabase };
