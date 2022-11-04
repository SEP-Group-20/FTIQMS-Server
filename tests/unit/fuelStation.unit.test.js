const fuelStationController = require('../../controllers/fuelStationController');

describe("MFEGetFuelStationDetails Unit", () => {
    describe("When fuelStation registrationNumber is invalid", () => {
        it('Should return false', async () => {
            const result = await fuelStationController.MFEGetFuelStationDetails("QWE1267560");
            expect(result).toEqual(false);
        });
    });
    describe("When all properties are valid", () => {
        it('Should return a fuel order without any error', async () => {
            const fuelStation = {
                "registrationNumber": "QWE1267567",
                "name": "Amal Fuel Station",
                "ownerFName": "Amal",
                "ownerLName": "Peris",
                "mobileNumber": "0777735485",
                "address": {
                    "No": "23/4",
                    "StreetName": "Pepiliyana road",
                    "Town": "Kohuwala",
                    "City": "Nugegoda",
                    "District": "Colombo"
                },
                "fuelSold": ["Petrol", "Diesel"],
                "fuelPumps": {
                    "Petrol": 1,
                    "Diesel": 1
                }
            }
            const result = await fuelStationController.MFEGetFuelStationDetails("QWE1267567");
            expect(result).toEqual(fuelStation);
        });
    });
});
