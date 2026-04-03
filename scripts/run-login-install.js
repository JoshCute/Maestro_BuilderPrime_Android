const { execSync, spawn } = require("child_process");
const fs = require("fs");
const YAML = require("yaml");
const path = require("path");

const SDK = process.env.LOCALAPPDATA + "\\Android\\Sdk";
const ADB = `"${SDK}\\platform-tools\\adb"`;

// ---- CONFIG ----
const AVD_NAME = "Pixel_3a_API_34_extension_level_7_x86_64";
const APK_PATH = path.join(__dirname, "../apps/app-stage-debug.apk");

// ---- TIMEOUT CONFIG ----
const BOOT_TIMEOUT = 180000; // 3 minutes
const POLL_INTERVAL = 3000; // 3 sec

// ---- LOAD ENV ----
const env = YAML.parse(
  fs.readFileSync(path.join(__dirname, "../env/stage.yaml"), "utf8")
);

const user = require(path.join(__dirname, "../test-data/users.json"));
const flowPath = path.join(__dirname, "../flows/smoke/login_test.yaml");

// ---- COMMAND (FIXED DUPLICATE APP_ID) ----
const maestroCmd = `maestro test "${flowPath}" \
--env APP_ID=${env.APP_ID} \
--env WORKSPACE=${env.workSpace} \
--env USERNAME=${user.validUser.email} \
--env PASSWORD=${user.validUser.password}`;

// ---- HELPERS ----
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

function isEmulatorRunning() {
  try {
    const devices = execSync(`${ADB} devices`).toString();
    return devices.includes("emulator");
  } catch {
    return false;
  }
}

async function waitForBoot() {
  console.log("⏳ Waiting for emulator to fully boot...");

  const start = Date.now();

  while (true) {
    if (Date.now() - start > BOOT_TIMEOUT) {
      throw new Error("❌ Emulator boot timeout");
    }

    try {
      const booted = execSync(
        `${ADB} shell getprop sys.boot_completed`
      )
        .toString()
        .trim();

      if (booted === "1") {
        console.log("✅ Boot completed");
        return;
      }
    } catch {
      // ignore temporary adb errors
    }

    console.log("⌛ Booting...");
    await sleep(POLL_INTERVAL);
  }
}

// ---- MAIN ----
(async () => {
  try {
    console.log("🚀 Starting emulator...");

    if (!isEmulatorRunning()) {
      spawn(`${SDK}\\emulator\\emulator.exe`, [
        "-avd",
        AVD_NAME,
        "-no-snapshot",
        "-no-boot-anim"
      ], {
        detached: true,
        stdio: "ignore"
      }).unref();
    } else {
      console.log("ℹ️ Emulator already running, skipping launch");
    }

    // Wait for device connection
    console.log("⏳ Waiting for device...");
    execSync(`${ADB} wait-for-device`, { stdio: "inherit" });

    // Wait for full boot
    await waitForBoot();

    console.log("🔓 Unlocking screen...");
    execSync(`${ADB} shell input keyevent 82`);

    // Install APK
    console.log("📦 Installing APK...");
    execSync(`${ADB} install -r "${APK_PATH}"`, {
      stdio: "inherit"
    });

    // Run Maestro test
    console.log("🧪 Running Maestro test...");
    execSync(maestroCmd, { stdio: "inherit", shell: true });

    console.log("🎉 Test execution completed successfully!");

  } catch (error) {
    console.error("❌ Execution failed");
    console.error(error.message);
    process.exit(1);
  }
})();