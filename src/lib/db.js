const sqlite3 = require("sqlite3").verbose();

const settings = require("../settings");
const logger = require("./logger");

const db = new sqlite3.Database(settings.EMBY_DB_PATH);
db.on("trace", sql => {
  logger.debug(`[SQL] ${sql}`);
});

module.exports = db;
