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
   * from "album" to "folder". There will be other conditions applied as well.
   */
  FIX_HUGE_ALBUM_FILES: process.env.FIX_HUGE_ALBUM_FILES || 500,

  /**
   * Needed ratio (%) of direct children towards total children for us to convert "album" to "folder".
   */
  FIX_HUGE_ALBUM_RATIO:
    "FIX_HUGE_ALBUM_RATIO" in process.env
      ? Number(process.env.FIX_HUGE_ALBUM_RATIO)
      : 10,

  /**
   * List of directory prefixes where all entries will be retitled to directory names, even if they are tagged as "albums".
   * This is useful for something like a "mix" folder where you just drop random files.
   * Different paths are delimited with pipe ("|") char.
   */
  ADDITIONAL_FIX_TITLE_LOCATIONS: (
    process.env.ADDITIONAL_FIX_TITLE_LOCATIONS || ""
  )
    .split("|")
    .filter(Boolean)
};

for (const key in module.exports) {
  if (module.exports[key] === undefined) {
    console.error(`Missing setting: ${key}`);
    process.exit(1);
  }
}
