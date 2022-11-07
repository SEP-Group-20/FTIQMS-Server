const winston = require('winston');
const { logger } = require('../utils/logger');
/*This funtion is called id there is any unhandled exception ocurrences */
exports.errorMiddleware = (err, req, res, next) => {

    //send the status code
    if (err.message === "JoiValidationError") return res.status(400).send("InvalidInputFields");

    //log the unhandled exception
    logger.error(err.message, err);

    res.status(500).send("Something went wrong!");
}
