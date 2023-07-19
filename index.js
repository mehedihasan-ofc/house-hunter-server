const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express()
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' })
  }
  // bearer token
  const token = authorization.split(' ')[1]

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded
    next()
  })
}

// ========================================================================>
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d9zindd.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect();

    //===> collection
    const sliderCollection = client.db('houseHunterDB').collection('sliders');
    const houseCollection = client.db('houseHunterDB').collection('houses');
    const userCollection = client.db('houseHunterDB').collection('users');

    //--> houses data
    app.get('/sliders', async (req, res) => {
      const result = await sliderCollection.find().toArray();
      res.send(result);
    })

    //--> houses data
    app.get('/houses', async (req, res) => {
      const result = await houseCollection.find().toArray();
      res.send(result);
    })

    // Assuming you have a POST endpoint '/register' using Express.js
    app.post('/register', async (req, res) => {
      const user = req.body;
      const { fullName, email, password, phoneNumber, role } = user;

      // Check if the user already exists with the same username or email
      const existingUser = await userCollection.findOne({
        $or: [{ fullName }, { email }],
      });

      if (existingUser) {
        return res.status(400).send({ message: 'User already exists' });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate a JWT
      const token = jwt.sign({ email }, process.env.SECRET_KEY, { expiresIn: '7d' });

      // Store the user data in the MongoDB collection
      const result = await userCollection.insertOne({
        fullName,
        email,
        password: hashedPassword,
        phoneNumber,
        role,
        token
      });

      res.send({ result, email, token });

      // res.send('User registered successfully');
    });

    // Assuming you have a POST endpoint '/login' using Express.js
    app.post('/login', async (req, res) => {
      const { email, password } = req.body;

      // Retrieve the user's data from the MongoDB collection
      const user = await userCollection.findOne({ email });

      if (!user) {
        return res.status(404).send('User not found');
      }

      // Compare the stored hashed password with the provided password
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).send({ message: 'Invalid password' });
      }

      // Generate a new JWT
      const token = jwt.sign({ email }, process.env.SECRET_KEY, { expiresIn: '7d' });

      // Update the user's token in the database
      const result = await userCollection.updateOne(
        { email },
        { $set: { token } }
      );

      res.send({ result, email, token });
    });

    // Assuming you have a POST endpoint '/logout' using Express.js
    app.post('/logout', async (req, res) => {
      const token = req.body.token;

      // Find the user in the MongoDB collection based on the token
      const user = await userCollection.findOne({ token });

      if (!user) {
        return res.status(404).send('User not found');
      }

      // Update the user's token to an empty value or remove it from the user document
      const result = await userCollection.updateOne(
        { _id: user._id },
        { $unset: { token: 1 } }
      );

      res.send(result);
    });


    app.get('/house-owner', verifyJWT, async (req, res) => {
      const email = req.query.email;
      if (req.decoded.email !== email) {
        res.send({ houseOwner: false })
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const result = { houseOwner: user?.role === "House Owner" }
      res.send(result);
    });

    app.get('/get-role', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    app.get('/my-houses', verifyJWT, async (req, res) => {
      const email = req.query.email;

      if (!email) {
        res.send([]);
      }

      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ error: true, message: 'forbidden access' })
      }

      const query = { owener_email: email };
      const result = await houseCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/houses', verifyJWT, async (req, res) => {
      const newHouse = req.body;
      const result = await houseCollection.insertOne(newHouse);
      res.send(result);
    })

    app.delete('/houses/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await houseCollection.deleteOne(query);
      res.send(result);
    })

    app.get('/house-edit/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await houseCollection.findOne(query);
      res.send(result);
    })

    app.put('/houses-update/:id', async (req, res) => {
      const houseId = req.params.id;
      const updatedData = req.body;

      const result = await houseCollection.updateOne(
        { _id: new ObjectId(houseId) },
        { $set: updatedData }
      );

      res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
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