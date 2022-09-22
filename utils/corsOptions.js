const config = require('config');

const coresOptions = {

    origin: (origin, callback) => {
        if (!origin || config.AlloweOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200,

}

module.exports = coresOptions;