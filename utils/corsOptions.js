const { split } = require('lodash');

const coresOptions = {

    origin: (origin, callback) => {
        //accept requests only from allowed origins

        const allowedOrigins = split(process.env.ALLOWED_ORIGINS, ",");
        // console.log(allowedOrigins);
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,

}

module.exports = coresOptions;