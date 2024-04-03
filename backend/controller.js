const mongo = require("mongodb");
const config = require("./config.js");
const extService = require("./3rd.party.api");

const validator = require("./validate.js");

const MAX_AD_AGE_MIN = 300;

// connecting Mongo
const dbConnPr = (()=>{
	const {protocol, usr, pwd, hostname, port, dbName} = config.mongo;
	const MONGO_URL = protocol + "://" + usr + ":" + pwd + "@" + hostname + ":" + port;
	console.log(MONGO_URL);
	const mongoClient = new mongo.MongoClient(MONGO_URL);
	// console.log("MONGO_URL: ", MONGO_URL);
	// console.log("dbName: ", dbName);
	return mongoClient.connect().then(connection=>{
		console.log("Mongo connected.");
		return connection.db(dbName);
	});
})();


function getAllAdvertisers(){
	return dbConnPr.then(db=>{
		return db.collection("ads")
			.find({})
			.toArray()
			.then(adList=>{
				// adding "external" advertisers to the list of advertisers in our local DB
				return extService
					.getOtherAdvertisers()
					.then(anotherAdList=>adList.concat(anotherAdList));
			})
			.then(x=>x.map(ad=>({...ad, old: validator.validateOldAd(ad, MAX_AD_AGE_MIN)}))); // marking "old" ads as such
	});
}

function getAdvertiserByName(name){
	return dbConnPr
		.then(db=>db.collection("ads").findOne({name}))
		.then(adv=>{
			if(!adv){
				// searching among "external" advertisers if none found
				return extService
					.getOtherAdvertisers()
					.then(extAdvArr=>extAdvArr.find(adv=>adv.name === name));
			}
			return adv;
		});
}

function deleteAdvertiserByName(name){
	return dbConnPr
		.then(db=>db.collection("ads").deleteOne({name}))
		.then(res=>{
			if(res.deletedCount === 0){
				// maybe this advertiser is among the external ones - trying to delete there
				return extService.deleteExternalAdvertiserByName(name);
			}
			return res.deletedCount;
		});
}

function saveAdvertiser(adObj){
	try{
		var ad = new Advertiser(adObj.author, adObj.name, adObj.link);
	}catch(e) {
		console.log("AD validation error:", e);
		return Promise.resolve((e.message || e)); // that's a validation error
	}
	// checking if we already have this advertiser
	return getAdvertiserByName(ad.name)
		.then(adv=>{
			if(adv){
				throw "Duplicate advertiser suggested. Suggest something new."; // throwing to skip logic till the catch below
			}
		})
		.then(()=>validator.checkLinkAlive(ad.link))
		.then(()=>dbConnPr)
		.then(db => db.collection("ads").insertOne(ad))
		.then((insRes)=>{}) // if success, return nothing (server expects nothing or an error)
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
	getAllAdvertisers,
	saveAdvertiser,
	deleteAdvertiserByName,
	getAdvertiserByName
};
