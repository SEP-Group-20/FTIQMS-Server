const _ = require('lodash');
const { startSession, Types } = require('mongoose');
const { Fuel } = require('../models/Fuel');
const MFEFuelAllocations = require('../models/MFEFuelAllocations.json');
const { updateCustomerFuelAllocation } = require('./customerController');

// update the fuel allocations of the systems and the customers
// return the success or an error
// called by the index file so no request or response to or from the frontend
const updateFuelAllocations = async () => {
    // get the current fuel allocation form the Ministry of Fuel and Energy
    const fuelAllocations = await MFEFuelAllocations;

    // get the current fuel allocations from the database
    const fuel = await Fuel.findOne({}).select({
        "MotorCycle": 1,
        "ThreeWheeler": 1,
        "Other Petrol Vehicle": 1,
        "Small Diesel Vehicle": 1,
        "Large Diesel Vehicle": 1
    });

    // update the fuel allocations
    fuel["MotorCycle"] = fuelAllocations["MotorCycle"];
    fuel["ThreeWheeler"] = fuelAllocations["ThreeWheeler"];
    fuel["Other Petrol Vehicle"] = fuelAllocations["Other Petrol Vehicle"];
    fuel["Small Diesel Vehicle"] = fuelAllocations["Small Diesel Vehicle"];
    fuel["Large Diesel Vehicle"] = fuelAllocations["Large Diesel Vehicle"];

    // save the new fuel allocations in the database
    await fuel.save();

    const newFuelAllocation = _.pick(fuel, [
        "MotorCycle", "ThreeWheeler", "Other Petrol Vehicle", "Small Diesel Vehicle", "Large Diesel Vehicle"
    ]);

    // update fuel allocations of every customer
    const result = await updateCustomerFuelAllocation(newFuelAllocation);

    return result;
}

module.exports = {
    updateFuelAllocations
}