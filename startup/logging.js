const { unhandledExceptionLogger } = require('../utils/logger');

module.exports = () => {
    // assign event handler for uncaughtExceptions 
    process.on('uncaughtException', (err) => {
        unhandledExceptionLogger.error(err.message, err);
        process.exit(1);
    });
    // assign event handler for unhandled promise rejections
    process.on('unhandledRejection', (err) => {
        console.log("There is an unhandled rejection!");
        throw err;
    })
}