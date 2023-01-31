const express = require('express');
const cors = require('cors');
// const axios = require('axios'); 

const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;


// middle wares
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_MYUSER}:${process.env.DB_MYPASS}@cluster0.4urre.mongodb.net/?retryWrites=true&w=majority`;

//@cluster0-fxwlb.mongodb.net/test?retryWrites=true&w=majority
//@cluster0-xxxx.mongodb.net/test?retryWrites=true&w=majority
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status(401).send({message: 'unauthorized access'});
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'Forbidden access'});
        }
        req.decoded = decoded;
        next();
    })
}


async function run() {
  
    try {
      // client.connect()
      const serviceCollection = client.db("my_renew_server2").collection("usersCollection");
      const authorsCollection = client.db("my_renew_server2").collection("authors");
      const ordersCollection = client.db("my_renew_server2").collection("orders");
        // const orderCollection3 = client.db('geniusCar').collection('orders');

        app.post('/jwt', (req, res) =>{
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d'})
            res.send({token})
        }) 
        
        

        app.get('/services', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });


        // orders api
        app.get('/orders', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            
            if(decoded.email !== req.query.email){
                res.status(403).send({message: 'unauthorized access'})
            }

            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = ordersCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        });

        app.post('/orders', verifyJWT, async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.send(result);
        });

        app.patch('/orders/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const status = req.body.status
            const query = { _id: ObjectId(id) }
            const updatedDoc = {
                $set:{
                    status: status
                }
            }
            const result = await ordersCollection.updateOne(query, updatedDoc);
            res.send(result);
        })

        app.delete('/orders/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            res.send(result);
        })

        app.get("/authors", async (req, res) => {
          const query = {};
          const cursor = authorsCollection.find(query);
          const authors = await cursor.toArray();
          res.send(authors);
        });
        

    }
    finally {

    }

}

run().catch(err => console.error(err));


app.get('/', (req, res) => {
    res.send('book worm server is running')
})

app.listen(port, () => {
    console.log(`book worm server running on ${port}`);
})






