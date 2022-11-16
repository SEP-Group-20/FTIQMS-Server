const { format, transports, createLogger, } = require('winston');
// // require('winston-mongodb');
// const config = require('config');
// const path = require('path');

//specifies logging format
const logFormat = format.printf(info => `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`);

// this specifies logging configuration
const logConfiguration = {
    format: format.combine(
        //format.label({ label: path.basename(process.mainModule.filename) }),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        // Format the metadata object
        format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] })
    ),
    'transports': [
        new transports.Console({
            format: format.combine(
                format.colorize(),
                logFormat
            )
        }),
        new transports.File({
            filename: 'logs/requestHandlingErrorLogs.log',
            format: format.combine(
                format.json()
            )
        }),
        // new transports.MongoDB({
        //     db: config.DB,
        //     level: "error",
        //     options: {
        //         useUnifiedTopology: true
        //     }
        // })
    ]
}

//this is the format and the configuration for unhandledExceptions 
const unhandledExceptionLogConfiguration = {
    format: format.combine(
        //format.label({ label: path.basename(process.mainModule.filename) }),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        // Format the metadata object
        format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] })
    ),
    'transports': [
        new transports.Console({
            format: format.combine(
                format.colorize(),
                logFormat
            )
        }),
        new transports.File({
            filename: 'logs/unhandledExceptionLogs.log',
            format: format.combine(
                format.json()
            )
        })
    ]
}
const logger = createLogger(logConfiguration);
const unhandledExceptionLogger = createLogger(unhandledExceptionLogConfiguration);
exports.logger = logger;
exports.unhandledExceptionLogger = unhandledExceptionLogger;