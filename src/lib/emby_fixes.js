const settings = require("../settings");
const logger = require("./logger");

const DIRECTORY_TYPE = 3;
const ALBUM_TYPE = 12;
const BATCH_SIZE = 20;

/**
 * Make sure huge directories are treated as directories, not albums
 * @param {LibraryFolder[]} libraryFolders
 * @param {DB} db
 * @return {Promise<void>}
 */
async function fixHugeAlbums(libraryFolders, db) {
  logger.info(
    `Finding entries that are marked as albums with more than ${settings.FIX_HUGE_ALBUM_FILES} files inside...`
  );

  const paths = [];
  const countsLookup = {};
  for (const lf of libraryFolders) {
    if (lf.totalFiles > settings.FIX_HUGE_ALBUM_FILES && lf.childFilesPercent < settings.FIX_HUGE_ALBUM_RATIO) {
      paths.push(lf.path);
      countsLookup[lf.path] = lf.totalFiles;
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
              } files to directory (${row.Path})`
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
 * @param {LibraryFolder[]} libraryFolders
 * @param {DB} db
 * @return {Promise<void>}
 */
async function fixDirectoryTitles(libraryFolders, db) {
  logger.info(
    `Fixing directory titles on ${libraryFolders.length} library items...`
  );
  const queue = libraryFolders.slice();
  let processed = 0;
  let fixed = 0;
  while (queue.length) {
    const batch = queue.splice(0, BATCH_SIZE);
    const updates = [];

    const paths = batch.map(lf => lf.path);
    const placeholders = paths.map(_ => "?").join(", ");
    const rows = await db.query(
      `SELECT Id, Name, Path, Type FROM MediaItems WHERE Path IN (${placeholders})`,
      paths
    );
    for (const row of rows) {
      const lf = batch.find(lf => lf.path === row.Path);
      if (!lf) {
        throw new Error(
          `We were expecting that all the items we fetch must be covered`
        );
      }

      if (row.Name === lf.name) {
        // Nothing to update
        continue;
      }

      if (row.Type === ALBUM_TYPE) {
        const isAdditionalLocation = settings.ADDITIONAL_FIX_TITLE_LOCATIONS.some(
          prefix => lf.path.startsWith(prefix)
        );
        if (!isAdditionalLocation) {
          // Not a directory and not an additional location. Skip.
          continue;
        }
        logger.debug(
          `Album at ${lf.path} will have its title fixed because it falls under ADDITIONAL_FIX_TITLE_LOCATIONS`
        );
      }

      updates.push(
        db
          .exec(
            `UPDATE MediaItems SET Name = $name, SortName = $sortName, IsLocked = 1 WHERE Id = $id`,
            {
              $id: row.Id,
              $name: lf.name,
              $sortName: lf.name.toLowerCase() // TODO: They are doing something fancy here with numbering, but meh
            }
          )
          .then(
            res => {
              if (res.changes) {
                logger.debug(`Fixed: ${lf.path}`);
                fixed++;
              }
            },
            err => {
              logger.error(`Failed to fix "${lf.path}": ${err.stack || err}`);
              throw err;
            }
          )
      );
    }

    await Promise.all(updates);

    processed += batch.length;
    logger.info(
      `Processed ${processed} out of ${libraryFolders.length} total items (${fixed} fixed)`
    );
  }

  logger.info(`All directory titles have been fixed`);

  return fixed;
}

module.exports = {
  fixHugeAlbums,
  fixDirectoryTitles
};
