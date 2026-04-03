const { execSync, spawn } = require("child_process");
const fs = require("fs");
const YAML = require("yaml");
const path = require("path");

const SDK = process.env.LOCALAPPDATA + "\\Android\\Sdk";

// ---- CONFIG ----
const AVD_NAME = "Pixel_3a_API_34_extension_level_7_x86_64";
const APK_PATH = path.join(__dirname, "../apps/app-stage-debug.apk");

// ---- LOAD ENV ----
const env = YAML.parse(
  fs.readFileSync(path.join(__dirname, "../env/stage.yaml"), "utf8")
);

const user = require(path.join(__dirname, "../test-data/users.json"));
const flowPath = path.join(__dirname, "../flows/smoke/login_test.yaml");

// ---- COMMAND ----
const maestroCmd = `maestro test "${flowPath}" \
--env APP_ID=${env.APP_ID} \
--env WORKSPACE=${env.workSpace} \
--env USERNAME=${user.validUser.email} \
--env PASSWORD=${user.validUser.password}`;

try {
  console.log("🚀 Starting emulator...");

  spawn(`${SDK}\\emulator\\emulator.exe`, [
    "-avd",
    AVD_NAME,
    "-no-snapshot",
    "-no-boot-anim"
  ], {
    detached: true,
    stdio: "ignore"
  }).unref();

  // Wait for device
  console.log("⏳ Waiting for emulator...");
  execSync(`"${SDK}\\platform-tools\\adb" wait-for-device`, { stdio: "inherit" });

  // Wait until boot completed
  let booted = "";
  do {
    booted = execSync(
      `"${SDK}\\platform-tools\\adb" shell getprop sys.boot_completed`
    ).toString().trim();

    console.log("⌛ Booting...");
  } while (booted !== "1");

  console.log("✅ Emulator ready");

  // Unlock screen
  execSync(`"${SDK}\\platform-tools\\adb" shell input keyevent 82`);

  // Install APK
  console.log("📦 Installing APK...");
  execSync(`"${SDK}\\platform-tools\\adb" install -r "${APK_PATH}"`, {
    stdio: "inherit"
  });

  console.log("🧪 Running Maestro test...");
  execSync(maestroCmd, { stdio: "inherit", shell: true });

} catch (error) {
  console.error("❌ Execution failed");
  console.error(error.message);
  process.exit(1);
}