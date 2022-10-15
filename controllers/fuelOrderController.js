const _ = require('lodash');
const { FuelOrder } = require('../models/FuelOrder');
const { FuelStation } = require('../models/FuelStation');
const { User } = require('../models/User');
const { startSession } = require('mongoose');
const MFEFuelOrders = require('../models/MFEFuelOrders.json');

// check if a given fuel delivery is registered before in the system, send a true or false as a response
const checkFuelDeliveryRegistered = async (req,res)=>{
    // if orderID or deliveryID is not set send a error response
    if(!req.body.orderID || !req.body.deliveryID) return res.sendStatus(400);

    // find a fuel delivery with the given orderID and deliveryID from the database
    const result = await FuelOrder.findOne({ $or: [
        {orderID: req.body.orderID},
        {deliveryID: req.body.deliveryID}
    ]})
    
    // if such a fuel delivery can be found, the fuel delivery is registered in the system, send a success flag as the response
    if(result)
        return res.json({success:true});
    // if such a fuel delivery is not found, the fuel delivery is not registered previously in the system, send a failure flag as the response
    res.json({success:false});
}

// check if a given fuel order exists in the real world (is it in the MFE database)
// returns true if exists else returns false
const checkFuelOrderExistence = async (req,res) => {
    // if orderID or deliveryID is not set send a error response
    if(!req.body.orderID || !req.body.deliveryID || !req.body.registrationNumber)
        return res.sendStatus(400);

    // call the MFE fuel order API to find the existence of a fuel order, if exists returns the details of it
    const fuelorderDetails = await MFEGetFuelOrderDetails(req.body.orderID, req.body.deliveryID, req.body.registrationNumber);

    // if such a fuel order cannot be found, the fuel order is not registered in the MFE, send a failure flag as the response
    if(!fuelorderDetails)
        res.json({success:false});
    else 
        // fuel order is registered in the MFE, send a success flag as the response
        return res.json({success:true});    
}

// get the details of the fuel order from the MFE database given the registration number
// return the details of the fuel order or an error
const getFuelOrderDetailsMFE = async (req,res) => {
    // if orderID or deliveryID is not set send a error response
    if(!req.body.orderID || !req.body.deliveryID || !req.body.registrationNumber)
        return res.sendStatus(400);

    // call the MFE fuel order API to find the existence of a fuel order, if exists returns the details of it
    const fuelorderDetails = await MFEGetFuelOrderDetails(req.body.orderID, req.body.deliveryID, req.body.registrationNumber);

    // if such a fuel order cannot be found, the fuel order is not registered in the MFE, send a failure flag as the response
    if(!fuelorderDetails)
        return res.json({success: false});

    // send the details of the fuel order and a success flag as the reponse
    res.json({success: true, fuelOrder: fuelorderDetails});
}

