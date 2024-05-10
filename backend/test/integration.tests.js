const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");

const mongo = require("mongodb");
const nock = require("nock"); // make sure to install beta - else no support for fetch


const mockApiData = require("./api.mock.response.json");
const TEST_DB = "some-throw-away-name";
const LOCALHOST = "localhost";
var serverRef, serverBaseURL, config;

before(() => {
	// making sure mongo configuration is correct for testing
	config = require("../../config.js")._injectMongoValues({
		dbName: TEST_DB
	});
	// assembling the baseURL for all requests
	serverBaseURL = `http://${LOCALHOST}:${config["server-app-port"]}`;
	// setting up network mocks - to avoid calling external services (isolation of tested module + faster tests)
	nock("https://my.api.mockaroo.com")
		.get("/idg2671_test.json?key=a855c5b0")
		.reply(200, mockApiData);
	serverRef = require("../server.js");
	serverRef.on("listening", () => {
		console.log("SERVER READY");
	});
});

after(() => {
	// clean up records in db <-- may need to be done after each test (to restore things to original values)
	const URI = config.mongo.url;
	var connectionRef;
	const dbConnPr = (() => {
		const mongoClient = new mongo.MongoClient(URI);
		return mongoClient.connect().then(connection => {
			connectionRef = connection;
			return connection.db(TEST_DB);
		});
	})();
	return dbConnPr
		.then(db => db.collection("ads").deleteMany({}))
		.then(() => connectionRef.close())
		// stop docker container
		.then(() => {
			serverRef.close(() => {
				console.log("Server's closed.");
				// I give up on trying to figure out what keeps the process running at this point, so here's the nuke option to close it
				process.exit(0);
			});
		});
});

describe("Integration tests for our server, GET", async () => {
	it("should return a list of 5 advertisers", async () => {
		return fetch(serverBaseURL + "/api/adv")
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
		return fetch(serverBaseURL + encodeURI(`/api/adv/${adname}`), opts)
			.then((resp) => {
				assert.strictEqual(resp.ok, true);
			})
			.then(() => fetch(serverBaseURL + encodeURI(`/api/adv/${adname}`)))
			.then(resp => {
				assert.strictEqual(resp.ok, true);
			});
	});
});
