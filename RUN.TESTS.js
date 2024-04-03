const fsp = require("fs/promises");
const path = require('path');
const compose = require("docker-compose/dist/v2");

const CWD = process.cwd();
const COMPOSE_FILE = "debug-compose.yaml";
const SERVER_SERVICE = "test-app-debug";

var ifFailedTests = false;

return fsp.readFile(path.join(CWD, COMPOSE_FILE), "utf-8")
	.then(configAsString=>{
		// swapping the entry point in our container from starting a server to runnning tests
		const swapRgXp = new RegExp(`${SERVER_SERVICE}:\\s*`, "g");
		return configAsString.replace(swapRgXp, match=>{
			const correctTabs = match.split("\n").pop(); // tabs before the command after "test-app-debug"
			return match + "command: npm test\n" + correctTabs;
		});
	})
	.then(configAsString => compose.upAll({
		cwd: process.cwd(),
		configAsString,
		log: true,
		commandOptions: [
			["--attach", SERVER_SERVICE], 
			["--abort-on-container-exit"], 
			["--exit-code-from", SERVER_SERVICE],
			["--no-log-prefix"]
		]
	}))
	.then(()=>{
		console.log("Done 'npm test'. No Errors.");
	})
	.catch(e=>{
		console.error("TESTS FAILED:", (e && e.out) || e);
		ifFailedTests = true;
	})
	.finally(()=>compose.down({ cwd: CWD, config: COMPOSE_FILE }))
	.then(()=>console.log("Clean up done."))
	.then(()=>{
		if(ifFailedTests){
			process.exit(1); // making sure the process exits with an error (only 0 means success)
		}
	});
	