// register a fuel delivery in the system
// if this is called it is made sure that the fuel delivery is valid and does not already exist in the system
const registerFuelDelivery= async (req, res) => {
    // start a seesion to enable transactions in the database
    const session = await startSession();
    // FIXME: sessions not working
    try {
        // start transction
        // because we need to ensure ACID properties when entering data to multiple models
        session.startTransaction();

        fuelDelivery = req.body.fuelOrderDetails

        // get orderDate details and deliveryDate details to convert them to a Date object
        const [orderDay, orderMonth, orderYear] = fuelDelivery.orderDate.split('/');
        const [deliveryDay, deliveryMonth, deliveryYear] = fuelDelivery.deliveryDate.split('/');

        // create orderDate and deliveryDate objects
        const orderDate = new Date(+orderYear, +orderMonth - 1, +orderDay+1);
        const deliveryDate = new Date(+deliveryYear, +deliveryMonth - 1, +deliveryDay+1);

        // extract the necessary details form the request and put them to the fuel order
        let fuelOrder = {};
        fuelOrder.fuelStation = req.body.fuelStationRegistrationNumber;
        fuelOrder.orderID = fuelDelivery.orderID;
        fuelOrder.deliveryID = fuelDelivery.deliveryID;
        fuelOrder.fuel = fuelDelivery.fuel;
        fuelOrder.fuelAmount = fuelDelivery.fuelAmount;
        fuelOrder.value = fuelDelivery.value;
        fuelOrder.orderDate = new Date(orderDate.toISOString());
        fuelOrder.deliveryDate = new Date(deliveryDate.toISOString());

        // create fuel order with the given details form the fuelOrder model
        fuelOrder = new FuelOrder(fuelOrder);

        // save the fuel order in the database and get the database _id of the newly added fuel order
        const fuelOrderID = _.pick(await fuelOrder.save(), ["_id"]);

        // get the name, address, remainingFuel, fuelAvailability, fuelQueue, fuelOrders of fuel station using the registration number 
        const fuelStation = await FuelStation.findOne({
            registrationNumber: req.body.fuelStationRegistrationNumber
        }).select({
            name: 1,
            address: 1,
            remainingFuel: 1,
            fuelAvailability: 1,
            fuelQueue: 1,
            fuelOrders: 1
        });

        // increase the remaining fuel amount by the delivered fuel amount of the delivered fuel
        fuelStation.remainingFuel[fuelDelivery.fuel] += fuelDelivery.fuelAmount;
        // set the fuel availability flag of the fuel delivered to true
        fuelStation.fuelAvailability[fuelDelivery.fuel] = true;
        // add the newly added fuel delivery _id to the fuel orders list of the fuel station
        fuelStation.fuelOrders.push(fuelOrderID._id);

        fuelQueue = fuelStation.fuelQueue[fuelDelivery.fuel]; // to find the vehicles and notify the customers fuel available
        fuel = fuelDelivery.fuel; // send the fuel type in the fuel available notifications to customers
        fuelStationAddress = fuelStation.address; // when sending fuel available notifications to customers send the address of the fuel station
        fuelStationName = fuelStation.name; // when sending fuel available notifications to customers send the name of the fuel station

        // console.log("fuel ", fuel)
        // console.log("address ", fuelStationAddress)
        // console.log("fuelQueue ", fuelQueue)
        // console.log("fuelStationName ", fuelStationName)

        await fuelStation.save(); // save the updated fuel station details in the database

        // TODO: send fuel available notifications to customers

        await session.commitTransaction(); // database update successful, commit the transaction
        session.endSession(); // end the session

        // fuel delivery recorded successfully
        res.status(201).json({ "message": "Fuel Delivery recorded successfully" }); // send success message as the response

    } catch (error) {
        // error happens in the transaction
        await session.abortTransaction(); // abort the transaction and rollback changes
        session.endSession(); // end the session

        // fuel delivery record unsuccessful
        res.status(400).json({ "message": "Fuel Station registraion failed" });// send failure message as the response
    }

}

// EDIT THE FUNCTION TO GET THE DETAILS OF THE FUEL ORDER

// get the details of the fuel station from the system database given the fuel station id.
// return the details of the fuel station or an error
const getFuelDeliveryDetails = async (req, res) => {

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

// Dummy MFE fuel order API connected to a MFEFuelOrders.json file to simulate the process
// returns fuel order details if fuel order registered in the MFE else sends false
const MFEGetFuelOrderDetails = async (orderID, deliveryID, registrationNumber) => {
    // find the fuel order form the MFE database (here a JSON file for simulation purposes)
    const fuelOrder = await MFEFuelOrders.find(fuelOrder => (
        fuelOrder.orderID === orderID && fuelOrder.deliveryID === deliveryID && fuelOrder.fuelStationRegistrationNumber == registrationNumber
    ));
    // if there is no such fuel order registered in the MFE send false
    if(!fuelOrder)
        return false;

    // fuel order is registered in the MFE, send the fuel order details
    return fuelOrder;
}

module.exports = {
    checkFuelDeliveryRegistered,
    checkFuelOrderExistence,
    getFuelOrderDetailsMFE,
    registerFuelDelivery,getFuelDeliveryDetails
}