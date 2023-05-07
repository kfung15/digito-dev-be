const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");

app.use(express.json());
app.use(cors());

// Load up env vars
const result = dotenv.config();

if (result.error) {
  throw result.error;
}

// Spin up Mongo
const client = new MongoClient(process.env.MONGO_TEST_API_KEY, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let dbConnected = false;

client
  .connect()
  .then(() => {
    console.log("Connected to MongoDB");
    dbConnected = true;
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB");
    console.error(error);
  });

app.post("/update-login-data", async (req, res) => {
  if (dbConnected == false) {
    console.error("Error: MongoDB connection not established");
    res.status(500).send("Internal Server Error");
    return;
  }

  try {
    let profileCollection = client.db("profileMaster").collection("profile");

    let findProfile = await profileCollection
      .find({
        walletAddress: req.body.walletAddr.toLowerCase(),
      })
      .toArray();

    if (findProfile.length === 0) {
      // User not yet registered

      await profileCollection.insertOne({
        walletAddress: req.body.walletAddr.toLowerCase(),
        emailAddress: req.body.emailAddr.toLowerCase(),
        lastLoginTime: Math.floor(Date.now() / 1000),
      });
      console.log("New User: " + req.body.emailAddr);
    } else {
      await profileCollection.updateOne(
        {
          walletAddress: req.body.walletAddr.toLowerCase(),
        },
        {
          $set: {
            lastLoginTime: Math.floor(Date.now() / 1000),
          },
        }
      );
      console.log("Updated: " + req.body.emailAddr);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("Error processing update login data request");
    console.error(err);
    res.sendStatus(500);
  }
});

app.listen(process.env.PORT, () => {
  console.log("Server Started");
});
