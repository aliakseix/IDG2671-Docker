const express = require("express");
const path = require("path");
const config = require("./config.js");
const db = require("./controller.js");

const app = express();

// express basic setup
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(express.static(path.join(__dirname, "..", "static")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "static", "views"));

// serving content
app.get(["/", "/ads"], (req, res)=>{
	console.log("serving page...");
	db
		.getAllAds()
		.then(data=>{
			res.render("index", {data});
		})
		.catch(err=>handleErr(err, res));
});

app.get("/json", (req, res)=>{
	console.log("serving json...");
	res.status(200).json(JSON.stringify({data: "hello there - here is some JSON for you"}));
});

// handling incoming data
app.post("/ads", (req, res)=>{
	console.log("Trying to save an ad...");
	db
		.saveAds(req.body)
		.then((saveErr)=>{
			debugger;
			return db
				.getAllAds()
				.then(data=>{
					console.log(data);
					res.render("index", {data, err: saveErr, isSaveJustAttempted: true});
				});
		})
		.catch(err=>handleErr(err, res));
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
