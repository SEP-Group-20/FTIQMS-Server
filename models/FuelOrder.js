const mongoose = require('mongoose');

const fuelOrderSchema = mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique:true
    },
    deliveryNumber: {
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
    },
    fuelStationID: {
        type: mongoose.Types.ObjectId,
        ref: 'FuelStation',
        required: true
    }
});
const FuelOrder = mongoose.model('FuelOrder', fuelOrderSchema);

exports.fuelOrderSchema = fuelOrderSchema;
exports.FuelOrder = FuelOrder;