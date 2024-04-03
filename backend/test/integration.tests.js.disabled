const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const dotenv = require("dotenv");
const path = require('path');
const fs = require('fs');
const mongo = require("mongodb");
const nock = require("nock"); // make sure to install beta - else no support for fetch

const compose = require("docker-compose/dist/v2");

const mockApiData = require("./api.mock.response.json");
const TEST_DB = "some-throw-away-name";
const LOCALHOST = "localhost";
var serverRef, baseURL, mainConfig;

before(() => {
	// importing env variables
	dotenv.config({ path: path.join(process.cwd(), ".env") });
	dotenv.config({ path: path.join(process.cwd(), ".mongo.env") });
	// making sure mongo configuration is correct for testing
	const config = require("../config.js")._injectMongoValues({
		hostname: LOCALHOST,
		dbName: TEST_DB,
		pwd: fs.readFileSync(path.join(process.cwd(), "secrets.folder", "mongo_admin_pwd.txt"), "utf-8")
	});
	mainConfig = config;
	// assembling the baseURL for all requests
	baseURL = `http://${LOCALHOST}:${config["app-port"]}`;
	// getting a mongo container up
	return compose.upOne("test-mongodb-debug", { cwd: process.cwd(), config: "debug-compose.yaml" })
		.then((args) => {
			console.log("Mongo container is up");
		})
		.then(() => {
			return new Promise((resolve) => {
				serverRef = require("../server.js");
				serverRef.on("listening", () => {
					resolve();
				});
			});
		})
		.then(() => console.log("Server Listening - from tests.js"))
		.then(() => {
			// setting up network mocks - to avoid calling external services (isolation of tested module + faster tests)
			nock("https://my.api.mockaroo.com")
				.get("/idg2671_test.json?key=a855c5b0")
				.reply(200, mockApiData);
		});
});

after(() => {
	// tear down db
	const URI = "mongodb://aliaksei:123pwd@localhost:27017"; // TODO: assemble on the fly
	var connectionRef;
	const dbConnPr = (() => {
		const mongoClient = new mongo.MongoClient(URI);
		return mongoClient.connect().then(connection => {
			connectionRef = connection;
			return connection.db(mainConfig.mongo.dbName);
		});
	})();
	return dbConnPr
		.then(db => db.collection("ads").deleteMany({}))
		.then(() => connectionRef.close())
		// stop docker container
		.then(() => compose.down({ cwd: process.cwd(), config: "debug-compose.yaml" }))
		.then((arg) => {
			serverRef.close(() => {
				console.log("Server's closed.");
				// I give up on trying to figure out what keeps the process running at this point, so here's the nuke option to close it
				process.exit(0);
			});
		});
});

describe("Integration tests for our server, GET", async () => {
	it("should return a list of 5 advertisers", async () => {
		return fetch(baseURL + "/api/adv")
			.then((resp) => {
				assert.strictEqual(resp.ok, true);
				return resp.json();
			})
			.then(allAdv => {
				assert.strictEqual(allAdv.data.length, 5);
				// console.log(allAdv.data);
			});
	});
});

describe("Integration tests, POST", () => {
	it("should save an advertiser to DB", () => {
		const adname = "Raid Shadow Legends";
		const opts = {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ author: "Jhon Doe", name: adname, link: "https://raidshadowlegends.com/" })
		};
		return fetch(baseURL + encodeURI(`/api/adv/${adname}`), opts)
			.then((resp) => {
				assert.strictEqual(resp.ok, true);
			})
			.then(() => fetch(baseURL + encodeURI(`/api/adv/${adname}`)))
			.then(resp => {
				assert.strictEqual(resp.ok, true);
			});
	});
});
