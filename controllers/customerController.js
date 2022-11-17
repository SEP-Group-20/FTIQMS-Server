const _ = require('lodash');
const bcrypt = require('bcrypt');
const { User } = require('../models/User');
const { startSession } = require('mongoose')
const { getVehicle } = require('./vehicleController');
const { getFuelStation } = require('./fuelStationController');
const { Vehicle } = require('../models/Vehicle');

const SALT_ROUNDS = 9;

// incomplete and not used any where
const updateFuelAllocation = (fuelType, fuelAllocation) => {
    return fuelAllocation;
}

// get details of a cusomtomer 
const getCustomerDetails = async (req, res) => {

    if (!req.body.userNIC) return res.sendStatus(400);

    // get the logged in customer's details using the NIC number from the database
    const customer = await User.findOne({
        NIC: req.body.userNIC
    });

    if (!customer) return res.sendStatus(400);

    let customerDetails = _.pick(customer, [
        "NIC",
        "firstName",
        "lastName",
        "mobile",
        "fuelAllocation",
        "remainingFuel",
        "vehicles",
    ]);

    customerDetails["fuelStations"] = [];
    customerDetails["vehicles"] = [];

    // for each fuel station get the details of it using the fuel station id
    for (const fsid of customer.fuelStations) {
        // get fuel station details by calling the function in the fuel station controller
        const fuelStation = await getFuelStation(fsid.toString());

        // check if fuel station details retrival is successful
        if (fuelStation.success)
            customerDetails["fuelStations"].push(fuelStation.fuelStation.name); // if successful add the fuel station details to customerDetails
        else
            return res.json({ success: false }); // if even one fuel station details retrival is a failure stop and send a error status
    }

    // for each vehicle get the details of it using the vehicle id
    for (const vid of customer.vehicles) {
        // get vehicle details by calling the function in the vehicle controller
        const vehicle = await getVehicle(vid.toString());

        // check if vehicle details retrival is successful
        if (vehicle.success)
            customerDetails["vehicles"].push(vehicle.vehicle); // if successful add the vehicle details to the list
        else
            return res.json({ success: false }); // if even one vehicle details retrival is a failure stop and send a error status
    }

    // if all vehicle detail retrival is successful send the details to the frontend as a response with a success flag
    return res.json({
        success: true,
        customerDetails: customerDetails
    });
}


// get details of all the registered vehicles of a cusomtomer 
const getAllRegisteredVehicles = async (req, res) => {

    if (!req.body.userNIC) return res.sendStatus(400);

    // get the logged in customer's vehicle list using the customer's NIC number from the database
    const customer = await User.findOne({
        NIC: req.body.userNIC
    }).select({
        vehicles: 1
    });

    if (!customer) return res.sendStatus(400);

    const vehicleDetailsList = [];

    // for each vehicle get the details of it using the vehicle id
    for (const vid of customer.vehicles) {
        // get vehicle details by calling the function in the vehicle controller
        const vehicle = await getVehicle(vid.toString());

        // check if vehicle details retrival is successful
        if (vehicle.success)
            vehicleDetailsList.push(vehicle.vehicle); // if successful add the vehicle details to the list
        else
            return res.json({ success: false }); // if even one vehicle details retrival is a failure stop and send a error status
    }

    // if all vehicle detail retrival is successful send the details to the frontend as a response with a success flag
    return res.json({
        success: true,
        allRegisteredVehicleDetails: vehicleDetailsList
    });
}

