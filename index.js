const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lrbdn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const partsCollection = client.db('parts-manufacture').collection('parts');
    const userCollection = client.db('parts-manufacture').collection('users');
    const bookingsCollection = client.db('parts-manufacture').collection('bookings');
    const reviewsCollection = client.db('parts-manufacture').collection('reviews');
    const profileCollection = client.db('parts-manufacture').collection('profile');


    app.get('/parts', async (req, res) => {
      const query = {};
      const cursor = partsCollection.find(query);
      const parts = await cursor.toArray();
      res.send(parts);
    });

    app.get('/parts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await partsCollection.findOne(query);
      res.send(result);

    });


    app.get('/reviews', async (req, res) => {
      const query = {};
      const cursor = reviewsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // POST: add a new review
    app.post('/reviews', async (req, res) => {
      const reviews = req.body;
      console.log("adding new  item", reviews);
      const result = await reviewsCollection.insertOne(reviews);
      res.send(result);
    })

    // POST: add a new product
    app.post('/parts', async (req, res) => {
      const products = req.body;
      console.log("adding new  item", products);
      const result = await partsCollection.insertOne(products);
      res.send(result);
    })


    app.delete('/parts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await partsCollection.deleteOne(query);
      res.send(result);
    })


    app.get('/user', verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });


    app.get('/admin/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === 'admin';
      res.send({ admin: isAdmin })
    })



    app.put('/user/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({ email: requester });
      if (requesterAccount.role === 'admin') {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: 'admin' },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      }
      else {
        res.status(403).send({ message: 'forbidden' });
      }
    })

    app.get('/profile', async (req, res) => {
      const query = {};
      const cursor = profileCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.put('/profile/:email', async (req, res) => {
      const email = req.params.email;
      const profile = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: profile
      };
      const result = await profileCollection.updateOne(filter, updateDoc, options);
   
      res.send(result);
    })


    app.get('/user', verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });


    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ result, token });
    })

    app.get('/user', verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    // update item quantity 
    //  app.put('/parts/:id', async (req, res) => {
    //   const id = req.params.id;
    //   const updateItem = req.body;
    //   console.log(id, updateItem)
    //   const filter = { _id: ObjectId(id) };
    //   console.log(filter)
    //   const options = { upsert: true };
    //   const updatedDoc = {
    //     $set: {
    //       available_Quantity : updateItem.quantity,
    //     }
    //   };
    //   console.log(updatedDoc)
    //   const result = await partsCollection.updateOne(filter, updatedDoc, options);
    //   res.send(result);

    // })

    app.get('/booking', verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const result = await bookingsCollection.find(query).toArray();
        return res.send(result);
      }
      else {
        return res.status(403).send({ message: 'forbidden access' });
      }
    })

    // POST: add a booking
    app.post('/booking', async (req, res) => {
      const newbooking = req.body;
      console.log("adding new  item", newbooking);
      const result = await bookingsCollection.insertOne(newbooking);
      res.send(result);
    })


  }
  finally {

  }
}

run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('db connected')
})

app.listen(port, () => {
  console.log(`parts manufacturer listening on port ${port}`)
})