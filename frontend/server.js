const express = require("express");
const path = require("path");
const config = require("../config.js");

const app = express();

// express basic setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "static")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "static", "views"));

app.locals.apiServerHost = config["server-app-host-remote"]; // so it's available to our rendering engine
app.locals.apiServerPort = config["server-app-port"];

// quick and dirty: assembling server app base url (works within a Docker network)
function getServerUrl(path){
	return `http://${config["server-app-host"]}:${config["server-app-port"]}${path}`;
}

// serving content - main page
app.get(["/", "/advertisers"], (req, res) => {
	console.log("serving page...");
	// controller
	// 	.getAllAdvertisers()
	fetch(getServerUrl("/"))
		.then(resp=>resp.json())
		.then(data => {
			res.render("index", { data });
		})
		.catch(err => handleErr(err, res));
});

// // handling incoming data
// app.post("/advertisers", (req, res) => {
// 	controller
// 		.saveAdvertiser(req.body)
// 		.then((saveErr) => {
// 			return controller
// 				.getAllAdvertisers()
// 				.then(data => {
// 					res.render("index", { data, err: saveErr, isSaveJustAttempted: true });
// 				});
// 		})
// 		.catch(err => handleErr(err, res));
// });

function handleErr(err, res) {
	console.log(err);
	res.status(500).send("Server made booboo:" + err.toString());
}

const server = app.listen(config["client-app-port"], () => {
	console.log("Client App listening on ", config["client-app-port"]);
});

// handling graceful shutdown
function quit(eType) {
	console.log(`Received ${eType} signal. Expressjs Graceful shutdown.`);
	server.close(() => {
		console.log("Client Express server closed.");
		process.exit();
	});
}
['SIGINT', 'SIGQUIT', 'SIGTERM'].forEach(eType => {
	// console.log("Attaching for ", eType); 
	process.on(eType, quit);
});

module.exports = server;
