const libPath = require("path");
const libOS = require("os");

const readdirPlus = require("readdir-plus");

const settings = require("../settings");
const logger = require("./logger");

/**
 * @param {LibraryFolder[]} results
 * @param {ReaddirPlusFile} file
 * @return {LibraryFolder}
 */
function gatherResultsFromFile(results, file) {
  if (file.type !== "directory") {
    // Only care about directories
    return null;
  }

  const lf = new LibraryFolder(file.path);
  results.push(lf);

  for (const child of file.content) {
    if (child.type === "file") {
      // Count files
      lf.childFiles++;
      lf.totalFiles++;
    } else {
      // Recursively add child directories
      const childResult = gatherResultsFromFile(results, child);
      lf.childFolders++;
      lf.totalFiles += childResult.totalFiles;
      lf.totalFolders += childResult.totalFolders + 1;
    }
  }

  return lf;
}

/**
 * @return {Promise<LibraryFolder[]>}
 */
async function listLibraryFolders() {
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

class LibraryFolder {
  constructor(path) {
    if (path[path.length - 1] === libPath.sep) {
      path = path.slice(0, path.length - 1);
    }
    this.path = path;
    this.name = libPath.basename(path);
    this.childFolders = 0;
    this.childFiles = 0;
    this.totalFolders = 0;
    this.totalFiles = 0;
  }

  /**
   * Percent of total files that are its direct children
   * @return {number}
   */
  get childFilesPercent() {
    return this.totalFiles === 0
      ? 0
      : (this.childFiles * 100) / this.totalFiles;
  }
}

module.exports = {
  listLibraryFolders
};
