const URL = require("url").URL;
const urlShorteners = require("./util/url.shorteners.list.js");


// Checks if an advertiser was added too long ago
function validateOldAd(adObj, maxYngAgeMin) {
	// TODO: throw if maxAge is negative or too large; check if NaN
	const maxAgeMSec = maxYngAgeMin * 60 * 1000;
	const createdAtMSec = (new Date(adObj.date)).getTime();
	return (Date.now() - maxAgeMSec) > createdAtMSec;
}

const MAX_AUTHOR_NAME_LEN = 128;
const MAX_URL_LEN = 2048;
const MAX_LINK_ALIVE_WAIT = 7000; // msec

function _checkEmpty(s) {
	return s === undefined || s === null || !s.toString().trim().length;
}

// Checks if a name is a realistic human name
function validateAuthorName(name) {
	if (_checkEmpty(name)) {
		throw "Author name can't be empty";
	}
	name = name.toString().trim();
	// check for length being realistic
	if (name.length > MAX_AUTHOR_NAME_LEN) {
		throw new Error("Author name is unrealistically long");
	}
	// no non-numeric characters
	const nonAlphaCharRegexp = /[^a-z\-\u00C0-\u017F ]/gui;
	if (nonAlphaCharRegexp.test(name)) {
		throw "Author name can't contain non-alphabet characters";
	}
	// needs to be at least two words
	let nameParts = name.split(" ");
	if (nameParts.length < 2) {
		throw new Error("Author name needs to be a full name");
	}
	// no abbreviations
	if (nameParts.some(x => x.length < 2)) {
		throw "Author name can't contain abbreviations. Spell it out.";
	}
	// no capital letters except 1st - convert automatically
	nameParts = nameParts.map(s => s.charAt(0).toUpperCase() + s.substr(1).toLowerCase());
	return nameParts.join(" ");
}

function checkLinkAlive(url, fetchF = fetch) {
	return Promise
		.race([
			fetchF(url),
			new Promise((_, reject) => setTimeout(
				()=>reject(new Error("Timed out.")),
				MAX_LINK_ALIVE_WAIT
			))
		])
		.then(resp=>{
			if(!resp.ok){
				console.log("Result for ", url, resp.status, resp.statusText);
				return Promise.reject("Link not alive.");
			}
		});
}

// Checks if a link is a valid HTTP/S URL
function validateURL(link) {
	if (_checkEmpty(link)) {
		throw "Advertiser link can't be empty";
	}
	link = link.toString().trim(); // accounting for non-string data being passed in
	// check max length
	if (link.length > MAX_URL_LEN) {
		throw "Advertiser link is too long";
	}
	// only http/s allowed
	if (link.indexOf("http") !== 0) {
		throw "Advertiser link: only http/s links are allowed";
	}
	// check if valid URL
	try {
		var url = new URL(link);
	} catch (e) {
		// catching to replace errors with our own messages
		throw "Advertiser link should be a valid URL.";
	}
	// no link shorteners
	if (urlShorteners.some(shortUrl => shortUrl === url.hostname)) {
		throw "Advertiser link: URL shorteners not allowed";
	}
	return url;
}

module.exports = {
	validateOldAd,
	validateAuthorName,
	validateURL,
	checkLinkAlive
};
