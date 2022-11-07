const mongoose = require('mongoose');

const fuelSchema = mongoose.Schema({
    "MotorCycle": {
        type: Number,
        required: true,
        default: 5
    },
    "ThreeWheeler": {
        type: Number,
        required: true,
        default: 10
    },
    "Other Petrol Vehicle": {
        type: Number,
        required: true,
        default: 20
    },
    "Small Diesel Vehicle": {
        type: Number,
        required: true,
        default: 20
    },
    "Large Diesel Vehicle": {
        type: Number,
        required: true,
        default: 50
    }
});
const Fuel = mongoose.model('Fuel', fuelSchema);

exports.fuelSchema = fuelSchema;
exports.Fuel = Fuel;