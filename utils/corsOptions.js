const config = require('config');

const coresOptions = {

    origin: (origin, callback) => {
        //accept requests only from allowed origins
        if (!origin || config.AlloweOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,

}

module.exports = coresOptions;