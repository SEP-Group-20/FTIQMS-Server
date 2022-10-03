const mongoose = require('mongoose');
const { CUSTOMER, MANAGER, STAFF, ADMIN } = require('../utils/rolesList');
const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const NAME_REGEX = /^[a-z ,.'-]+$/i;
const MOBILE_REGEX = /^(?:(?:\+|0{0,2})91(\s*[\ -]\s*)?|[0]?)?[456789]\d{8}|(\d[ -]?){9}\d$/;
const NIC_REGEX =/^([0-9]{9}[x|X|v|V]|[0-9]{12})$/;
// const NIC_REGEX = 

//this schema specifies how a record in a database looks like
const userSchema = mongoose.Schema({
    NIC: {
        type: String,
        pattern:NIC_REGEX
    },
    email: {
        type: String,
        pattern: EMAIL_REGEX,
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 1024
    },
    firstName: {
        type: String,
        required: true,
        pattern: NAME_REGEX
    },
    lastName: {
        type: String,
        pattern: NAME_REGEX
    },
    mobile: {
        type: String,
        pattern: MOBILE_REGEX
    },
    role: {
        type: Number,
        required: true,
        enum: [CUSTOMER, MANAGER, STAFF, ADMIN],
        default: CUSTOMER
    },
    fuelStations: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'FuelStation'
        }
    ],
    fuelAllocation: {
        Petrol: {
            type: Number
        },
        Diesel: {
            type: Number
        }
    },
    remainingFuel: {
        Petrol: {
            type: Number
        },
        Diesel: {
            type: Number
        }
    },
    vehicles: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'Vehicle'
        }
    ],
    refreshToken: {
        type: String,
        default: ""
    }
});
const User = mongoose.model('User', userSchema);

exports.userSchema = userSchema;
exports.User = User;
exports.EMAIL_REGEX = EMAIL_REGEX;
exports.NAME_REGEX = NAME_REGEX;
exports.MOBILE_REGEX = MOBILE_REGEX;