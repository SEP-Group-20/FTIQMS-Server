const {format, transports, createLogger ,} = require('winston');
require('winston-mongodb');
const path = require('path');

const logFormat = format.printf(info => `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`);

const logConfiguration = {
    format: format.combine(
        format.label({ label: path.basename(process.mainModule.filename) }),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        // Format the metadata object
        format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] })
      ),
    'transports':[
        new transports.Console({
            format:format.combine(
                format.colorize(),
                logFormat
            )
        }),
        new transports.File({
            filename: 'logs/requestHandlingErrorLogs.log',
            format:format.combine(
                format.json()
            )
        }),
        new transports.MongoDB({
            db:'mongodb://localhost/shopsnet',
            level:"error",
            options:{
                useUnifiedTopology:true
            }
        })
    ]
}

const unhandledExceptionLogConfiguration = {
    format: format.combine(
        format.label({ label: path.basename(process.mainModule.filename) }),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        // Format the metadata object
        format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] })
      ),
    'transports':[
        new transports.Console({
            format:format.combine(
                format.colorize(),
                logFormat
            )
        }),
        new transports.File({
            filename: 'logs/unhandledExceptionLogs.log',
            format:format.combine(
                format.json()
            )
        })
    ]
}
const logger = createLogger(logConfiguration);
const unhandledExceptionLogger = createLogger(unhandledExceptionLogConfiguration);
exports.logger = logger;
exports.unhandledExceptionLogger = unhandledExceptionLogger;