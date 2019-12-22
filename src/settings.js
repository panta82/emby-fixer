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
  EMBY_SERVICE_NAME: process.env.EMBY_SERVICE_NAME || "emby-server.service",

  /**
   * How many files should there be in a directory (including children) for us to convert it
   * from "album" to "folder".
   */
  MAX_FILES_IN_ALBUM: process.env.MAX_FILES_IN_ALBUM || 500,

  /**
   * List of directory prefixes where all subdirectories will be treated as "folders" instead of "albums",
   * no matter the file count. I added this to cover my "mixes" directory.
   * Different paths are delimited with pipe ("|") char.
   */
  NO_ALBUM_ZONES: (process.env.NO_ALBUM_ZONES || "")
    .split("|")
    .filter(Boolean)
};

for (const key in module.exports) {
  if (module.exports[key] === undefined) {
    console.error(`Missing setting: ${key}`);
    process.exit(1);
  }
}
