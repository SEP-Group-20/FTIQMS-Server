const express = require('express');
const {logger} = require('./utils/logger');
const dotenv = require('dotenv');
const config = require('config');
const app = express();
dotenv.config();

require('./startup/validation');
require('./startup/logging');
require('./startup/routes')(app);
require('./startup/db')();

// console.log(config.get('DB_NAME'))

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>{
    logger.info("Listning to the PORT: "+PORT);
});


