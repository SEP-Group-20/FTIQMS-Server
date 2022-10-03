const winston = require('winston');
const { logger } = require('../utils/logger');
/*This funtion is called id there is any unhandled exception ocurrences */
exports.errorMiddleware = (err, req, res, next) => {
    //log the unhandled exception
    logger.error(err.message, err);

    //send the status code
    res.status(500).send("Something went wrong!");
}
