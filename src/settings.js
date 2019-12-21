const assert = require("assert");

const libPath = require("path");

require("dotenv").config({
  path: libPath.resolve(__dirname, "../.env")
});

module.exports = {
  /**
   * info or debug
   */
  LOGGER_LEVEL: process.env.LOGGER_LEVEL || "info",

  /**
   * Path where enby db is stored. Try: /var/lib/emby/data/library.db
   */
  EMBY_DB_PATH: process.env.EMBY_DB_PATH,

  /**
   * Root location where your music library is
   */
  LIBRARY_LOCATION: process.env.LIBRARY_LOCATION,

  /**
   * Service name we will use to stop and restart emby server
   */
  EMBY_SERVICE_NAME: process.env.EMBY_SERVICE_NAME || "emby-server.service"
};

for (const key in module.exports) {
  if (module.exports[key] === undefined) {
    console.error(`Missing setting: ${key}`);
    process.exit(1);
  }
}
