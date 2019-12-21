const libPath = require("path");

const glob = require("glob");

const settings = require("../settings");
const logger = require("./logger");

/**
 * @return {Promise<LibraryItem[]>}
 */
async function listLibraryItems() {
  logger.info(`Searching the library...`);
  return new Promise((resolve, reject) => {
    glob(`${settings.LIBRARY_LOCATION}/**/`, (err, paths) => {
      if (err) {
        reject(err);
      } else {
        logger.info(`Found ${paths.length} library items`);
        const items = paths.map(path => new LibraryItem(path));
        resolve(items);
      }
    });
  });
}

class LibraryItem {
  constructor(path) {
    this.path = path;
    this.name = libPath.basename(path);
  }
}

module.exports = {
  listLibraryItems
};
