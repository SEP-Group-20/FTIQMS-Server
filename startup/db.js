const config = require('config');
const mongoose = require('mongoose');
const { logger } = require('../utils/logger');


module.exports = () => {
    mongoose.connect(config.DB)
        .then(() => logger.info('Successfully conneted to the MongoDB..'));
}