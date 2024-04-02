

// function main(){
// 	document.getElementById("adForm").addEventListener("submit", ev=>{
// 		ev.preventDefault();
// 		const adNameEl = document.getElementById("name");
// 		const adName = adNameEl.value.trim();
// 		if(!adName){
// 			adNameEl.value = "";
// 			adNameEl.setAttribute("placeholder", "Advertiser Name can't be Empty!!!");
// 			return;
// 		}
// 		fetch("/save-ads", {
// 			method: "POST",
// 			headers: {
// 				"Content-Type": "application/json"
// 			},
// 			body: JSON.stringify({
// 				txt: adName
// 			})
// 		}).then(resp=>{
// 			window.location.reload();
// 		}).catch(err=>{
// 			console.error(err.message);
// 			window.alert(err.message);
// 		});
// 	});
// }

function main(){
	// console.log("Hello from main - not doing anything client-side yet");
	if(document.getElementById("adForm").hasAttribute("page-after-post")){
		window.history.replaceState( null, "", window.location.href );
	}
}

if(document.state === "loading"){
	document.addEventListener("DOMContentLoaded", ev=>main());
}else{
	main();
}