// get remaining petrol and diesel amounts of the customer
const getRemainingFuel = async (req, res) => {
    if (!req.body.userNIC) return res.sendStatus(400);

    // get the logged in customer's remaining fuel details using the customer's NIC number from the database
    const customer = await User.findOne({
        NIC: req.body.userNIC
    }).select({
        remainingFuel: 1
    });

    if (!customer) return res.sendStatus(400);

    // check if remaining fuel details retrival is successful
    if (!customer)
        return res.json({ success: false }); // if it is a failure send a error flag as the response
    else {
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
            let updatedFuelAllocation = { "Petrol": 0, "Diesel": 0 };
            // for each vehicle of the customer get the details of it using the vehicle id
            for (const vid of customer.vehicles) {
                // get vehicle details by calling the function in the vehicle controller
                const vehicle = await getVehicle(vid.toString());

                // check if vehicle details retrival is successful
                if (vehicle.success)
                    // get the updated fuel allocations of fuels
                    updatedFuelAllocation[vehicle.vehicle.fuelType] += newFuelAllocation[vehicle.vehicle.vehicleType];
                else
                    return { success: false }; // if even one vehicle details retrival is a failure stop and send a error status
            }
            customer.fuelAllocation = updatedFuelAllocation; // set new fuel allocation
            customer.remainingFuel = updatedFuelAllocation; // set remaining fuel to new fuel allocation
            await customer.save(); // save updated customer to database
        }

        await session.commitTransaction(); // database update successful, commit the transaction
        session.endSession(); // end the session

        return { success: true };

    } catch (error) {
        // error happens in the transaction
        await session.abortTransaction(); // abort the transaction and rollback changes
        session.endSession(); // end the session

        // fuel allocation update unsuccessful
        return { success: false, "message": "Fuel allocation update failed" }; // send failure message as the response
    }

}

// reset the password of the customer
const resetPassword = async (req, res) => {
    if (!req.body.userNIC || !req.body.newPassword) return res.sendStatus(400);
    let forgot;
    forgot = (req.body.forgot) ? true : false;

    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;

    // get the logged in customer's password using the customer's NIC number from the database
    const customer = await User.findOne({
        NIC: req.body.userNIC
    }).select({
        password: 1
    });

    if (!customer) return res.sendStatus(400);

    if (!forgot) {//compare the stored password and password which is entered by the user
        const result = await bcrypt.compare(oldPassword, customer.password);

        // check if the current password has and old password hash match
        if (!result) {
            return res.json({
                success: false,
                message: "Wrong old password"
            });
        }
    }

    // hash the old password
    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // set the password as the new hshed password
    customer.password = newHash;

    // save the updated customer
    await customer.save();

    // send the details to the frontend as a response with a success flag
    return res.json({
        success: true,
        message: "Password reset successful"
    });
}

// get the details of the customer to display on the dashboard
const getDashboardDetails = async (req, res) => {
    if (!req.body.userNIC) return res.sendStatus(400);

    // get the logged in customer's details using the customer's NIC number from the database
    const customer = await User.findOne({
        NIC: req.body.userNIC
    }).select({
        _id: 1,
        fuelAllocation: 1,
        remainingFuel: 1
    });

    // if there is no such customer send an error
    if (!customer) return res.sendStatus(400);

    // initialize the customer details
    let customerDetails = {"Petrol": {}, "Diesel": {}}

    // set customer fuel allocations and remainign fuel details
    customerDetails.Petrol["fuelAllocation"] = customer.fuelAllocation.Petrol;
    customerDetails.Petrol["remainingFuel"] = customer.remainingFuel.Petrol;
    customerDetails.Diesel["fuelAllocation"] = customer.fuelAllocation.Diesel;
    customerDetails.Diesel["remainingFuel"] = customer.remainingFuel.Diesel;
    
    // get the logged in customer's vehicles using the customer's id from the database
    const customerVehicles = await Vehicle.find({
        registeredUnder: customer._id
    }).select({
        fuelType: 1,
        isQueued: 1,
        notificationsSent: 1
    });
    
    // iterate over each customer vehicle
    for (const vehicle of customerVehicles) {
        // check if a vehicle is queued for its fuel
        customerDetails[vehicle.fuelType]["isQueued"] = customerDetails[vehicle.fuelType]["isQueued"] || vehicle.isQueued;

        // check if a vehicle has received notification for its fuel
        if (vehicle.notificationsSent > 0)
            customerDetails[vehicle.fuelType]["notificationsSent"] = customerDetails[vehicle.fuelType]["notificationsSent"] || true;
        else
        customerDetails[vehicle.fuelType]["notificationsSent"] = customerDetails[vehicle.fuelType]["notificationsSent"] || false;
    }
    
    // send the details to the frontend as a response with a success flag
    return res.json({
        success: true,
        customerDetails: customerDetails
    });
}

module.exports = {
    getCustomerDetails,
    updateFuelAllocation,
    getAllRegisteredVehicles,
    getRemainingFuel,
    updateCustomerFuelAllocation,
    resetPassword,
    getDashboardDetails
}