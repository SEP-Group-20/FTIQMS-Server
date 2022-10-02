const _ = require('lodash');
const { User } = require('../models/User');
const { getVehicle } = require('./vehicleController');

// incomplete and not used any where
const updateFuelAllocation = (fuelType, fuelAllocation) => {
    return fuelAllocation;
}

// get details of all the registered vehicles of a cusomtomer 
const getAllRegisteredVehicles = async (req, res) => {
    // get the logged in customer's vehicle list using the customer's NIC number from the database
    const customer = await User.findOne({
        NIC: req.body.userNIC
    }).select({
        vehicles: 1
    });

    const vehicleDetailsList = [];

    // for each vehicle get the details of it using the vehicle id
    for (const vid of customer.vehicles) {
        // get vehicle details by calling the function in the vehicle controller
        const vehicle = await getVehicle(vid.toString());
        
        // check if vehicle details retrival is successful
        if (vehicle.success)
            vehicleDetailsList.push(vehicle.vehicle); // if successful add the vehicle details to the list
        else
            return res.json({success: false}); // if even one vehicle details retrival is a failure stop and send a error status
      }

    // if all vehicle detail retrival is successful send the details to the frontend as a response with a success flag
    return res.json({
        success: true,
        allRegisteredVehicleDetails: vehicleDetailsList
    });
}

// get remaining petrol and diesel amounts of the customer
const getRemainingFuel = async (req, res) => {
    // get the logged in customer's remaining fuel details using the customer's NIC number from the database
    const customer = await User.findOne({
        NIC: req.body.userNIC
    }).select({
        remainingFuel: 1
    });

    // check if remaining fuel details retrival is successful
    if(!customer)
        return res.json({success: false}); // if it is a failure send a error flag as the response
    else{
        // if all remaining fuel details retrival is successful,
        // send the details to the frontend as a response with a success flag
        return res.json({
            success: true,
            fuel: customer.remainingFuel
        });
    }
}

module.exports = {updateFuelAllocation, getAllRegisteredVehicles, getRemainingFuel}