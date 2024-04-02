const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const dotenv = require("dotenv");
const path = require('path');
const fs = require('fs');
const mongo = require("mongodb");

const compose = require("docker-compose/dist/v2");

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
			serverRef = require("../server.js");
		});
});

after(async () => {
	// tear down db
	const URI = "mongodb://aliaksei:123pwd@localhost:27017"; // TODO: assemble on the fly
	const dbConnPr = (()=>{
		const mongoClient = new mongo.MongoClient(URI);
		return mongoClient.connect().then(connection=>{
			console.log("Mongo connected.");
			return connection.db(mainConfig.mongo.dbName);
		});
	})();
	return dbConnPr
		.then(db=>{
			return db.collection("ads").deleteMany({});
		})
		// stop docker container
		.then(()=>compose.down({ cwd: process.cwd(), config: "debug-compose.yaml" }))
		.then((arg) => {
			console.log("It's down");
			serverRef.close();
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
			});
	});
});


describe("Integration tests, POST", ()=>{
	it("should save an advertiser to DB", async () => {
		const opts = {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({author: "Jhon Doe", name: "Raid Shadow Legends", link: "https://raidshadowlegends.com/"})
		};
		return fetch(baseURL + "/advertisers", opts)
			.then((resp) => {
				assert.strictEqual(resp.ok, true);
			});
	});
});
