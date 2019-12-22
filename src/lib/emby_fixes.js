const settings = require("../settings");
const logger = require("./logger");

const DIRECTORY_TYPE = 3;
const ALBUM_TYPE = 12;
const BATCH_SIZE = 20;

/**
 * Make sure huge directories are treated as directories, not albums
 * @param {LibraryItem[]} libraryItems
 * @param {DB} db
 * @return {Promise<void>}
 */
async function fixHugeAlbums(libraryItems, db) {
  logger.info(
    `Finding entries that are marked as albums with more than ${settings.MAX_FILES_IN_ALBUM} files inside...`
  );

  const paths = [];
  const countsLookup = {};
  for (const libraryItem of libraryItems) {
    if (
      libraryItem.files > settings.MAX_FILES_IN_ALBUM ||
      settings.NO_ALBUM_ZONES.some(prefix =>
        libraryItem.path.startsWith(prefix)
      )
    ) {
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
  const queue = libraryItems.slice();
  let processed = 0;
  let fixed = 0;
  while (queue.length) {
    const batch = queue.splice(0, BATCH_SIZE);
    const updates = [];

    const paths = batch.map(item => item.path);
    const placeholders = paths.map(_ => "?").join(", ");
    const rows = await db.query(
      `SELECT Id, Name, Path FROM MediaItems WHERE Path IN (${placeholders})  AND Type = ${DIRECTORY_TYPE}`,
      paths
    );
    for (const row of rows) {
      const item = batch.find(item => item.path === row.Path);
      if (!item) {
        throw new Error(
          `We were expecting that all the items we fetch must be covered`
        );
      }

      if (row.Name !== item.name) {
        // Need to update it
        updates.push(
          db
            .exec(
              `UPDATE MediaItems SET Name = $name, SortName = $sortName, IsLocked = 1 WHERE Id = $id`,
              {
                $id: row.Id,
                $name: item.name,
                $sortName: item.name.toLowerCase() // TODO: They are doing something fancy here with numbering, but meh
              }
            )
            .then(
              res => {
                if (res.changes) {
                  logger.debug(`Fixed: ${item.path}`);
                  fixed++;
                }
              },
              err => {
                logger.error(
                  `Failed to fix "${item.path}": ${err.stack || err}`
                );
                throw err;
              }
            )
        );
      }
    }

    await Promise.all(updates);

    processed += batch.length;
    logger.info(
      `Processed ${processed} out of ${libraryItems.length} total items (${fixed} fixed)`
    );
  }

  logger.info(`All directory titles have been fixed`);

  return fixed;
}

module.exports = {
  fixHugeAlbums,
  fixDirectoryTitles
};
