const sURL = "https://my.api.mockaroo.com/idg2671_test.json?key=a855c5b0";

var externalAdvArr;

function getOtherAdvertisers() {
	if (externalAdvArr) {
		return Promise.resolve(externalAdvArr);
	}
	console.log("FETCHING: ", sURL);
	return fetch(sURL)
		.then(resp => resp.json())
		.then(
			arr => arr
				.map(ad => ({ ...ad, premium: true }))
				.map(ad => ({ ...ad, date: (new Date(ad.date)).toUTCString() })) // converting dates to our format
				.map(ad => ({ ...ad, link: ad.website })) // renaming "website" to "link"
				.slice(0, 5) // 5 is enough for testing/demo
		)
		.then(arr => {
			externalAdvArr = arr; // keeping a reference - to avoid calling every time
			return arr;
		});
}

async function deleteExternalAdvertiserByName(name) {
	const ref2advList = await getOtherAdvertisers(); // making sure "ref2advList" has been initialized
	externalAdvArr = ref2advList.filter(adv => adv.name !== name);
	return ref2advList.length - externalAdvArr.length; // acknowledging the nubmer of deleted advertisers
}

module.exports = {
	getOtherAdvertisers,
	deleteExternalAdvertiserByName
};
