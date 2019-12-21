const pino = require("pino");
const logger = pino({
  level: require("../settings").LOGGER_LEVEL,
  prettyPrint: {
    levelFirst: true
  },
  prettifier: require("pino-pretty")
});

module.exports = {
  info: msg => logger.info(msg),
  debug: msg => logger.debug(msg),
  error: msg => logger.error(msg)
};
