const _ = require('lodash');
const { Vehicle } = require('../models/Vehicle');
const { User } = require('../models/User');
const { startSession, Types } = require('mongoose')
const DMTVehicles = require('../models/DMTVehicles.json');
const { getFuelQueue } = require('./fuelStationController');
const { FuelStation } = require('../models/FuelStation');
const { Fuel } = require('../models/Fuel');

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
    const fuelAllocation = await getFuelAllocation(fuelAllocationCategory);

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
        let vehicle = _.pick(req.body, ["registrationNumber", "chassisNumber", "owner", "make", "model", "fuelType", "vehicleType", "registeredUnder"]);

        // create new vehicle with the given details form the vehicle model
        vehicle = new Vehicle(vehicle);

        // save the vehicle in the database and get the database _id of the newly added vehicle
        const vehicleID = _.pick(await vehicle.save(), ["_id"]);

        // get the vehicle list, fuel alloacation, remaining fuel of customer using their NIC
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
        let fuelAllocation = await getFuelAllocation(vehicle.vehicleType);
        fuelAllocation = parseInt(fuelAllocation);
        customer.fuelAllocation[fuelType] += fuelAllocation; // increase fuel allocation
        customer.remainingFuel[fuelType] += fuelAllocation; // increase remainng fuel amount by the new fuel allocation

        await customer.save(); // save the updated customer in the database
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
        for (const category of fuelAllocationCategorization.Petrol) {
            // if category name and vehicle type matches, the fuel allocation category is the category
            if (category === vehicleType)
                return category;     
        }
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
const getFuelAllocation = async (fuelAllocationCategory) => {
    const fuelAllocations = await Fuel.findOne({}).select({
        "MotorCycle": 1,
        "ThreeWheeler": 1,
        "Other Petrol Vehicle": 1,
        "Small Diesel Vehicle": 1,
        "Large Diesel Vehicle": 1
    });
    const fuelAllocation = fuelAllocations[fuelAllocationCategory].toString(); // find the relevant fuel allocation

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

// assign vehicle to a suitable fuel queue of the chosen fuel stations
const assignFuelQueue = async (req, res) => {
    // start a seesion to enable transactions in the database
    const session = await startSession();
    // FIXME: sessions not working

    // if registration number of vehicle or user nic is not set send a error response
    if(!req.body.fuelRequestVehicle || !req.body.userNIC) return res.sendStatus(400);

    try {
        // start transction
        // because we need to ensure ACID properties when entering data to multiple models
        session.startTransaction();

        // get the logged in customer's fuel station list and remaining fuel using the customer's NIC number from the database
        const customer = await User.findOne({
            NIC: req.body.userNIC
        }).select({
            fuelStations: 1,
            remainingFuel: 1
        });

        // if such a customer details cannot be retirved, send failure flag as the response
        if (!customer)
            return res.json({
                success: false,
                message: "No such customer for the given NIC"
            });
        else {
            // get the vehicle's vid and fuel using the vehicle's registration number from the database
            const vehicle = await Vehicle.findOne({
                registrationNumber: req.body.fuelRequestVehicle
            }).select({
                _id: 1,
                fuelType: 1,
                isQueued: 1,
                notificationsSent: 1
            });
            // if such a vehicle details cannot be retirved, send failure flag as the response
            if (!vehicle)
                return res.json({
                    success: false,
                    message: "No such vehicle for the given registration number"
                });
            else {
                const fuelType = vehicle.fuelType; // get fuel type of the vehicle
                const fuelStationList = customer.fuelStations; // get fuel station list of the customer
                // check if the customer has selected fuel stations
                if (fuelStationList.length) {
                    if (customer.remainingFuel[fuelType] > 0) {
                        let fuelStationeDetails = {}
                        // get the fuel queues, number of fuel pumps of each fuel station
                        for (let index = 0; index < fuelStationList.length; index++) {
                            const id = fuelStationList[index].toString();
                            fuelStationeDetails[id] = await getFuelQueue(id, fuelType)
                        }

                        const selectedFuelStation = selectFuelStation(fuelStationeDetails).toString(); // find the best fuel station

                        // get the fuel station queue using the fuel station's id from the database
                        const fuelStation = await FuelStation.findOne({
                            _id: selectedFuelStation
                        }).select({
                            fuelQueue: 1
                        });

                        // add the vehicle to the relavent queue
                        fuelStation.fuelQueue[fuelType].push(Types.ObjectId(vehicle._id));
                        // update vehicle status
                        vehicle.isQueued = true;
                        vehicle.notificationsSent = 0;
                        
                        await fuelStation.save(); // save the updated fuel station in the database
                        await vehicle.save(); // save the updated vehicle in the database
                        await session.commitTransaction(); // database update successful, commit the transaction
                        session.endSession(); // end the session
                
                        // vehicle registration successful
                        res.status(201).json({success: true}); // send success message as the response                        
                    }
                    else {
                        // customer does not have enough fuel
                        return res.json({
                            success: false,
                            message: "Fuel quota exhausted stations added"
                        });
                    }
                }
                else {
                    // customer has not selected fuel stations send an error response
                    return res.json({
                        success: false,
                        message: "No fuel stations added"
                    });
                }

            }
        }
    } catch (error) {
        // error happens in the transaction
        await session.abortTransaction(); // abort the transaction and rollback changes
        session.endSession(); // end the session

        // fuel request unsuccessful
        res.status(400).json({success: false, message: "Fuel request failed" });// send failure message as the response
    }

}

// get the best fuel station that the vehicle should be queued to
const selectFuelStation = (fuelStations) => {
    const fuelStation_ratio = {}
    // iterate over the fuel stations and calculate the ratio between fuel queue length and number of fuel pumps
    for (fuelStation in fuelStations){
        let queueLength = fuelStations[fuelStation].fuelQueue.length; // get length of the fuel queue of the fuel station
        let fuelPumpNum = fuelStations[fuelStation].fuelPumps; // get the number of fuel pumps of the fuel station
        let queueToFuelPumpRatio = queueLength/fuelPumpNum; // calculate ratio between fuel queue length and number of fuel pumps
        fuelStation_ratio[fuelStation] = queueToFuelPumpRatio; // add the fuel station ratio pair to a object
    }

    // get the fuel station with the minimum ratio between fuel queue length and number of fuel pumps
    let selectedFuelStation = Object.keys(fuelStation_ratio).reduce((key, v) => 
        fuelStation_ratio[v] < fuelStation_ratio[key] ? v : key);

    return selectedFuelStation
}

module.exports = {
    checkVehicleRegistered,
    checkVehicleExistence,
    getVehicleDetailsDMT,
    getVehicle,
    registerVehicle,
    getVehicleDetails,
    assignFuelQueue,
    getFuelAllocationCategory,
    getFuelAllocation,
    DMTGetVehicleDetails,
    selectFuelStation
}