const _ = require('lodash');
const Joi = require('../startup/validation')();
const generator = require('generate-password');
const bcrypt = require('bcrypt');
const { FuelStation } = require('../models/FuelStation');
const { User } = require('../models/User');
const { startSession } = require('mongoose');
const ROLES_LIST = require('../utils/rolesList');
const sendMail = require("../utils/emailService");
const MFEFuelStations = require('../models/MFEFuelStations.json');
const { getFuelDelivery } = require('./fuelOrderController');
const { SET_FUEL_STATUS, SET_LOCATION, PWD_UPDATED } = require('../utils/ManagerStatuses');
const { ACTIVE_FS } = require('../utils/fuelStationStatuses');
const { getCustomerDetailsByNIC } = require('./userController');
const { Vehicle } = require('../models/Vehicle');
const { sendQueueRemovalNotifications, sendFuelExhaustedNotifications, sendFuelSaleNotification } = require('./messageController');

const SALT_ROUNDS = 9;
const FUEL_THRESHOLDS = { "Petrol": 100, "Diesel": 100 };

// check if a given fuel station is registered before in the system, send a true or false as a response
const checkFuelStationRegistered = async (req, res) => {
    // if registration number is not set send a error response
    if (!req.body.registrationNumber) return res.sendStatus(400);

    // find a fuel station with the given registration number and email from the database
    const result = await FuelStation.findOne({
        registrationNumber: req.body.registrationNumber
    });

    // if such a fuel station cannot be found, the fuel station is not registered in the system, send a success flag as the response
    if (!result)
        return res.json({ success: true });
    // if such a fuel station is found, the fuel station is registered previously in the system, send a failure flag as the response
    res.json({ success: false });
}

// check if a given fuel station exists in the real world (is it in the MFE database)
// returns true if exists else returns false
const checkFuelStationExistence = async (req, res) => {
    // if registration number is not set send a error response
    if (!req.body.registrationNumber) return res.sendStatus(400);

    // call the MFE fuel stations API to find the existence of a fuel station, if exists returns the details of it
    const fuelStationDetails = await MFEGetFuelStationDetails(req.body.registrationNumber);

    // if such a fuel station cannot be found, the fuel station is not registered in the MFE, send a failure flag as the response
    if (!fuelStationDetails)
        res.json({ success: false });
    else
        // fuel station is registered in the MFE, send a success flag as the response
        return res.json({ success: true });

}

// get the details of the fuel station from the MFE database given the registration number
// return the details of the fuel station or an error
const getFuelStationDetailsMFE = async (req, res) => {
    // if registration number is not set send a error response
    if (!req.body.registrationNumber) return res.sendStatus(400);

    // call the MFE fuel stations API to find the existence of a fuel station, if exists returns the details of it
    const fuelStationDetails = await MFEGetFuelStationDetails(req.body.registrationNumber);

    // if such a fuel station cannot be found, the fuel station is not registered in the MFE, send a failure flag as the response
    if (!fuelStationDetails)
        return res.json({ success: false });

    // send the details of the fuel station and a success flag as the reponse
    res.json({ success: true, fuelStation: fuelStationDetails });
}

