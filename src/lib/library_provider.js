const libPath = require("path");
const libOS = require("os");

const readdirPlus = require("readdir-plus");

const settings = require("../settings");
const logger = require("./logger");

/**
 * @param {LibraryItem[]} results
 * @param {ReaddirPlusFile} file
 */
function gatherResultsFromFile(results, file) {
  if (file.type !== "directory") {
    // Only care about directories
    return 1;
  }

  const result = new LibraryItem(file.path);
  results.push(result);

  let fileCount = 0;
  for (const child of file.content) {
    if (child.type === "file") {
      // Count files
      fileCount++;
    } else {
      // Recursively add child directories
      fileCount += gatherResultsFromFile(results, child);
    }
  }

  result.files = fileCount;

  return fileCount;
}

/**
 * @return {Promise<LibraryItem[]>}
 */
async function listLibraryItems() {
  logger.info(`Searching the library at ${settings.LIBRARY_LOCATION} ...`);
  return new Promise((resolve, reject) => {
    return readdirPlus(
      settings.LIBRARY_LOCATION,
      {
        tree: true,
        readdir: {
          errorStrategy: "fatal"
        },
        stat: {
          errorStrategy: "fatal"
        },
        filter: {
          file: true,
          directory: true
        }
      },
      (err, files) => {
        if (err) {
          return reject(err);
        }

        logger.debug(`Tallying children counts...`);

        const results = [];
        for (const file of files) {
          gatherResultsFromFile(results, file);
        }

        resolve(results);
      }
    );
  });
}

class LibraryItem {
  constructor(path) {
    if (path[path.length - 1] === libPath.sep) {
      path = path.slice(0, path.length - 1);
    }
    this.path = path;
    this.name = libPath.basename(path);
    this.files = 0;
  }
}

module.exports = {
  listLibraryItems
};
