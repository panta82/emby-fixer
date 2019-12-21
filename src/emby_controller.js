const exec = require("child_process").exec;

const settings = require("./settings");
const logger = require("./logger");

async function systemctl(cmd, ...services) {
  const command = `sudo systemctl ${cmd} ${services.join(" ")}`;
  logger.debug(`CMD: ${command}`);
  return new Promise((resolve, reject) => {
    return exec(command, (err, stdout, stderr) => {
      if (err.code === 3) {
        // No idea why sudo does this
        err = null;
      }
      if (err) {
        console.error(stderr);
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function isEmbyRunning() {
  const stdout = await systemctl("is-active", settings.EMBY_SERVICE_NAME);
  return stdout.trim() === "active";
}

async function stopEmby() {
  logger.info(`Stopping ${settings.EMBY_SERVICE_NAME}...`);
  return systemctl("stop", settings.EMBY_SERVICE_NAME);
}

async function startEmby() {
  logger.info(`Starting ${settings.EMBY_SERVICE_NAME}...`);
  return systemctl("start", settings.EMBY_SERVICE_NAME);
}

async function withEmbyDisabled(executor) {
  const runningAtStart = await isEmbyRunning();
  try {
    if (runningAtStart) {
      await stopEmby();
    }
    await executor();
  } finally {
    if (runningAtStart) {
      await startEmby();
    }
  }
}

module.exports = {
  withEmbyDisabled
};
