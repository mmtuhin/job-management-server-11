const express = require("express");
const app = express();
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;


//MiddleWare

//parser
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'https://applicruit.web.app'],
  credentials: true,
}));
app.use(cookieParser())

//tuhinhossaindev
//I5fNK9cGGZMxr53J

//DB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1fkl4oh.mongodb.net/?retryWrites=true&w=majority`;

//MongoDB Connection
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  // console.log('token in middleware', token);
  if(!token){
    return res.status(401).send({message: 'Unauthorized Access'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if(err){
      return res.status(401).send({message: 'Unauthorized Access'})
    }
    req.user = decoded;
    next();
  } )
  // next()
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();

    //collections
    const jobCategoryCollection = client
      .db("applicruit_db")
      .collection("job-categories");

    const jobCollection = client.db("applicruit_db").collection("jobs");
    const appliedJobsCollection = client
      .db("applicruit_db")
      .collection("applied_jobs");

    //Auth Type API
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'1h'})
      res.cookie('token', token, {
        httpOnly:true,
        secure: true,
        sameSite: 'none',
        maxAge: 60 * 60 * 1000
      }).send({success : true})
    })

    //Clear cookie after logout
    app.post('/logout', async(req, res) => {
      const user = req.body;
      console.log(user);
      res.clearCookie('token',{maxAge: 0, secure: true, sameSite: 'none'}).send({success: true})
    })

    //Create Token and send cookie to browser

    //get job categories (Part-time, remote...)
    app.get("/api/v1/job_categories", async (req, res) => {
      const cursor = jobCategoryCollection.find();
      const result = await cursor.toArray();

      res.send(result);
    });

    //create A job
    app.post("/api/v1/user/add_job", async (req, res) => {
      // console.log(JSON.parse(req.body.jobCategory));
      const job = req.body;
      console.log(job);
      const result = await jobCollection.insertOne(job);
      res.send(result);
    });
    //find a job
    app.get("/jobdetails/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await jobCollection.findOne(query);
      res.send(result);
    });

    //Update A job
    app.put('/jobs/:id' , async(req, res) => {
      const id = req.params.id
      const filter = {_id: new ObjectId(id)}
      const options = { upsert: true}
      const updatedjob = req.body
      console.log(updatedjob);
      const job = {
        $set:{
          jobCategory: updatedjob.jobCategory,
          bannerUrl: updatedjob.bannerUrl,
          postDate: updatedjob.postDate,
          salary: updatedjob.salary,
          submitDeadline: updatedjob.submitDeadline,
          companyImgUrl: updatedjob.companyImgUrl,
          companyName: updatedjob.companyName,
          jobLocation: updatedjob.jobLocation,
          description: updatedjob.description,
          jobTitle: updatedjob.jobTitle,
          applicantsNumber: updatedjob.applicantsNumber,
          postUserName: updatedjob.postUserName,
          postUserEmail: updatedjob.postUserEmail,
        }
      }
      const result = await jobCollection.updateOne(filter, job, options)
      res.send(result)
    })


    //delete a job from myJobs
    app.delete('/api/v1/jobs/:id', async(req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = {_id:new ObjectId(id)};
      const result = await jobCollection.deleteOne(query)
      res.send(result)
    })

    //Find All jobs
    app.get("/api/v1/jobs", async (req, res) => {
      const cursor = jobCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //find Logged in user posted jobs
    app.get('/myjobs/:email',verifyToken, async (req, res) => {
      const email = req.params.email;
      // console.log(email);
      console.log('Token Owner', req.user);
      if(req.user.email !== email){
        return res.status(403).send({message: 'forbidden access'})
      }
      const query = {postUserEmail: email}
      const cursor =  jobCollection.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })

    //Add to applied jobs
    app.post("/appliedjobs", async (req, res) => {
      const appliedJob = req.body; 
      //console.log(appliedJob);
      const {jobId} = appliedJob
      
       const filter = {_id: new ObjectId(jobId)} //Filter for specific id of job db.
      const incApplicants = await jobCollection.updateOne(filter, {$inc: {applicantsNumber: 1}})
      console.log(incApplicants);
      const result = await appliedJobsCollection.insertOne(appliedJob)
      res.send(result);
    });

    //get all the applied jobs
    app.get('/appliedjobs/:loggeduseremail',verifyToken, async(req, res) =>{
      const logged_user_email = req.params.loggeduseremail
      console.log(req.user.email);
      if(req.user.email !== logged_user_email){
        return res.status(403).send({message: 'forbidden access'})
      }
      const query = {applicantEmail: logged_user_email}
      const cursor = appliedJobsCollection.find(query)
      const result= await cursor.toArray();
      res.send(result)
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
  res.send("Applicruit server is running.");
});

app.listen(port, () => {
  console.log(`Applicruit listening on port ${port}`);
});
