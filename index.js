const express = require('express');
const { logger } = require('./utils/logger');
const dotenv = require('dotenv');
const config = require('config');
const { updateFuelAllocations } = require('./controllers/fuelController');
const app = express();
dotenv.config();

require('./startup/validation');
require('./startup/logging')();
require('./startup/routes')(app);
require('./startup/db')();


const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        logger.info("Listning to the PORT: " + PORT);
    });
}

const sleep = ms => new Promise(res => setTimeout(res, ms));

const getDate = () => {
    // Date object initialized as per New Zealand timezone. Returns a datetime string
    let sl_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" });

    // Date object initialized from the above datetime string
    let date_sl = new Date(sl_date_string);

    let day = date_sl.getDay(); // sunday: 0, monday: 1, ..., saturday: 6

    // hours as (HH) format
    let hours = ("0" + date_sl.getHours()).slice(-2);

    // minutes as (mm) format
    let minutes = ("0" + date_sl.getMinutes()).slice(-2);

    let currentTime = hours+":"+minutes

    return [day, currentTime];
}

(async function() {
    let called = false

    while(true) {
        await sleep(30000);
        let currentDayTime = getDate();
        let triggerTime = "23:55"

        if (currentDayTime[0] === 0 && (currentDayTime[1] === triggerTime) && !called) {
            const result = await updateFuelAllocations();
            if (result.success)
                called = true;
            else
                console.log("someting went wrong!");
        }
        else if (!(currentDayTime[0] === 0 && (currentDayTime[1] === triggerTime)))
            called = false
    }

})();

module.exports = app;


