// Node.js built-in modules
const { execSync } = require("child_process");
const { env, user, ENV, USER_TYPE } = require("./config");
const fs = require("fs"); 
const path = require("path");


// Import environment + user configuration
//const { env, user, ENV, USER_TYPE } = require("./config");

// Absolute paths ensure script works regardless of execution location
const reportDir = path.resolve(__dirname, "../reports");
const debugDir = path.resolve(__dirname, "../debug");
const reportFile = path.join(reportDir, "junit.xml");

//Log execution context
console.log(`Running tests on ENV: ${ENV}`);
console.log(`Using USER: ${USER_TYPE}`);

// Remove old reports folder (if exists)
if (fs.existsSync(reportDir)) {
  fs.rmSync(reportDir, {
    recursive: true, // delete all contents
    force: true      // ignore errors if folder is partially missing/locked
  });
}

// Remove old debug folder (if exists)
if (fs.existsSync(debugDir)) {
  fs.rmSync(debugDir, {
    recursive: true,
    force: true
  });
}

// Recreate clean directories (optional but safer)
fs.mkdirSync(reportDir, { recursive: true });
fs.mkdirSync(debugDir, { recursive: true });

const commandParts = [
    "maestro test flows/smoke/login_test.yaml",
    `--env APP_ID=${env.APP_ID}`,
    `--env WORKSPACE=${env.workSpace}`,
    `--env EMAIL=${user.email}`,
    `--env PASSWORD=${user.password}`,
    "--format junit",
    `--output "${reportFile}"`,
    `--debug-output "${debugDir}"`,
  ];
  
  const command = commandParts.join(" ");

try {

  console.log("\nStarting Maestro test execution...\n");

  // Optional: wake device
  execSync("adb shell input keyevent 224", { stdio: "inherit" });

  // Run Maestro
  execSync(command, { stdio: "inherit", shell: true });

} catch (error) {
 console.error("\n❌ Test execution failed");
  console.error(error.message);

  console.error("\n🔍 Check debug artifacts for details:");
  console.error(`👉 ${debugDir}`);

  process.exit(1)
}