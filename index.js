const express = require('express');
const app = express()
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express());

// ========================================================================>
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://<username>:<password>@cluster0.d9zindd.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
// ========================================================================>

app.get('/', (req, res) => {
  res.send('House Hunter is running')
})

app.listen(port, () => {
  console.log(`House Hunter listening on port ${port}`)
})

/* 
https://i.ibb.co/LzPbwdF/design-house-modern-villa-with-open-plan-living-private-bedroom-wing-large-terrace-with-privacy.jpg
https://i.ibb.co/Wvt4ywH/house-with-garage-house-left-side.jpg
https://i.ibb.co/wRrrTMR/modern-apartment-architecture.jpg
https://i.ibb.co/b1L5Zg2/road-city.jpg
*/