const _ = require('lodash');
const generator = require('generate-password');
const bcrypt = require('bcrypt');
const { FuelStation } = require('../models/FuelStation');
const { User } = require('../models/User');
const { startSession } = require('mongoose');
const admin = require("../utils/firebaseAdminService");
const ROLES_LIST = require('../utils/rolesList');

const MFEFuelStations = require('../models/MFEFuelStations.json');

const SALT_ROUNDS = 9;

// check if a given fuel station is registered before in the system, send a true or false as a response
const checkFuelStationRegistered = async (req,res)=>{
    // if registration number is not set send a error response
    if(!req.body.registrationNumber) return res.sendStatus(400);

    // find a fuel station with the given registration number and email from the database
    const result = await FuelStation.findOne({
        registrationNumber: req.body.registrationNumber
    });
    
    // if such a fuel station cannot be found, the fuel station is not registered in the system, send a success flag as the response
    if(!result)
        return res.json({success:true});
    // if such a fuel station is found, the fuel station is registered previously in the system, send a failure flag as the response
    res.json({success:false});
}

// check if a given fuel station exists in the real world (is it in the MFE database)
// returns true if exists else returns false
const checkFuelStationExistence = async (req,res) => {
    // if registration number is not set send a error response
    if(!req.body.registrationNumber) return res.sendStatus(400);

    // call the MFE fuel stations API to find the existence of a fuel station, if exists returns the details of it
    const fuelStationDetails = await MFEGetFuelStationDetails(req.body.registrationNumber);

    // if such a fuel station cannot be found, the fuel station is not registered in the MFE, send a failure flag as the response
    if(!fuelStationDetails)
        res.json({success:false});

    // fuel station is registered in the MFE, send a success flag as the response
    return res.json({success:true});
}

// get the details of the fuel station from the MFE database given the registration number
// return the details of the fuel station or an error
const getFuelStationDetailsMFE = async (req,res) => {
    // if registration number or chassis number is not set send a error response
    if(!req.body.registrationNumber) return res.sendStatus(400);

    // call the MFE fuel stations API to find the existence of a fuel station, if exists returns the details of it
    const fuelStationDetails = await MFEGetFuelStationDetails(req.body.registrationNumber);

    // if such a fuel station cannot be found, the fuel station is not registered in the MFE, send a failure flag as the response
    if(!fuelStationDetails)
        return res.json({success: false});

    // send the details of the fuel station and a success flag as the reponse
    res.json({success: true, fuelStation: fuelStationDetails});
}

// register a fuel station in the system
// if this is called it is made sure that the fuel station is valid and does not already exist in the system
const registerFuelStation = async (req, res) => {
    // start a seesion to enable transactions in the database
    const session = await startSession();
    // sessions not working
    try {
        // start transction
        // because we need to ensure ACID properties when entering data to multiple models
        session.startTransaction();

        // generate fuel station manager password
        const managerPassword = generator.generate({
            length: 15,
            numbers: true,
            symbol: true,
            strict: true
        });

        // generate fuel station staff password
        const staffPassword = generator.generate({
            length: 15,
            numbers: true,
            symbol: true,
            strict: true
        });

        const managerPasswordHash = await bcrypt.hash(managerPassword, SALT_ROUNDS);
        const staffPasswordHash = await bcrypt.hash(staffPassword, SALT_ROUNDS);

        // extract the necessary details form the request and put them to the manager
        let manager = {};
        manager.email = req.body.email;
        manager.password = managerPasswordHash;
        manager.firstName = req.body.fuelStationDetails.ownerFName;
        manager.lastName = req.body.fuelStationDetails.ownerLName;
        manager.mobile = req.body.fuelStationDetails.mobileNumber;
        manager.role = ROLES_LIST.MANAGER;

        // create manager with the given details form the user model
        manager = new User(manager);

        // save the vehicle in the database and get the database _id of the newly added vehicle
        const ownerUID = _.pick(await manager.save(), ["_id"]);

        // extract the necessary details form the request and put them to the fuel station
        let fuelStation = {};
        fuelStation.registrationNumber = req.body.fuelStationDetails.registrationNumber;
        fuelStation.name = req.body.fuelStationDetails.name;
        fuelStation.ownerFirstName = req.body.fuelStationDetails.ownerFName;
        fuelStation.ownerLastName = req.body.fuelStationDetails.ownerLName;
        fuelStation.email = req.body.email;
        fuelStation.address = req.body.fuelStationDetails.address;
        fuelStation.mobile = req.body.fuelStationDetails.mobileNumber;
        fuelStation.fuelSold = req.body.fuelStationDetails.fuelSold;
        fuelStation.fuelPumps = req.body.fuelStationDetails.fuelPumps;
        fuelStation.ownerUID = ownerUID._id;
        fuelStation.staffPassword = staffPasswordHash;

        // create new fuel station with the given details form the fuel station model
        fuelStation = new FuelStation(fuelStation);

        // TODO : send the email to the fuel station manager with the email, registration number manager and staff passwords

        await session.commitTransaction(); // database update successful, commit the transaction
        session.endSession(); // end the session

        // fuel station registration successful
        res.status(201).json({ "message": "Fuel Station registraion successful" }); // send success message as the response

    } catch (error) {
        // error happens in the transaction
        await session.abortTransaction(); // abort the transaction and rollback changes
        session.endSession(); // end the session

        // fuel station registration unsuccessful
        res.status(400).json({ "message": "Fuel Station registraion failed" });// send failure message as the response
    }

}

// get the details of the fuel station from the system database given the fuel station id.
// return the details of the fuel station or an error
const getFuelStationDetails = async (req, res) => {

    // if fuel station id is not set send a error response
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

// Dummy MFE fuel stations API connected to a MFEFuelStations.json file to simulate the process
// returns fuel station details if fuel station registered in the MFE else sends false
const MFEGetFuelStationDetails = async (registrationNumber) => {

    // find the fuel station form the MFE database (here a JSON file for simulation purposes)
    const fuelStation = await MFEFuelStations.find(vehicle => vehicle.registrationNumber === registrationNumber);

    // if there is no such fuel station registered in the MFE send false
    if(!fuelStation)
        return false;

    // fuel station is registered in the MFE, send the fuel station details
    return fuelStation;
}

module.exports = {checkFuelStationRegistered, checkFuelStationExistence, getFuelStationDetailsMFE, registerFuelStation, getFuelStationDetails}