const { User } = require("../models/User");

const axios = require('axios');

const userID = 23918;
const API_KEY = "ML6z6ij20VmJzzpyygNA";

// send messages to the customers stating that their vehicle is removed form the fuel queue due to in activity
const sendQueueRemovalNotifications = async (customerList, fuel, fuelStation, fuelStationAddress) => {

    console.log("sendQueueRemovalNotifications");

    console.log("QueueRemovalcustomerList",customerList);

    const message = `${fuel} was exhausted in the fuel station, ${fuelStation} at ${fuelStationAddress.StreetName}, ${fuelStationAddress.Town}.
Your vehicle was removed from the ${fuel} queue in that fuel station due to inactivity.
Now you can request fuel from that vehicle again. Thank you.\n`;

    // send messages to all customers
    const result = await sendNotificationsToCustomers(customerList, message);
    console.log("result in sendQueueRemovalNotifications", result);

    return result;
}

// send messages to the customers stating that fuel was exhasuted in the fuel station where their vehicle was queued
const sendFuelExhaustedNotifications = async (customerList, fuel, fuelStation, fuelStationAddress) => {

    console.log("sendFuelExhaustedNotifications");

    console.log("FuelExhaustedNotificationscustomerList",customerList);

    const message = `${fuel} was exhausted in the fuel station, ${fuelStation} at ${fuelStationAddress.StreetName}, ${fuelStationAddress.Town}.
Please be patient until you receive a fuel available notification again. Thank you.\n`;

    // send messages to all customers
    const result = await sendNotificationsToCustomers(customerList, message);

    return result;
}

// send messages to the customers stating that fuel is avaiable in the fuel station where their vehicle is queued
const sendFuelAvaiableNotifications = async (customerList, fuel, fuelStation, fuelStationAddress) => {

    console.log("sendFuelAvaiableNotifications");

    console.log("sendFuelAvaiableNotificationscustomerList",customerList);

    const message = `${fuel} is available in the fuel station, ${fuelStation} at ${fuelStationAddress.StreetName}, ${fuelStationAddress.Town}.
Please attend and queue in that fuel station to receive fuel. Thank you.\n`;

    // send messages to all customers
    const result = await sendNotificationsToCustomers(customerList, message)

    return result;
}

// send messages to the customers stating that fuel is avaiable with a warning in the fuel station where their vehicle is queued
const sendFuelAvaiableNotifications_Warning = async (customerList, fuel, fuelStation, fuelStationAddress) => {

    console.log("sendFuelAvaiableNotifications_Warning");

    console.log("sendFuelAvaiableNotifications_WarningcustomerList",customerList);

    const message = `${fuel} is available in the fuel station, ${fuelStation} at ${fuelStationAddress.StreetName}, ${fuelStationAddress.Town}.
This is your last fuel availabilty notificaction.
If you do not get fuel, you will be removed from the ${fuel} queue of that fuel station on the basis of inactivity. Thank you.\n`;

    // send messages to all customers
    const result = await sendNotificationsToCustomers(customerList, message)

    return result;
}

// send messages to the customers stating that their vehicle is removed form the fuel queue due to in activity
const sendQueueRemovalNotifications_fuelAvailable = async (customerList, fuel, fuelStation, fuelStationAddress) => {

    console.log("sendQueueRemovalNotifications_fuelAvailable");

    console.log("QueueRemovalcustomerList",customerList);

    const message = `Your vehicle was removed from the ${fuel} queue in the fuel station, ${fuelStation} at ${fuelStationAddress.StreetName}, ${fuelStationAddress.Town} due to inactivity.
Now you can request fuel from that vehicle again. Thank you.\n`;

    // send messages to all customers
    const result = await sendNotificationsToCustomers(customerList, message);

    return result;
}

// send messages to the customers stating that fuel is avaiable with a warning in the fuel station where their vehicle is queued
const sendFuelSaleNotification = async (mobileNumber, fuel, fuelAmount, fuelStation, fuelStationAddress) => {

    console.log("sendFuelSaleNotification");

    const message = `Fuel sale successful.
A fuel sale of ${fuelAmount}L of ${fuel} was recorded in, ${fuelStation} at ${fuelStationAddress.StreetName}, ${fuelStationAddress.Town}.
Thank you.\n`;

    // send messages to all customers
    const result = await sendNotification(mobileNumber, message)

    return result;
}

// send messages to every customer in the customers list
const sendNotificationsToCustomers = async (customerList, message) => {
    // check if all messages were sent successfully
    let result = true;

    // iterate over the object of vehicle and customer ids and send messages ot each customer
    for (const [vid, uid] of Object.entries(customerList)) {
        // get the customer's mobile number using the customer's id number from the database
        const customer = await User.findOne({
            _id: uid
        }).select({
            mobile: 1
        });
        // send message
        result = result && await sendNotification(customer.mobile, message);
    }

    return result;
}

// send message to customer
const sendNotification = async (mobileNumber, message) => {
    if (!message || !mobileNumber)
        return false;

    const url = `https://app.notify.lk/api/v1/send?user_id=${userID}&api_key=${API_KEY}&sender_id=NotifyDEMO&to=${mobileNumber}&message=${message}`

    const res = await axios.get(url);
    
    const result = res.data.status === "success" ? true : false;

    return result;
}

module.exports = {
    sendQueueRemovalNotifications,
    sendFuelExhaustedNotifications,
    sendFuelAvaiableNotifications,
    sendFuelAvaiableNotifications_Warning,
    sendQueueRemovalNotifications_fuelAvailable,
    sendFuelSaleNotification,
    sendNotificationsToCustomers,
    sendNotification
}