const _ = require('lodash');
const { User } = require('../models/User');
const { getVehicle } = require('./vehicleController');

const updateFuelAllocation = (fuelType, fuelAllocation) => {
    
    return fuelAllocation;
}

const getAllRegisteredVehicles = async (req, res) => {
    const customer = await User.findOne({
        NIC: req.body.userNIC
    }).select({
        vehicles: 1
    });

    const vehicleDetailsList = [];

    for (const vid of customer.vehicles) {
        const vehicle = await getVehicle(vid.toString());
        
        if (vehicle.success)
            vehicleDetailsList.push(vehicle.vehicle);
        else
            return res.json({success: false});
      }

    return res.json({
        success: true,
        allRegisteredVehicleDetails: vehicleDetailsList
    });
}

const getRemainingFuel = async (req, res) => {
    const customer = await User.findOne({
        NIC: req.body.userNIC
    }).select({
        remainingFuel: 1
    });

    if(!customer)
        return res.json({success: false});
    else{
        return res.json({
            success: true,
            fuel: customer.remainingFuel
        });
    }
}

module.exports = {updateFuelAllocation, getAllRegisteredVehicles, getRemainingFuel}