const Joi = require('joi');

// here objectId validation method is added to the JOI
module.exports = ()=>{
    Joi.objectId = require('joi-objectid')(Joi);
}