// register a fuel station in the system
// if this is called it is made sure that the fuel station is valid and does not already exist in the system
const registerFuelStation = async (req, res) => {
    // start a seesion to enable transactions in the database
    const session = await startSession();
    // FIXME: sessions not working
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

        // save the fuel station manager in the database and get the database _id of the newly added fuel station manager
        const ownerUID = _.pick(await manager.save(), ["_id"]);

        // extract the necessary details form the request and put them to the fuel station
        const registrationNumber = req.body.fuelStationDetails.registrationNumber;
        const email = req.body.email;

        let fuelStation = {};
        fuelStation.registrationNumber = registrationNumber;
        fuelStation.name = req.body.fuelStationDetails.name;
        fuelStation.ownerFirstName = req.body.fuelStationDetails.ownerFName;
        fuelStation.ownerLastName = req.body.fuelStationDetails.ownerLName;
        fuelStation.email = email;
        fuelStation.address = req.body.fuelStationDetails.address;
        fuelStation.mobile = req.body.fuelStationDetails.mobileNumber;
        fuelStation.fuelSold = req.body.fuelStationDetails.fuelSold;
        fuelStation.fuelPumps = req.body.fuelStationDetails.fuelPumps;
        fuelStation.ownerUID = ownerUID._id;
        fuelStation.staffPassword = staffPasswordHash;

        // create new fuel station with the given details form the fuel station model
        fuelStation = new FuelStation(fuelStation);

        // send the email to the fuel station manager with the email, registration number manager and staff passwords
        await sendMail(
            to = email,
            subject = "Credentials For New Fuel Station Manager and Fuel Station Staff Accounts",
            text = `New fuel station manager account credentials :-
        email: ${email}
        password: ${managerPassword}

New fuel station staff account credentials :-
        username: ${registrationNumber}
        password: ${staffPassword}

The fuel station manager must change the passwords on first login.`
        );

        await fuelStation.save(); // save the new fuel station in the database
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

// get the registration number of the fuel station from the system database given the fuel station owner email.
// return the details of the fuel station registration number or an error
const getFuelStationRegistrationNumber = async (req, res) => {
    // if email is not send send a error response
    if (!req.body.email)
        return res.sendStatus(400);

    // get the logged in fuel station registration number using email from the database
    const result = await FuelStation.findOne({
        email: req.body.email
    }).select({
        registrationNumber: 1,
    });

    // if fuel station registration number retrival is a failure send a error flag as the response
    if (!result)
        return res.json({ success: false });
    else {
        // send the fuel station registration number along with a success flag as the response
        return res.json({
            success: true,
            registrationNumber: result.registrationNumber
        });
    }
}

// TODO: EDIT THE FUNCTION TO GET THE FUEL STATION DETAILS

// get the details of the fuel station from the system database given the fuel station id.
// return the details of the fuel station or an error
const getFuelStationDetails = async (req, res) => {

    // if fuel station id is not set send a error response
    if (!req.params.vid)
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
        return res.json({ success: false });

    // if vehicle is valid get the details of it from the database using the vehicle id
    const result = await Vehicle.findOne({
        _id: req.params.vid
    });

    // if such a vehicle details cannot be retirved, send failure flag as the response
    if (!result)
        return res.json({ success: false });
    else {
        // if vehicle details are retirved, send the details of it and a success flag as the response
        return res.json({
            success: true,
            vehicle: result
        });
    }
}

// get the fuel details of the fuel station from the system database given the fuel station registration number.
// return the details of the fuel or an error
const getFuelDetails = async (req, res) => {

    // if fuel station registration number is not set send a error response
    if (!req.body.registrationNumber)
        return res.sendStatus(400);

    // get the fuel types sold, remaining fuel amounts and fuel availability status using the fuel station registration number from the database
    const fuelDetails = await FuelStation.findOne({
        registrationNumber: req.body.registrationNumber
    }).select({
        fuelSold: 1,
        remainingFuel: 1,
        fuelAvailability: 1
    });

    // if such a fuel details cannot be retirved, send failure flag as the response
    if (!fuelDetails)
        return res.json({ success: false });
    else {
        // if fuel details are retirved, organize the data and send the details and a success flag as the response
        let result = []
        fuelDetails.fuelSold.forEach(fuel => {
            fuelDetail = {}
            fuelDetail["fuelType"] = fuel;
            fuelDetail["remainingFuel"] = fuelDetails.remainingFuel[fuel];
            fuelDetail["isAvailable"] = fuelDetails.fuelAvailability[fuel];
            fuelDetail["isBelowThreshold"] = fuelDetails.remainingFuel[fuel] <= FUEL_THRESHOLDS[fuel] ? true : false;
            result.push(fuelDetail);
        });

        return res.json({
            success: true,
            fuelDetails: result
        });
    }
}

// set the fuel status of the fuel
const setFuelStatus = async (req, res) => {
    // start a seesion to enable transactions in the database
    const session = await startSession();
    // FIXME: sessions not working
    try {
        // start transction
        // because we need to ensure ACID properties when entering data to multiple models
        session.startTransaction();

        // if fuel station registration number or fuel or status is not set send a error response
        if (!req.body.registrationNumber || !req.body.fuel)
            return res.sendStatus(400);

        // get the fuel types sold, remaining fuel amounts and fuel availability status using the fuel station registration number from the database
        const fuelDetails = await FuelStation.findOne({
            registrationNumber: req.body.registrationNumber
        }).select({
            name: 1,
            address: 1,
            fuelSold: 1,
            remainingFuel: 1,
            fuelAvailability: 1,
            fuelQueue: 1
        });

        // if such a fuel details cannot be retirved, send failure flag as the response
        if (!fuelDetails)
            return res.json({ success: false });
        else {
            const fuel = req.body.fuel;

            // if fuel details are retirved, check if the request data are valid and set the status
            if (fuelDetails.remainingFuel[fuel] <= FUEL_THRESHOLDS[fuel]) {
                fuelDetails.fuelAvailability[fuel] = req.body.status;

                // get the relevant fuel queue
                const fuelQueueVehicles = JSON.parse(JSON.stringify(fuelDetails.fuelQueue[fuel]));

                let toBeRemovedVehicles = {};
                let toBeNotifiedVehicles = {};

                for (const vid of fuelQueueVehicles) {
                    // get the details of the vehicle from the database using the vehicle id
                    const vehicle = await Vehicle.findOne({
                        _id: vid
                    }).select({
                        isQueued: 1,
                        notificationsSent: 1,
                        registeredUnder: 1
                    });

                    if (vehicle.isQueued && vehicle.notificationsSent >= 2) {
                        // add the vehicle id and customer id to the removed list
                        toBeRemovedVehicles[vid] = vehicle.registeredUnder;

                        // get the index of the vehicle id
                        const index = fuelQueueVehicles.indexOf(vid);

                        if (index > -1) {
                            // remove the vehicle form the fuel queue
                            fuelDetails.fuelQueue[fuel].splice(index, 1);

                            // update the deatils of the vehicle
                            vehicle.isQueued = false;
                            vehicle.notificationsSent = 0;
                        }
                    }
                    else if (vehicle.isQueued && vehicle.notificationsSent > 0 && vehicle.notificationsSent < 2) {
                        toBeNotifiedVehicles[vid] = vehicle.registeredUnder;
                    }

                    await vehicle.save(); // save the updated vehicle details in the database
                }

                let sendQueueRemovalNotificationsResult = true;
                if (Object.keys(toBeRemovedVehicles).length > 0) {
                    // send queue removal and fuel exhausted notifications to customers whose vehicles should be removed from the queue
                    sendQueueRemovalNotificationsResult = await sendQueueRemovalNotifications(toBeRemovedVehicles, fuel, fuelDetails.name, fuelDetails.address);
                }

                let sendFuelExhaustedNotificationsResult = true;
                if (Object.keys(toBeNotifiedVehicles).length > 0) {
                    // send fuel exhausted notifications to queued cutomers who were sent a fuel avaiable notification
                    sendFuelExhaustedNotificationsResult = await sendFuelExhaustedNotifications(toBeNotifiedVehicles, fuel, fuelDetails.name, fuelDetails.address);
                }
                
                if (!(sendQueueRemovalNotificationsResult && sendFuelExhaustedNotificationsResult))
                    throw "Sending notifications failed";
            
                await fuelDetails.save(); // save the updated fuel station details in the database
                await session.commitTransaction(); // database update successful, commit the transaction
                session.endSession(); // end the session
        
                // setting fuel status successful
                res.status(201).json({"success": true, "message": "Setting fuel status successful" }); // send success message as the response

            }
            else
                return res.json({ "success": false, "message": "Setting fuel status failed. Try again" });
        }
    } catch (error) {
        // error happens in the transaction
        await session.abortTransaction(); // abort the transaction and rollback changes
        session.endSession(); // end the session

        // setting fuel status unsuccessful
        return res.json({"success": false, "message": "Setting fuel status failed. Try again" });// send failure message as the response
    }
    
}

// Dummy MFE fuel stations API connected to a MFEFuelStations.json file to simulate the process
// returns fuel station details if fuel station registered in the MFE else sends false
const MFEGetFuelStationDetails = async (registrationNumber) => {

    // find the fuel station form the MFE database (here a JSON file for simulation purposes)
    const fuelStation = await MFEFuelStations.find(fuelStation => fuelStation.registrationNumber === registrationNumber);

    // if there is no such fuel station registered in the MFE send false
    if (!fuelStation)
        return false;

    // fuel station is registered in the MFE, send the fuel station details
    return fuelStation;
}

// get details of all the fuel deliveries of a fuel station
const getAllFuelDeliveries = async (req, res) => {
    // get the logged in fuel station's  fuel delivery list using the fuel station email from the database
    const fuelStation = await FuelStation.findOne({
        email: req.body.userEmail
    }).select({
        fuelOrders: 1
    });

    const fuelDeliveryDetailsList = [];

    // for each fuel delivery get the details of it using the fuel delivery id
    for (const fdid of fuelStation.fuelOrders) {
        // get fuel delivery details by calling the function in the fuel order controller
        const fuelDelivery = await getFuelDelivery(fdid.toString());

        // check if fuel delivery details retrival is successful
        if (fuelDelivery.success)
            fuelDeliveryDetailsList.push(fuelDelivery.fuelDelivery); // if successful add the fuel delivery details to the list
        else
            return res.json({ success: false }); // if even one fuel delivery details retrival is a failure stop and send a error status
    }

    // if all fuel delivery detail retrival is successful send the details to the frontend as a response with a success flag
    return res.json({
        success: true,
        allFuelDeliveryDetails: fuelDeliveryDetailsList
    });
}

// get the fuel queue of a fuel station corresponding to the fuel
const getFuelQueue = async (fuelStationID, fuel) => {

    // get the fuel queue using the fuel station registration number from the database
    const fuelStation = await FuelStation.findOne({
        _id: fuelStationID
    }).select({
        fuelPumps: 1,
        fuelQueue: 1
    });

    // if there is no such fuel station registered in the system send false
    if (!fuelStation)
        return false;

    // fuel station is registered in the system, send the fuel queue, fuel, number of fuel pumps corresponding to the fuel
    const fuelStationDetails = {
        "fuel": fuel,
        "fuelPumps": fuelStation.fuelPumps[fuel],
        "fuelQueue": fuelStation.fuelQueue[fuel]
    }

    return fuelStationDetails;
}

const OIdValidationSchema = Joi.object({
    managerId: Joi.objectId().required()
});

/*this function responses with the location of the fuel station */
const getFuelStationLocation = async (req, res) => {

    OIdValidationSchema.validate({ managerId: req.params.managerId });

    //if no fuel station id send status code badRequest
    if (!req.params.managerId) return res.sendStatus(400);

    //query database for the location
    const station = await FuelStation.findOne({ ownerUID: req.params.managerId })
        .select({ location: 1 });

    //send query results
    return res.json({
        location: station?.location
    });
}

const locationVSchema = Joi.object({
    Latitude: Joi.number().min(-90).max(90).required(),
    Longitude: Joi.number().min(-180).max(180)
});

const setFuelStationLocation = async (req, res) => {
    if (!req.body.location || !req.body.managerId) return res.sendStatus(400);

    const managerId = req.body.managerId;
    const location = {
        Latitude: req.body.location.lat,
        Longitude: req.body.location.lng
    }

    OIdValidationSchema.validate(managerId);
    locationVSchema.validate(location);

    let session;
    let result;
    // FIXME - need to add transactions here
    // try {
    // session = await mongoose.startSession();

    // session.startTransaction();

    // result = await FuelStation.updateOne({ ownerUID: managerId }, { location: location }).session(session);
    // console.log("Started did 1!");
    // const user = await User.findOne({ _id: managerId }).select({ status: 1 }).session(session);
    // if (user.status === COMPLETELY_NEW) user.status = SET_LOCATION;
    // const res = await user.save().session(session);
    // await session.commitTransaction();
    // await session.endSession();
    // return res.json({ success: true });

    //implementation without transactions
    result = await FuelStation.updateOne({ ownerUID: managerId }, { location: location });
    const user = await User.findOne({ _id: managerId }).select({ status: 1 });
    if (user.status === SET_FUEL_STATUS) {
        user.status = SET_LOCATION;
        await user.save();
    };
    res.json({ success: true });

    // }
    // catch (err) {
    //     console.log(err)
    //     // session.abortTransaction();
    // }
    // res.json({ success: false });
};

const fuelObjectSchema = Joi.object({
    petrol: Joi.number().min(0).required(),
    diesel: Joi.number().min(0).required()
});

const setInitFuelStat = async (req, res) => {
    if (!req.body?.fuel) return res.sendStatus(400); //bad request if no data

    fuelObjectSchema.validate(req.body.fuel);

    //FIXME: - need a transaction here
    const station = await FuelStation.findOne({ ownerUID: req.userID }, { remainingFuel: 1, fuelAvailability: 1 })
    station.remainingFuel = req.body.fuel;
    let petrol_av = false;
    let diesel_av = false;
    if (req.body.fuel.Petrol > 0) petrol_av = true;
    if (req.body.fuel.Diesel > 0) diesel_av = true;
    station.fuelAvailability = { Petrol: petrol_av, Diesel: diesel_av };
    station.status = ACTIVE_FS;
    const result = await station.save();
    const user = await User.findById(req.userID, { status: 1 });
    if (user.status === PWD_UPDATED) {
        user.status = SET_FUEL_STATUS;
        await user.save();
    }
    if (result) res.json({ success: true });
}

const getCustomerDetails = async (req, res) => {
    if (!req.body.registrationNumber || !req.body.userNIC)
        return res.json({ success: false, message: "User NIC or Fuel station registration number not set" });
    
    const NIC = req.body.userNIC;
    const registrationNumber = req.body.registrationNumber;

    let customer = await getCustomerDetailsByNIC(NIC);
    let fuelStation = await getFuelStationDetailsByRegNumber(registrationNumber);

    if (!customer.success)
        return res.json({ success: false, message: "Customer not registered in system" });

    customer = customer.customer;
    fuelStation = fuelStation.fuelStation;
    
    if (!customer.fuelStations.includes(fuelStation._id))
        return res.json({ success: false, message: "Customer not registered in this fuel station" });

    const vehicles = await getQueuedVehicles(customer._id);

    if (!vehicles.success)
        return res.json({ success: false, message: "Vehicles not queued or not notified" });
    
    const vehicleList = vehicles.vehicleList;

    let fuelSaleEligibleVehicles = {}

    for (let index = 0; index < vehicleList.length; index++) {
        const vehicle = vehicleList[index];
        if (fuelStation.fuelQueue[vehicle.fuelType].includes(vehicle._id))
            fuelSaleEligibleVehicles[vehicle.fuelType] = vehicle._id;
    }
    if (Object.keys(fuelSaleEligibleVehicles).length === 0)
        return res.json({ success: false, message: "Vehicles not queued in this fuel station" });

    let customerDetails = {};
    customerDetails["customer"] = customer;
    customerDetails["fuelStation"] = fuelStation;
    customerDetails["fuelSaleEligibleVehicles"] = fuelSaleEligibleVehicles;

    return res.json({ success: true, customerDetails: customerDetails });
}

// get details of a fuel station given the registration number
const getFuelStationDetailsByRegNumber = async (registrationNumber) => {
    // get the logged in fuel station details using the fuel station registration number from the database
    const result = await FuelStation.findOne({
        registrationNumber: registrationNumber
    });

    // if fuel station detail retrival is a failure send a error flag as the response
    if (!result)
        return ({success: false});
    else {
        // get the _id, fuel queues and remaining fuel of the fuel station
        // and send only those in the response with a success flag
        return ({
            success: true,
            fuelStation: _.pick(result, ["_id", "fuelQueue", "remainingFuel"])
        });
    }
}

// get the queued vehicles of a customer given the id
const getQueuedVehicles = async (uid) => {
    // get the queued vehicles and notified vehicles of a customer
    const result = await Vehicle.find({
        registeredUnder: uid,
        isQueued: true,
        notificationsSent: { $gt: 0 }
    }).select({
        _id: 1,
        registrationNumber: 1,
        fuelType: 1,
        vehicleType: 1
    });

    // if vechicle retrival is a failure send a error flag as the response
    if (!result.length)
        return ({success: false});
    else {
        // get the _id, fuel queues and remaining fuel of the fuel station
        // and send only those in the response with a success flag
        return ({
            success: true,
            vehicleList: result
        });
    }
}

// record the fuel sale to a customer
const recordFuelSale = async (req, res) => {
    // start a seesion to enable transactions in the database
    const session = await startSession();
    // FIXME: sessions not working
    try {
        // start transction
        // because we need to ensure ACID properties when entering data to multiple models
        session.startTransaction();

        const resCustomer = req.body.customerDetails.customer;
        const resVehicleList = req.body.customerDetails.fuelSaleEligibleVehicles;
        const resFuelStation = req.body.customerDetails.fuelStation;
        let fuel = req.body.fuel.toLowerCase();
        fuel = fuel.charAt(0).toUpperCase() + fuel.slice(1)
        const fuelSale = parseFloat(req.body.fuelSale);
        const vid = resVehicleList[fuel];

        // get the details of the vehicle from the database using the vehicle id
        const vehicle = await Vehicle.findOne({
            _id: vid
        }).select({
            isQueued: 1,
            notificationsSent: 1
        });

        // get the details of the fuel station from the database using the vehicle id
        const fuelStation = await FuelStation.findOne({
            _id: resFuelStation._id
        }).select({
            name: 1,
            address: 1,
            remainingFuel: 1,
            fuelQueue: 1
        });

        // get the details of the customer from the database using the vehicle id
        const customer = await User.findOne({
            _id: resCustomer._id
        }).select({
            mobile: 1,
            remainingFuel: 1
        });

        const mobileNumber = customer.mobile;
        
        // decrease the remaining fuel amount of the fuel station by the sold fuel amount of the sold fuel
        fuelStation.remainingFuel[fuel] -= fuelSale;

        // remove the vehicle that was fueled from the relevant fuel queue of the fuel station
        const index = fuelStation.fuelQueue[fuel].indexOf(vehicle._id);

        if (index > -1)
            fuelStation.fuelQueue[fuel].splice(index, 1);

        // decrease the remaining fuel amount of the customer by the sold fuel amount of the sold fuel
        customer.remainingFuel[fuel] -= fuelSale;

        // set the vehicle as not queued and not notified
        vehicle.isQueued = false;
        vehicle.notificationsSent = 0;

        await fuelStation.save(); // save the updated fuel station details in the database
        await customer.save(); // save the updated customer details in the database
        await vehicle.save(); // save the updated vehicle details in the database

        // send success message to customer with the sold fuel, fuel amount, fuel station name, and location (town name)
        const result = await sendFuelSaleNotification(mobileNumber, fuel, fuelSale, fuelStation.name, fuelStation.address);

        if (!result)
            throw "Fuel sale notification sending failed. Try again.";

        await session.commitTransaction(); // database update successful, commit the transaction
        session.endSession(); // end the session

        return res.json({ success: true });

    } catch (error) {
        // error happens in the transaction
        await session.abortTransaction(); // abort the transaction and rollback changes
        session.endSession(); // end the session

        // fuel station registration unsuccessful
        res.status(400).json({ "message": "Fuel sale recording failed" });// send failure message as the response
    }
}

// get the details of the fuel station from the system database given the fuel station id.
// return the details of the fuel station or an error
// called by the customer controller so no request or response to or from the frontend
const getFuelStation = async (fsid) => {
    // get the details of the fuel station from the database using the fuel station id
    const result = await FuelStation.findOne({
        _id:fsid
    });

    // if such a fuel station details cannot be retirved, send failure flag as the response
    if (!result)
        return ({success: false});
    else{
        // if fuel station details are retirved, send the details of it and a success flag as the response
        return ({
            success: true,
            fuelStation: result
        });
    }
}

module.exports = {
    checkFuelStationRegistered,
    checkFuelStationExistence,
    getFuelStationDetailsMFE,
    registerFuelStation,
    getFuelStationRegistrationNumber,
    getFuelStationDetails,
    getFuelDetails,
    setFuelStatus,
    getAllFuelDeliveries,
    getFuelQueue,
    getFuelStationLocation,
    setFuelStationLocation,
    MFEGetFuelStationDetails,
    setInitFuelStat,
    getCustomerDetails,
    getFuelStationDetailsByRegNumber,
    getQueuedVehicles,
    recordFuelSale,
    getFuelStation
}