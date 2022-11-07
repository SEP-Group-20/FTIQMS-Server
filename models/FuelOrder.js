const mongoose = require('mongoose');

const fuelOrderSchema = mongoose.Schema({
    fuelStation: {
        type: String,
        required: true
    },
    orderID: {
        type: String,
        required: true,
        unique:true
    },
    deliveryID: {
        type: String,
        required: true,
        unique:true
    },
    fuel: {
        type: String,
        required: true
    },
    fuelAmount: {
        type: Number,
        required: true
    },
    value: {
        type: Number,
        required: true
    },
    orderDate: {
        type: Date,
        required: true
    },
    deliveryDate: {
        type: Date,
        required: true
    }
});
const FuelOrder = mongoose.model('FuelOrder', fuelOrderSchema);

exports.fuelOrderSchema = fuelOrderSchema;
exports.FuelOrder = FuelOrder;