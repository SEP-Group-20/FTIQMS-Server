const _ = require('lodash');
const { Vehicle } = require('../models/Vehicle');
const { User } = require('../models/User');
const { startSession } = require('mongoose')
const DMTVehicles = require('../models/DMTVehicles.json');

// fuel allocation category based on vehicle type
const fuelAllocationCategorization = {
    "Petrol": [
        "MotorCycle",
        "ThreeWheeler",
        "Other Petrol Vehicle"      
    ],
    "Diesel": [
        "Small Diesel Vehicle",
        { "Large Diesel Vehicle": [ "Large Lorry", "Container Truck", "Bus"] }
    ]
};

// fuel allocations based on fuel allocation category of a vehicle
const fuelAllocations = {
    "MotorCycle": "5",
    "ThreeWheeler": "10",
    "Other Petrol Vehicle": "20",
    "Small Diesel Vehicle": "20",
    "Large Diesel Vehicle": "50"
};

// check if a given vehicle is registered before in the system, send a true or false as a response
const checkVehicleRegistered = async (req,res)=>{
    // if registration number or chassis number is not set send a error response
    if(!req.body.registrationNumber || !req.body.chassisNumber) return res.sendStatus(400);

    // find a vehicle with the given registration number and chassis number from the database
    const result = await Vehicle.findOne({ $or: [
        {registrationNumber: req.body.registrationNumber},
        {chassisNumber: req.body.chassisNumber}
    ]});
    
    // if such a vehicle cannot be found, the vehicle is not registered in the system, send a success flag as the response
    if(!result)
        return res.json({success:true});
    // if such a vehicle is found, the vehicle is registered previously in the system, send a failure flag as the response
    res.json({success:false});
}

// check if a given vehicle exists in the real world (is it in the DMT database), send the mobile number of the owner
// or 0 as a response
const checkVehicleExistence = async (req,res) => {
    // if registration number or chassis number is not set send a error response
    if(!req.body.registrationNumber || !req.body.chassisNumber) return res.sendStatus(400);

    // call the DMT vehicles API to find the existence of a vehicle, if exists returns the details of it
    const vehicleDetails = await DMTGetVehicleDetails(req.body.registrationNumber, req.body.chassisNumber);

    // if such a vehicle cannot be found, the vehicle is not registered in the DMT,
    // send 0 as the mobile number
    if(!vehicleDetails)
        return res.json({mobileNum: "0"});

    // get the mobile number of the vehicle owner and send it as the response
    res.json({mobileNum: vehicleDetails.mobileNumber});
}

// get the details of the vehicle from the DMT databse given the registration number and chassis number.
// return the details of the vehicle or an error
const getVehicleDetailsDMT = async (req,res) => {
    // if registration number or chassis number is not set send a error response
    if(!req.body.registrationNumber || !req.body.chassisNumber) return res.sendStatus(400);

    // call the DMT vehicles API to find the existence of a vehicle, if exists returns the details of it
    const vehicleDetails = await DMTGetVehicleDetails(req.body.registrationNumber, req.body.chassisNumber);

    // if such a vehicle cannot be found, the vehicle is not registered in the DMT, send a failure flag as the response
    if(!vehicleDetails)
        return res.json({success: false});

    // get the fuel allocation category of the vehicle given the vehicle type and its fuel
    const fuelAllocationCategory = getFuelAllocationCategory(vehicleDetails.vehicleType, vehicleDetails.fuelType);
    // get the fuel allocation of the vehicle given the fuel allocation category
    const fuelAllocation = getFuelAllocation(fuelAllocationCategory);

    // add those details to the vehicle details
    vehicleDetails["fuelAllocationCategory"] = fuelAllocationCategory;
    vehicleDetails["fuelAllocation"] = fuelAllocation;

    // send the details of the vehicle and a success flag as the reponse
    res.json({success: true, vehicle: vehicleDetails});
}

// register a vehicle in the system
// if this is called it is made sure that the vehicle is valid and does not already exist in the system
const registerVehicle = async (req, res) => {
    // start a seesion to enable transactions in the database
    const session = await startSession();
    // FIXME: sessions not working
    try {
        // start transction
        // because we need to ensure ACID properties when entering data to multiple models
        session.startTransaction();

        // extract the necessary details form the request and put them to the vehicle
        let vehicle = _.pick(req.body, ["registrationNumber", "chassisNumber", "owner", "make", "model", "fuelType", "vehicleType"]);

        // create new vehicle with the given details form the vehicle model
        vehicle = new Vehicle(vehicle);

        // save the vehicle in the database and get the database _id of the newly added vehicle
        const vehicleID = _.pick(await vehicle.save(), ["_id"]);

        // get the vehicle list, fuel alloacation, remaining fuel of customer using thier NIC
        const customer = await User.findOne({
            NIC: req.body.userNIC
        }).select({
            vehicles: 1,
            fuelAllocation: 1,
            remainingFuel: 1
        });

        // add the newly added vehicles _id to the vehicle list
        customer.vehicles.push(vehicleID._id);

        // get the fuel type of the vehicle
        const fuelType = vehicle.fuelType; 
        // get the fuel allocation of that vehicle based on its vehicle type
        const fuelAllocation = parseInt(getFuelAllocation(vehicle.vehicleType)); 
        customer.fuelAllocation[fuelType] += fuelAllocation; // increase fuel allocation
        customer.remainingFuel[fuelType] += fuelAllocation; // increase remainng fuel amount by the new fuel allocation

        await customer.save(); // save the updated cusotmer in the database
        await session.commitTransaction(); // database update successful, commit the transaction
        session.endSession(); // end the session

        // vehicle registration successful
        res.status(201).json({ "message": "Vehicle registraion successful" }); // send success message as the response

    } catch (error) {
        // error happens in the transaction
        await session.abortTransaction(); // abort the transaction and rollback changes
        session.endSession(); // end the session

        // vehicle registration unsuccessful
        res.status(400).json({ "message": "Vehicle registraion failed" });// send failure message as the response
    }

}

