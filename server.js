const express = require("express");
const mongo = require("mongodb");
const path = require("path");
const config = require("./config.js");

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
	const MONGO_URL = protocol + "://" + usr + ":" + pwd + "@" + hostname + ":" + port;
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

app.get("/json", (req, res)=>{
	console.log("serving json...");
	res.status(200).json(JSON.stringify({data: "hello there - here is some JSON for you"}));
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

const server = app.listen(config["app-port"], ()=>{
	console.log("App listening on ", config["app-port"]);
});

// handling graceful shutdown
function quit(eType){
	console.log(`Received ${eType} signal. Expressjs Graceful shutdown.`);
	server.close(()=>{
		console.log("Express server closed.");
		process.exit();
	});
	
}
['SIGINT', 'SIGQUIT', 'SIGTERM'].forEach(eType=>{console.log("Attaching for ", eType); process.on(eType, quit);});
