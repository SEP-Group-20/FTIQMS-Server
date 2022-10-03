const express = require('express');
const { logger } = require('./utils/logger');
const dotenv = require('dotenv');
const config = require('config');
const app = express();
dotenv.config();

require('./startup/validation');
require('./startup/logging')();
require('./startup/routes')(app);
require('./startup/db')();


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    logger.info("Listning to the PORT: " + PORT);
});

module.exports = app;


