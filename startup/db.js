const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

module.exports = () => {
    mongoose.connect('mongodb://localhost/FTIQMS')
        .then(() => logger.info('Successfully conneted to the MongoDB..'));
}