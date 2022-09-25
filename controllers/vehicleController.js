const _ = require('lodash');
const { Vehicle } = require('../models/Vehicle');
const { User } = require('../models/User');
const { startSession } = require('mongoose')
const DMTVehicles = require('../models/DMTVehicles.json');

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

const fuelAllocations = {
    "MotorCycle": "5",
    "ThreeWheeler": "10",
    "Other Petrol Vehicle": "20",
    "Small Diesel Vehicle": "20",
    "Large Diesel Vehicle": "50"
};

const checkVehicleRegistered = async (req,res)=>{
    if(!req.body.registrationNumber || !req.body.chassisNumber) return res.sendStatus(400);

    const result = await Vehicle.findOne({
        registrationNumber: req.body.registrationNumber,
        chassisNumber: req.body.chassisNumber
    });
    if(!result)
        return res.json({success:true});
    res.json({success:false});
}

const checkVehicleExistence = async (req,res) => {

    if(!req.body.registrationNumber || !req.body.chassisNumber) return res.sendStatus(400);

    // call the DMT vehicles API to find the existence of a vehicle
    const vehicleDetails = await DMTGetVehicleDetails(req.body.registrationNumber, req.body.chassisNumber);

    if(!vehicleDetails)
        return res.json({mobileNum: "0"});

    res.json({mobileNum: vehicleDetails.mobileNumber});
}

const getVehicleDetails = async (req,res) => {

    if(!req.body.registrationNumber || !req.body.chassisNumber) return res.sendStatus(400);

    // call the DMT vehicles API to find the existence of a vehicle
    const vehicleDetails = await DMTGetVehicleDetails(req.body.registrationNumber, req.body.chassisNumber);

    if(!vehicleDetails)
        return res.json({success: false});

    const fuelAllocationCategory = getFuelAllocationCategory(vehicleDetails.vehicleType, vehicleDetails.fuelType);
    const fuelAllocation = getFuelAllocation(fuelAllocationCategory);

    vehicleDetails["fuelAllocationCategory"] = fuelAllocationCategory;
    vehicleDetails["fuelAllocation"] = fuelAllocation;

    res.json({success: true, vehicle: vehicleDetails});
}

const registerVehicle = async (req, res) => {
    const session = await startSession();
    // sessions not working
    try {
        session.startTransaction();

        let vehicle = _.pick(req.body, ["registrationNumber", "chassisNumber", "owner", "make", "model", "fuelType", "vehicleType"]);

        vehicle = new Vehicle(vehicle);

        const vehicleID = _.pick(await vehicle.save(), ["_id"]);

        const customer = await User.findOne({
            NIC: req.body.userNIC
        }).select({
            vehicles: 1
        });

        customer.vehicles.push(vehicleID._id);

        await customer.save();
        await session.commitTransaction();
        session.endSession()

        res.status(201).json({ "message": "Vehicle registraion successful" });

    } catch (error) {
        await session.abortTransaction()
        session.endSession()

        res.status(400).json({ "message": "Vehicle registraion failed" });
    }

}

const getFuelAllocationCategory = (vehicleType, fuelType) => {
    if (fuelType === "Petrol") {
        fuelAllocationCategorization.Petrol.forEach(catergory => {
            if (catergory === vehicleType)
                return catergory;
        });
        return "Other Petrol Vehicle";
    } else if (fuelType === "Diesel") {
        if (fuelAllocationCategorization.Diesel[1]["Large Diesel Vehicle"].includes(vehicleType))
            return "Large Diesel Vehicle";
        else
            return "Small Diesel Vehicle";
    } else {
        return "Other";
    }
}

const getFuelAllocation = (fuelAllocationCategory) => {
    const fuelAllocation = fuelAllocations[fuelAllocationCategory];
    return fuelAllocation;
}

// Dummy DMT vehicles API connected to a DMTVechicles.json file to simulate the process
const DMTGetVehicleDetails = async (registrationNumber, chassisNumber) => {

    const vehicle = await DMTVehicles.find(vehicle => vehicle.registrationNumber === registrationNumber && vehicle.chassisNumber === chassisNumber);

    if(!vehicle)
        return false;

    return vehicle;
}

module.exports = {checkVehicleRegistered, checkVehicleExistence, getVehicleDetails, registerVehicle}