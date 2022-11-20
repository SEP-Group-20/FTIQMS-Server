require("dotenv").config();
const vehicleController = require('../../controllers/vehicleController');
require('../../startup/db')();

describe("getVehicle Unit", () => {
    describe("When vehicle id is invalid", () => {
        it('Should return a false status', async () => {
            const result = await vehicleController.getVehicle("6363c6f15eb8514e1df8b3ef");
            expect(result.success).toEqual(false);
        });
    });
    describe("When vehicle id is valid", () => {
        it('Should return a vehicle without any error', async () => {
            const result = await vehicleController.getVehicle("6363c6f15eb8514e1df8b3ec");
            const vehicle = {
                registrationNumber: 'CBF 8937',
                chassisNumber: '12345678901234560'
            }
            expect(result.success).toEqual(true);
            expect(result.vehicle.registrationNumber).toEqual(vehicle.registrationNumber);
            expect(result.vehicle.chassisNumber).toEqual(vehicle.chassisNumber);
        });
    });
});

describe("getFuelAllocationCategory Unit", () => {
    describe("When fuel is petrol and vehicle type is ThreeWheeler", () => {
        it('Should return ThreeWheeler', async () => {
            const result = await vehicleController.getFuelAllocationCategory("ThreeWheeler", "Petrol");
            expect(result).toEqual("ThreeWheeler");
        });
    });
    describe("When fuel is petrol and vehicle type is MotorCycle", () => {
        it('Should return MotorCycle', async () => {
            const result = await vehicleController.getFuelAllocationCategory("MotorCycle", "Petrol");
            expect(result).toEqual("MotorCycle");
        });
    });
    describe("When fuel is petrol and vehicle type is Car", () => {
        it('Should return Other Petrol Vehicle', async () => {
            const result = await vehicleController.getFuelAllocationCategory("Car", "Petrol");
            expect(result).toEqual("Other Petrol Vehicle");
        });
    });
    describe("When fuel is petrol and vehicle type is Van", () => {
        it('Should return Other Petrol Vehicle', async () => {
            const result = await vehicleController.getFuelAllocationCategory("Van", "Petrol");
            expect(result).toEqual("Other Petrol Vehicle");
        });
    });
    describe("When fuel is diesel and vehicle type is SUV", () => {
        it('Should return Small Diesel Vehicle', async () => {
            const result = await vehicleController.getFuelAllocationCategory("SUV", "Diesel");
            expect(result).toEqual("Small Diesel Vehicle");
        });
    });
    describe("When fuel is diesel and vehicle type is Bus", () => {
        it('Should return Large Diesel Vehicle', async () => {
            const result = await vehicleController.getFuelAllocationCategory("Bus", "Diesel");
            expect(result).toEqual("Large Diesel Vehicle");
        });
    });
    describe("When fuel is diesel and vehicle type is Container Truck", () => {
        it('Should return Large Diesel Vehicle', async () => {
            const result = await vehicleController.getFuelAllocationCategory("Container Truck", "Diesel");
            expect(result).toEqual("Large Diesel Vehicle");
        });
    });
    describe("When fuel is kerosene and vehicle type is motorcycle", () => {
        it('Should return Other', async () => {
            const result = await vehicleController.getFuelAllocationCategory("MotorCycle", "Kerosene");
            expect(result).toEqual("Other");
        });
    });
});

describe("getFuelAllocation Unit", () => {
    describe("When fuel allocation category is MotorCycle", () => {
        it('Should return 5', async () => {
            const result = await vehicleController.getFuelAllocation("MotorCycle");
            expect(result).toEqual("5");
        });
    });
    describe("When fuel allocation category is ThreeWheeler", () => {
        it('Should return 10', async () => {
            const result = await vehicleController.getFuelAllocation("ThreeWheeler");
            expect(result).toEqual("10");
        });
    });
    describe("When fuel allocation category is Other Petrol Vehicle", () => {
        it('Should return 20', async () => {
            const result = await vehicleController.getFuelAllocation("Other Petrol Vehicle");
            expect(result).toEqual("20");
        });
    });
    describe("When fuel allocation category is Small Diesel Vehicle", () => {
        it('Should return 25', async () => {
            const result = await vehicleController.getFuelAllocation("Small Diesel Vehicle");
            expect(result).toEqual("25");
        });
    });
    describe("When fuel allocation category is Large Diesel Vehicle", () => {
        it('Should return 50', async () => {
            const result = await vehicleController.getFuelAllocation("Large Diesel Vehicle");
            expect(result).toEqual("50");
        });
    });
});

describe("DMTGetVehicleDetails Unit", () => {
    describe("When vehicle registrationNumber is invalid", () => {
        it('Should return false', async () => {
            const result = await vehicleController.DMTGetVehicleDetails("ASS-4565", "12345678901234562");
            expect(result).toEqual(false);
        });
    });
    describe("When vehicle chassisNumber is invalid", () => {
        it('Should return false', async () => {
            const result = await vehicleController.DMTGetVehicleDetails("KS-1932", "12345678901234562");
            expect(result).toEqual(false);
        });
    });
    describe("When both vehicle registrationNumber and chassisNumber is invalid", () => {
        it('Should return false', async () => {
            const result = await vehicleController.DMTGetVehicleDetails("KS-1934", "12345676601234562");
            expect(result).toEqual(false);
        });
    });
    describe("When all properties are valid", () => {
        it('Should return a vehicle without any error', async () => {
            const vehicle = {
                "registrationNumber": "KS-1932",
                "chassisNumber": "12345678901234561",
                "owner": "Tom Cat",
                "mobileNumber": "0777735485",
                "make": "Kia",
                "model": "Sorento",
                "vehicleType": "SUV",
                "fuelType": "Diesel"
            }
            const result = await vehicleController.DMTGetVehicleDetails("KS-1932", "12345678901234561");
            expect(result).toEqual(vehicle);
        });
    });
});