const _ = require('lodash');
const { User } = require('../models/User');
const { startSession } = require('mongoose')
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

// update the fuel allocations of all customers
const updateCustomerFuelAllocation = async (newFuelAllocation) => {
    // start a seesion to enable transactions in the database
    const session = await startSession();
    // FIXME: sessions not working
    try {
        // start transction
        // because we need to ensure ACID properties when entering data to multiple models
        session.startTransaction();

        // get the remaining fuel, fuel allocation and vehicles list of all the customers form the database
        const customerList = await User.find({
            role: 5000
        }).select({
            NIC: 1,
            fuelAllocation: 1,
            remainingFuel: 1,
            vehicles: 1
        });

        // iterate over every customer and update them
        for (const customer of customerList) {
            let updatedFuelAllocation = {"Petrol": 0, "Diesel": 0};
            // for each vehicle of the customer get the details of it using the vehicle id
            for (const vid of customer.vehicles) {
                // get vehicle details by calling the function in the vehicle controller
                const vehicle = await getVehicle(vid.toString());
                
                // check if vehicle details retrival is successful
                if (vehicle.success)
                    // get the updated fuel allocations of fuels
                    updatedFuelAllocation[vehicle.vehicle.fuelType] += newFuelAllocation[vehicle.vehicle.vehicleType];
                else
                    return {success: false}; // if even one vehicle details retrival is a failure stop and send a error status
            }
            customer.fuelAllocation = updatedFuelAllocation; // set new fuel allocation
            customer.remainingFuel = updatedFuelAllocation; // set remaining fuel to new fuel allocation
            await customer.save(); // save updated customer to database
        }

        await session.commitTransaction(); // database update successful, commit the transaction
        session.endSession(); // end the session

        return {success: true};

    } catch (error) {
        // error happens in the transaction
        await session.abortTransaction(); // abort the transaction and rollback changes
        session.endSession(); // end the session

        // fuel allocation update unsuccessful
        return {success: false,  "message": "Fuel allocation update failed" }; // send failure message as the response
    }

}

module.exports = {updateFuelAllocation, getAllRegisteredVehicles, getRemainingFuel, updateCustomerFuelAllocation}