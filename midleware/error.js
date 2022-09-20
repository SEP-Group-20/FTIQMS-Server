const winston = require('winston');
const { logger } = require('../utils/logger');
exports.errorMiddleware = (err, req, res, next) => {
    logger.error(err.message, err);
    //log the exeption
    res.status(500).send("Something went wrong!");
}
