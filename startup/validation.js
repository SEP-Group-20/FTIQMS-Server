const Joi = require('@hapi/joi');

// here objectId validation method is added to the JOI
module.exports = ()=>{
    Joi.objectId = require('joi-objectid')(Joi);
    return Joi;
}
