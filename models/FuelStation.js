const mongoose = require('mongoose');
const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const NAME_REGEX = /^[a-z ,.'-]+$/i;
const MOBILE_REGEX = /^(?:(?:\+|0{0,2})91(\s*[\ -]\s*)?|[0]?)?[456789]\d{8}|(\d[ -]?){9}\d$/;

const fuelStationSchema = mongoose.Schema({
    registrationNumber: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    ownerFirstName: {
        type: String,
        required: true,
        pattern: NAME_REGEX
    },
    ownerLastName: {
        type: String,
        required: true,
        pattern: NAME_REGEX
    },
    email: {
        type: String,
        required: true,
        unique: true,
        pattern: EMAIL_REGEX,
    },
    address: {
        No: {
            type: String,
            required: true
        },
        StreetName: {
            type: String,
            required: true
        },
        Town: {
            type: String,
            required: true
        },
        City: {
            type: String,
            required: true
        },
        District: {
            type: String,
            required: true
        }
    },
    location: {
        Latitude: {
            type: String
        },
        Longitude: {
            type: String
        }
    },
    mobile: {
        type: String,
        required: true,
        pattern: MOBILE_REGEX
    },
    fuelSold: [
        {
            type: String
        }
    ],
    fuelPumps: {
        Petrol: {
            type: Number,
            required: true,
            default: 0
        },
        Diesel: {
            type: Number,
            required: true,
            default: 0
        }
    },
    remainingFuel: {
        Petrol: {
            type: Number,
            default: 0
        },
        Diesel: {
            type: Number,
            default: 0
        }
    },
    fuelAvailability: {
        Petrol: {
            type: Boolean,
            default: false
        },
        Diesel: {
            type: Boolean,
            default: false
        }
    },
    fuelQueue: {
        Petrol: [
            {
                type: mongoose.Types.ObjectId,
                ref: 'Vehicle'
              }
        ],
        Diesel: [
            {
                type: mongoose.Types.ObjectId,
                ref: 'Vehicle'
              }
        ],
    },
    fuelOrders: [
        {
          type: mongoose.Types.ObjectId,
          ref: 'FuelOrder'
        }
    ],
    ownerUID: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    staffPassword: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 1024
    },
});
const FuelStation = mongoose.model('FuelStation', fuelStationSchema);

exports.fuelStationSchema = fuelStationSchema;
exports.FuelStation = FuelStation;