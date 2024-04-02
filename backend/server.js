const express = require("express");
const path = require("path");
const config = require("./config.js");
const controller = require("./controller.js");

const app = express();

// express basic setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "..", "static")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "static", "views"));

// serving content - main page
app.get(["/", "/advertisers"], (req, res) => {
	console.log("serving page...");
	controller
		.getAllAdvertisers()
		.then(data => {
			res.render("index", { data });
		})
		.catch(err => handleErr(err, res));
});

app.get("/json", (req, res) => {
	console.log("serving json...");
	res.status(200).json({ data: "hello there - here is some JSON for you" });
});

// api to get all advertisers as json
app.get("/api/adv?", (req, res) => {
	console.log("All Advertisers requested as json");
	controller
		.getAllAdvertisers()
		.then(data => {
			res.json({ data });
		})
		.catch(err => handleErr(err, res));
});

// api to get one advertiser by name
app.get("/api/adv/:name?", (req, res) => {
	console.log("Advertiser requested: ", req.params.name);
	controller
		.getAdvertiserByName(req.params.name)
		.then(adv => {
			if (adv) {
				res.status(200).json(adv);
			} else {
				res.status(404).send("No adveriser with such name");
			}
		});
});

// api to delete one advertiser by name
app.delete("/api/adv/:name?", (req, res) => {
	console.log("Deleting Advertiser: ", req.params.name);
	controller
		.deleteAdvertiserByName(req.params.name)
		.then(nDeleted => {
			return nDeleted ? res.status(200) : res.status(404);
		});
});

// handling incoming data
app.post("/advertisers", (req, res) => {
	console.log("Trying to save an ad...");
	controller
		.saveAdvertiser(req.body)
		.then((saveErr) => {
			return controller
				.getAllAdvertisers()
				.then(data => {
					res.render("index", { data, err: saveErr, isSaveJustAttempted: true });
				});
		})
		.catch(err => handleErr(err, res));
});

function handleErr(err, res) {
	console.log(err);
	res.status(500).send("Server made booboo:" + err.toString());
}

const server = app.listen(config["app-port"], () => {
	console.log("App listening on ", config["app-port"]);
});

// handling graceful shutdown
function quit(eType) {
	console.log(`Received ${eType} signal. Expressjs Graceful shutdown.`);
	server.close(() => {
		console.log("Express server closed.");
		process.exit();
	});
}
['SIGINT', 'SIGQUIT', 'SIGTERM'].forEach(eType => {
	// console.log("Attaching for ", eType); 
	process.on(eType, quit);
});

module.exports = server;
