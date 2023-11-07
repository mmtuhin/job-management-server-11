const express = require("express");
const app = express();
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require('dotenv').config();
const port = 5000;



//MiddleWare

//parser
app.use(express.json())
app.use(cors());

//tuhinhossaindev
//I5fNK9cGGZMxr53J

//DB URI
const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1fkl4oh.mongodb.net/?retryWrites=true&w=majority`;

//MongoDB Connection
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();

    //collections
    const jobCategoryCollection = client
      .db("applicruit_db")
      .collection("job-categories");
    
    const jobCollection = client.db("applicruit_db").collection("jobs")

    //get job categories (Part-time, remote...)
    app.get("/api/v1/job_categories", async (req, res) => {
      const cursor = jobCategoryCollection.find();
      const result = await cursor.toArray();

      res.send(result);
    });

    //create A job
    app.post('/api/v1/user/add_job', async(req, res) => {
        // console.log(JSON.parse(req.body.jobCategory));
        const job = req.body
        console.log(job);
        const result = await jobCollection.insertOne(job)
        res.send(result)
    })
    //find a job
    app.get('/jobdetails/:id', async(req, res) => {
      const id = req.params.id
      console.log(id);
      const query = { _id: new ObjectId(id)}
      const result  = await jobCollection.findOne(query)
      res.send(result)
    })

    //Find All jobs
    app.get('/api/v1/jobs', async(req, res) => {
      const cursor = jobCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Applicruit listening on port ${port}`);
});
