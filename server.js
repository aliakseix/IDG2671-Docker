const express = require("express");
const mongo = require("mongodb");
const path = require("path");
const config = require("./config.json");
const { log } = require("console");

const app = express();

// express basic setup
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(express.static(path.join(__dirname, "static")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "static", "views"));


// connecting Mongo
const dbConnPr = (()=>{
	const {protocol, usr, pwd, hostname, port, dbName} = config.mongo;
	// const MONGO_URL = protocol + "://" + usr + ":" + pwd + "@" + hostname + ":" + port + "/" + dbName;
	const MONGO_URL = protocol + "://" + usr + ":" + pwd + "@" + hostname + ":" + port;
	// const MONGO_URL = protocol + "://" + hostname + ":" + port + "/" + dbName;
	const mongoClient = new mongo.MongoClient(MONGO_URL);
	return mongoClient.connect().then(connection=>{
		console.log("Mongo connected.");
		return connection.db(dbName);
	});
})();

// serving content
app.get("/", (req, res)=>{
	console.log("serving page...");
	dbConnPr.then(db=>{
		return db.collection("ads").find({}).toArray();
	}).then(data=>{
		res.render("index", {data});
	}).catch(err=>handleErr(err, res));
});

// handling incoming data
app.post("/save-ads", (req, res)=>{
	console.log("Saving an ad...");
	dbConnPr.then(db=>{
		const tNow = (new Date()).toUTCString()
		return db.collection("ads").insertOne({txt: req.body.txt, date: tNow});
	}).then(()=>{
		res.send("Added an add. Reload page to see it.");
	}).catch(err=>handleErr(err, res))
});

function handleErr(err, res){
	console.log(err);
	res.status(500).send("Server made booboo:" + err.toString());
}

app.listen(config["app-port"], ()=>{
	console.log("App listening on ", config["app-port"]);
});
