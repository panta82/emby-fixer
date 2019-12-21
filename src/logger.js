const pino = require("pino");
const logger = pino({
  level: require("./settings").LOGGER_LEVEL,
  prettyPrint: {
    levelFirst: true
  },
  prettifier: require("pino-pretty")
});

module.exports = logger;
