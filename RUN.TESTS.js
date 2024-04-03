const fsp = require("fs/promises");
const path = require('path');
const compose = require("docker-compose/dist/v2");

const CWD = process.cwd();
const COMPOSE_FILE = "debug-compose.yaml";
const SERVER_SERVICE = "test-app-debug";

var ifFailedTests = false;
const pwdFile = path.join(CWD, "secrets.folder", "mongo_admin_pwd.txt");

fsp.access(pwdFile)
	.catch(()=>{
		// creating a temporary file with a password -- for the testing server (and if you try to docker-compose this project yourself, in general)
		// NOTE: this won't work if you already have a persistent volume for your mongo container -- all passwords will be stored there
		return fsp
			.mkdir(path.dirname(pwdFile), {recursive: true})
			.then(fsp.writeFile(pwdFile, "some-test-password3-t9g8uqbwoheiu2tqofinv0w4iewfj", "utf-8"));
	})
	.then(()=>compose.pullAll({ cwd: CWD, config: COMPOSE_FILE }))
	.then(()=>fsp.readFile(path.join(CWD, COMPOSE_FILE), "utf-8"))
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
			["--exit-code-from", SERVER_SERVICE], // forwarding the exit status from the server container to this process
			["--no-log-prefix"]
		]
	}))
	.then(()=>{
		console.log("Done 'npm test'. No Errors.");
	})
	.catch(e=>{
		ifFailedTests = true;
		console.error("TESTS FAILED:", (e && e.out) || e);
		console.error((e && e.stack) || "no STACK TRACE AVAILABLE");
	})
	.finally(()=>compose.down({ cwd: CWD, config: COMPOSE_FILE })) // only makes sense for local tests - the GitHub Actions server would be destroyed anyways
	.then(()=>console.log("Clean up done."))
	.then(()=>{
		if(ifFailedTests){
			process.exit(1); // making sure the process exits with an error (only 0 means success)
		}
	});
	