// get the details of the vehicle from the system database given the vehicle id.
// return the details of the vehicle or an error
const getVehicleDetails = async (req, res) => {

    // if vehicle id is not set send a error response
    if(!req.params.vid) 
        return res.sendStatus(400);

    // get the logged in customer's vehicle list using the customer's NIC number from the database
    const customer = await User.findOne({
        NIC: req.body.userNIC
    }).select({
        vehicles: 1
    });

    // check if the vehicle corresponding to the given vehicle id is registered under the logged in customer
    // check the vehicle id is in the vehicle list of the customer
    const isValidVehicle = customer.vehicles.includes(req.params.vid);

    // if vehicle id is not in the vehicle list of the customer, fraudulent request, send failure message as the response
    if (!isValidVehicle)
      return res.json({success: false});

    // if vehicle is valid get the details of it from the database using the vehicle id
    const result = await Vehicle.findOne({
        _id:req.params.vid
    });  

    // if such a vehicle details cannot be retirved, send failure flag as the response
    if (!result)
        return res.json({success: false});
    else{
        // if vehicle details are retirved, send the details of it and a success flag as the response
        return res.json({
            success: true,
            vehicle: result
        });
    }
}

// get the details of the vehicle from the system database given the vehicle id.
// return the details of the vehicle or an error
// called by the customer controller so no request or response to or from the frontend
const getVehicle = async (vid) => {
    // get the details of the vehicle from the database using the vehicle id
    const result = await Vehicle.findOne({
        _id:vid
    });

    // if such a vehicle details cannot be retirved, send failure flag as the response
    if (!result)
        return ({success: false});
    else{
        // if vehicle details are retirved, send the details of it and a success flag as the response
        return ({
            success: true,
            vehicle: result
        });
    }
}

// get the fuel allocation category of the vehicle from the server data given the vehicle type and fuel type.
// return the fuel allocation category of the vehicle
// called by the vehicle controller so no request or response to or from the frontend
const getFuelAllocationCategory = (vehicleType, fuelType) => {
    // if fuel type is petrol
    if (fuelType === "Petrol") {
        // find the relevant fuel allocation category for the vehicle form the petrol section
        fuelAllocationCategorization.Petrol.forEach(catergory => {
            // if category name and vehicle type matches, the fuel allocation category is the category
            if (catergory === vehicleType)
                return catergory;
        });
        // if no category name and vehicle type matches, the fuel allocation category is the other petrol vehicle category
        return "Other Petrol Vehicle";
    // if fuel type is diesel
    } else if (fuelType === "Diesel") {
        // find the relevant fuel allocation category for the vehicle form the diesel section
        if (fuelAllocationCategorization.Diesel[1]["Large Diesel Vehicle"].includes(vehicleType))
            return "Large Diesel Vehicle";
        else
            return "Small Diesel Vehicle";
    } else {
        // if no fuel tpye matches the vehicle fuel type
        return "Other";
    }
}

// get the fuel allocation of the vehicle from the server data given the fuel allocation category of the vehicle
// return the fuel allocation of the vehicle
// called by the vehicle controller so no request or response to or from the frontend
const getFuelAllocation = (fuelAllocationCategory) => {
    const fuelAllocation = fuelAllocations[fuelAllocationCategory]; // find the relevant fuel allocation
    return fuelAllocation;
}

// Dummy DMT vehicles API connected to a DMTVechicles.json file to simulate the process
// returns vehicle details if vehicle registered in the DMT else sends false
const DMTGetVehicleDetails = async (registrationNumber, chassisNumber) => {

    // find the vehicle form the DMT database (here a JSON file for simulation purposes)
    const vehicle = await DMTVehicles.find(vehicle => vehicle.registrationNumber === registrationNumber && vehicle.chassisNumber === chassisNumber);

    // if there is no such vehicle registered in the DMT send false
    if(!vehicle)
        return false;

    // vehicle is registered in the DMT, send the vehicle details
    return vehicle;
}

module.exports = {
    checkVehicleRegistered,
    checkVehicleExistence,
    getVehicleDetailsDMT,
    getVehicle,
    registerVehicle,
    getVehicleDetails
}