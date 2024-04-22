
const NETWORK_DELAY = 1000; // not a real thing - just simulating network delays on localhost

function main(){
	if(document.getElementById("adForm").hasAttribute("page-after-post")){
		window.history.replaceState( null, "", window.location.href );
	}

	// setting up hanlders for deleting records
	document.querySelectorAll("li input.delete-adv-button").forEach(inpEl=>{
		inpEl.addEventListener("click", ev=>{
			// setting up a delay before any action - so it doesn't appear instant on localhost
			inpEl.parentElement.classList.add("loading");
			window.setTimeout(async ()=>{
				const advName = inpEl.parentElement.dataset.advName;
				const url = `/api/adv/${advName}`;
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
			}, NETWORK_DELAY);
		});
	});
}

if(document.state === "loading"){
	document.addEventListener("DOMContentLoaded", ev=>main());
}else{
	main();
}
