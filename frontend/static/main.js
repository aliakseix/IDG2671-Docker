/*global ejs, EJS*/
const NETWORK_DELAY = 700; // not a real thing - just simulating network delays on localhost

const API_URL = (location.hostname.includes("localhost"))?
	"http://localhost:" + window.app.apiServerPort: // debugging
	"https://" + window.app.apiServerHost; // production

function getNetworkDelay(){
	return NETWORK_DELAY + NETWORK_DELAY * Math.random();
}

function main(){
	// if(document.getElementById("adForm").hasAttribute("page-after-post")){
	// 	window.history.replaceState( null, "", window.location.href );
	// }

	// submitting data to our api server - instead of the native form submits
	document.querySelector("#adForm").addEventListener("submit", ev=>{
		ev.preventDefault();
		window.setTimeout(async ()=>{
			const data = Object.fromEntries(new FormData(ev.target).entries());
			const url = `${API_URL}/api/adv/${window.encodeURI(data.name) }`;
			const resp = await fetch(url, {
				method: "POST", 
				body: JSON.stringify(data),
				headers:{
					"Content-Type": "application/json"
				}
			});
			// updating message about success/failure of saving
			const tplResTxt = await (await fetch("/views/save.result.ejs")).text();
			const ejsStrRes = ejs.render(tplResTxt, { err: resp.ok?"":await resp.text()});
			document.querySelector("#record-save-result-msg").innerHTML = ejsStrRes;
			// re-rendering records
			if(resp.ok){
				// but fetching them first
				const records = await (await fetch(API_URL + "/api/adv")).json();
				// fetching a record template to render
				const tplRecordsTxt = await (await fetch("/views/records.ejs")).text();
				const ejsStrRec = ejs.render(tplRecordsTxt, records);
				document.querySelector("#record-container").innerHTML = ejsStrRec;
				handleDeletes(); // re-assigning delete handlers
			}
		}, getNetworkDelay());
	});

	handleDeletes();
}

function handleDeletes(){
	// setting up hanlders for deleting records
	document.querySelectorAll("li input.delete-adv-button").forEach(inpEl=>{
		inpEl.addEventListener("click", ev=>{
			// setting up a delay before any action - so it doesn't appear instant on localhost
			inpEl.parentElement.classList.add("loading");
			window.setTimeout(async ()=>{
				const advName = inpEl.parentElement.dataset.advName;
				const url = `${API_URL}/api/adv/${advName}`;
				const resp = await fetch(url, {method: "DELETE"});
				const errorEl = document.querySelector(".error-container");
				if(resp.ok){
					inpEl.parentElement.classList.add("hidden");
					errorEl.classList.remove("show");
				}else{
					// show error message
					errorEl.classList.add("show");
					errorEl.textContent = "ERROR:" + await resp.text();
					// show a delete button again
					inpEl.parentElement.classList.remove("loading");
				}
			}, getNetworkDelay());
		});
	});
}

if(document.state === "loading"){
	document.addEventListener("DOMContentLoaded", ev=>main());
}else{
	main();
}
