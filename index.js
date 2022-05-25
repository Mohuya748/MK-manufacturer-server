const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lrbdn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();
    const partsCollection = client.db('parts-manufacture').collection('parts');
    const userCollection = client.db('parts-manufacture').collection('users');
    const bookingsCollection = client.db('parts-manufacture').collection('bookings');

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

    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    })

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

    app.get('/booking', async(req, res) =>{
      const email = req.query.email;
      const query = {email: email};
      console.log("new  item",email);
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
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