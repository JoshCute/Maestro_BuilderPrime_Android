const fs = require("fs");
const path = require("path");
const YAML = require("yaml");

const ENV = process.env.ENV || "stage";
const USER_TYPE = process.env.USER || "validUser";

// Load environment config
const env = YAML.parse(
  fs.readFileSync(path.join(__dirname, `../env/${ENV}.yaml`), "utf8")
);

// Load test data
const users = require(path.join(__dirname, "../test-data/users.json"));

// Resolve user
if (!users[USER_TYPE]) {
  throw new Error(`User type "${USER_TYPE}" not found in users.json`);
}

const user = users[USER_TYPE];

module.exports = {
  env,
  user,
  ENV,
  USER_TYPE,
};