const settings = require("../settings");
const logger = require("./logger");

const DIRECTORY_TYPE = 3;
const ALBUM_TYPE = 12;
const BATCH_SIZE = 20;
const MAX_FILES_IN_ALBUM = 500;

const PATH_IGNORE_LIST = [
  /[\/]\.[^\/]+$/ // Unixy hidden directories
];

/**
 * Set correct titles of directory library items
 * @param {LibraryItem[]} libraryItems
 * @param {DB} db
 * @return {Promise<void>}
 */
async function fixDirectoryTitles(libraryItems, db) {
  let ignoredCount = 0;
  const targetItems = [];
  for (const libraryItem of libraryItems) {
    for (const regex of PATH_IGNORE_LIST) {
      if (regex.test(libraryItem.path)) {
        ignoredCount++;
      } else {
        targetItems.push(libraryItem);
      }
    }
  }

  logger.info(
    `Fixing directory titles on ${targetItems.length} library items (${ignoredCount} ignored)...`
  );
  let checked = 0;
  let fixed = 0;
  let batch = [];
  for (const libraryItem of targetItems) {
    batch.push(
      db
        .exec(
          `UPDATE MediaItems SET Name = $name, SortName = LOWER($name), IsLocked = 1 WHERE Path = $path AND Type = ${DIRECTORY_TYPE}`,
          {
            $name: libraryItem.name,
            $path: libraryItem.path
          }
        )
        .then(
          res => {
            if (res.changes) {
              logger.info(`Fixed: ${libraryItem.path}`);
              fixed++;
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
      checked += batch.length;
      logger.info(`Checked ${checked}/${targetItems.length} library items...`);
      batch = [];
    }
  }

  await Promise.all(batch);

  logger.info(
    `Fixed titles on ${fixed} out of ${targetItems.length} library items`
  );

  return fixed;
}

/**
 * Make sure huge directories are treated as directories, not albums
 * @param {LibraryItem[]} libraryItems
 * @param {DB} db
 * @return {Promise<void>}
 */
async function fixHugeAlbums(libraryItems, db) {
  logger.info(
    `Finding entries that are marked as albums with more than ${MAX_FILES_IN_ALBUM} files inside...`
  );

  const paths = [];
  const countsLookup = {};
  for (const libraryItem of libraryItems) {
    if (libraryItem.files > MAX_FILES_IN_ALBUM) {
      paths.push(libraryItem.path);
      countsLookup[libraryItem.path] = libraryItem.files;
    }
  }
  const placeholders = paths.map(() => "?").join(", ");

  const rows = await db.query(
    `SELECT Id, Name, Path FROM MediaItems WHERE Path IN (${placeholders}) AND Type = ${ALBUM_TYPE}`,
    paths
  );

  if (!rows.length) {
    logger.info(`No problematic album entries were found.`);
    return 0;
  }

  logger.info(
    `Found ${rows.length} problematic album entries. Converting them to directories...`
  );

  let batch = [];
  for (const row of rows) {
    batch.push(
      db
        .exec(`UPDATE MediaItems SET Type = ${DIRECTORY_TYPE} WHERE Id = $id`, {
          $id: row.Id
        })
        .then(
          () => {
            logger.info(
              `Converted media item ${row.Id} with ${
                countsLookup[row.Path]
              } files to directory (${row.Name})`
            );
          },
          err => {
            logger.error(
              `Failed to convert media item ${row.Id}: ${err.stack || err}`
            );
            throw err;
          }
        )
    );
    if (batch.length >= BATCH_SIZE) {
      await Promise.resolve(batch);
    }
  }

  await Promise.resolve(batch);

  logger.info(`Converting done`);

  return rows.length;
}

module.exports = {
  fixDirectoryTitles,
  fixHugeAlbums
};
