const mongoose = require('mongoose');

const vehicleSchema = mongoose.Schema({
    registrationNumber:{
        type:String,
        required: true,
        unique:true
    },
    chassisNumber: {
        type: String,
        required: true,
        unique:true
    },
    owner: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    make: {
        type: String,
        required: true
    },
    fuelType: {
        type: String,
        required: true
    },
    vehicleType: {
        type: String,
        required: true
    },
    notificationsSent: {
        type: Number,
        default: 0
    }
});
const Vehicle = mongoose.model('Vehicle', vehicleSchema);

exports.vehicleSchema = vehicleSchema;
exports.Vehicle = Vehicle;