const {unhandledExceptionLogger} = require('../utils/logger');

module.exports = ()=>{
    process.on('uncaughtException',(err)=>{
        unhandledExceptionLogger.error(err.message,err);
        process.exit(1);
    });
    process.on('unhandledRejection',(err)=>{
        throw err;
    })
}