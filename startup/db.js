const config = require('config');
const mongoose = require('mongoose');
const { logger } = require('../utils/logger');


module.exports = () => {
    mongoose.connect(process.env.DB_CONNECTION)
        .then(() => logger.info('Successfully conneted to the MongoDB..'));
}