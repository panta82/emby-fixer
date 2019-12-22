const sqlite3 = require("sqlite3").verbose();

const settings = require("../settings");
const logger = require("./logger");

class ExecResult {
  constructor(changes, lastID) {
    this.changes = changes;
    this.lastID = lastID;
  }
}

function createDB() {
  const db = new sqlite3.Database(
    settings.EMBY_DB_PATH,
    sqlite3.OPEN_READWRITE
  );
  db.on("trace", sql => {
    // Some internal queries are like: -- PRAGMA 'main'.data_version
    if (sql[0] !== "-" && sql[1] !== "-") {
      logger.debug(`[SQL] ${sql}`);
    }
  });

  return /** @lends DB.prototype */ {
    exec,
    query,
    close
  };

  /**
   * @param sql
   * @param params
   * @return {Promise<ExecResult>}
   */
  async function exec(sql, params) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(new ExecResult(this.changes, this.lastID));
        }
      });
    });
  }

  /**
   * @param sql
   * @param params
   * @return {Promise<Object[]>}
   */
  async function query(sql, params) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, function(err, rows) {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async function close() {
    logger.debug(`Closing database`);
    return new Promise((resolve, reject) => {
      db.close(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = {
  createDB
};
