const fs = require("fs");

module.exports = {
	"mongo": {
		"protocol": "mongodb",
		"usr": process.env.MONGO_INITDB_ROOT_USERNAME,
		"pwd": process.env.MONGO_INITDB_ROOT_PASSWORD?process.env.MONGO_INITDB_ROOT_PASSWORD:fs.readFileSync(process.env.MONGO_INITDB_ROOT_PASSWORD_FILE, "utf-8"),
		"hostname": process.env.MONGO_HOSTNAME,
		"port": process.env.MONGO_PORT,
		"dbName": "idg2671"
	},
	"app-port": 8080
};