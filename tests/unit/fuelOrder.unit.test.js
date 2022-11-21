require("dotenv").config();
const fuelOrderController = require('../../controllers/fuelOrderController');
require('../../startup/db')();

describe("MFEGetFuelOrderDetails Unit", () => {
    describe("When orderID is invalid", () => {
        it('Should return false', async () => {
            const result = await fuelOrderController.MFEGetFuelOrderDetails("TJV832902W", "HRY6732125", "SDF0914562");
            expect(result).toEqual(false);
        });
    });
    describe("When deliveryID is invalid", () => {
        it('Should return false', async () => {
            const result = await fuelOrderController.MFEGetFuelOrderDetails("TJV8329021", "HRY6732425", "SDF0914562");
            expect(result).toEqual(false);
        });
    });
    describe("When registrationNumber is invalid", () => {
        it('Should return false', async () => {
            const result = await fuelOrderController.MFEGetFuelOrderDetails("TJV8329021", "HRY6732125", "SPD0914562");
            expect(result).toEqual(false);
        });
    });
    describe("When all properties are valid", () => {
        it('Should return a fuel order without any error', async () => {
            const fuelOrder = {
                "orderID": "TJV8329021",
                "deliveryID": "HRY6732125",
                "fuelStationRegistrationNumber": "SDF0914562",
                "fuel": "Petrol",
                "fuelAmount": 3000,
                "value": 1500000,
                "orderDate": "18/09/2022",
                "deliveryDate": "23/09/2022"
            };
            const result = await fuelOrderController.MFEGetFuelOrderDetails("TJV8329021", "HRY6732125", "SDF0914562");
            expect(result).toEqual(fuelOrder);
        });
    });
});

describe("getFuelDelivery Unit", () => {
    describe("When fuel delivery id is invalid", () => {
        it('Should return a false status', async () => {
            const result = await fuelOrderController.getFuelDelivery("6363c6f15eb8514e1df8b3ec");
            expect(result.success).toEqual(false);
        });
    });
    describe("When fuel delivery id is valid", () => {
        it('Should return a fuel order without any error', async () => {
            const result = await fuelOrderController.getFuelDelivery("634a5828a907b1129224718c");
            const fuelDelivery = {
                fuelStation: 'ASD1234567',
                orderID: 'CSA9034567',
                deliveryID: 'ERD1543567',
                fuel: 'Petrol',
                fuelAmount: 3000,
                value: 1500000,
            }
            expect(result.success).toEqual(true);
            expect(result.fuelDelivery.fuelStation).toEqual(fuelDelivery.fuelStation);
            expect(result.fuelDelivery.orderID).toEqual(fuelDelivery.orderID);
            expect(result.fuelDelivery.deliveryID).toEqual(fuelDelivery.deliveryID);
            expect(result.fuelDelivery.fuel).toEqual(fuelDelivery.fuel);
            expect(result.fuelDelivery.fuelAmount).toEqual(fuelDelivery.fuelAmount);
            expect(result.fuelDelivery.value).toEqual(fuelDelivery.value);
        });
    });
});


