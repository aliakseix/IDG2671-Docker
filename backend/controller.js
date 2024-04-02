const mongo = require("mongodb");
const config = require("./config.js");

const validator = require("./validate.js");

const MAX_AD_AGE_MIN = 3;

// connecting Mongo
const dbConnPr = (()=>{
	const {protocol, usr, pwd, hostname, port, dbName} = config.mongo;
	const MONGO_URL = protocol + "://" + usr + ":" + pwd + "@" + hostname + ":" + port;
	const mongoClient = new mongo.MongoClient(MONGO_URL);
	console.log("MONGO_URL: ", MONGO_URL);
	console.log("dbName: ", dbName);
	return mongoClient.connect().then(connection=>{
		console.log("Mongo connected.");
		return connection.db(dbName);
	});
})();

function getAllAds(){
	return dbConnPr.then(db=>{
		// NOTE: in general it's better to flatten promises, but if it's simple, it's ok to keep it unflattened
		return db.collection("ads")
			.find({})
			.toArray()
			.then(x=>x.map(ad=>({...ad, old: validator.validateOldAd(ad, MAX_AD_AGE_MIN)})));
	});
}

function saveAds(adObj){
	try{
		var ad = new Advertiser(adObj.author, adObj.name, adObj.link);
	}catch(e) {
		console.log("AD validation error:", e);
		return Promise.resolve((e.message || e)); // that's a validation error
	}
	return validator
		.checkLinkAlive(ad.link)
		.then(()=>dbConnPr)
		.then(db => db.collection("ads").insertOne(ad))
		.then(()=>{}) // if success, return nothing (server expects nothing or an error)
		.catch(e=>"Advertiser link: " + (e.message || e)); // making sure all errors have the same format
}

class Advertiser{
	constructor(author, name, link){
		this.name = name;
		this.author = validator.validateAuthorName(author);
		this.link = validator.validateURL(link).href;
		this.date = (new Date()).toUTCString();
	}
}

module.exports = {
	getAllAds,
	saveAds
};
