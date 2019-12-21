const settings = require("../settings");
const logger = require("./logger");

const DIRECTORY_TYPE = 12;
const BATCH_SIZE = 20;

/**
 * Set correct titles of directory library items
 * @param {LibraryItem[]} libraryItems
 * @param {DB} db
 * @return {Promise<void>}
 */
async function fixDirectoryTitles(libraryItems, db) {
  logger.info(
    `Fixing directory titles on ${libraryItems.length} library items...`
  );
  let fixed = 0;
  let batch = [];
  for (const libraryItem of libraryItems) {
    batch.push(
      db
        .exec(
          `UPDATE MediaItems SET Name = $name, SortName = LOWER($name), IsLocked = 1 WHERE Path = $path AND type = ${DIRECTORY_TYPE}`,
          {
            $name: libraryItem.name,
            $path: libraryItem.path
          }
        )
        .then(
          res => {
            if (res.changes) {
              logger.info(`    Fixed: ${libraryItem.path}`);
              fixed++;
            } else {
              logger.debug(`Unchanged: ${libraryItem.path}`);
            }
          },
          err => {
            logger.error(
              `Failed to fix "${libraryItem.path}": ${err.stack || err}`
            );
            throw err;
          }
        )
    );
    if (batch.length >= BATCH_SIZE) {
      await Promise.all(batch);
      batch = [];
    }
  }

  await Promise.all(batch);

  logger.info(
    `Fixed titles on ${fixed} out of ${libraryItems.length} library items`
  );

  return fixed;
}

module.exports = {
  fixDirectoryTitles
};
