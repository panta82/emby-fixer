const assert = require("assert");

const libPath = require("path");

require("dotenv").config({
  path: libPath.resolve(__dirname, "../.env")
});

module.exports = {
  LOGGER_LEVEL: process.env.LOGGER_LEVEL || "info",
  EMBY_DB_PATH: process.env.EMBY_DB_PATH,
  LIBRARY_LOCATION: process.env.LIBRARY_LOCATION,
  EMBY_SERVICE_NAME: process.env.EMBY_SERVICE_NAME || "emby-server.service"
};

for (const key in module.exports) {
  if (module.exports[key] === undefined) {
    console.error(`Missing setting: ${key}`);
    process.exit(1);
  }
}
