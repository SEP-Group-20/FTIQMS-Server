const supertest = require('supertest')
const app = require('../../index');

describe("Fuel Order", () => {
    describe("check if a fuel delivery is registered before", () => {
        describe("Request body without deliveryID", () => {
            it("Should return a 400", async () => {
                await supertest(app).post('/api/fuelOrder/checkFuelDeliveryRegistered')
                .send({orderID: "CSA9034567"})
                .expect(400);
            });
        });
        describe("Request body without orderID", () => {
            it("Should return a 400", async () => {
                await supertest(app).post('/api/fuelOrder/checkFuelDeliveryRegistered')
                .send({deliveryID: "ERD1543567"})
                .expect(400);
            });
        });
        describe("Request with details of a previously registered fuel delivery", () => {
            it("Should return a 400", async () => {
                const res = await supertest(app).post('/api/fuelOrder/checkFuelDeliveryRegistered')
                    .send({orderID: "CSA9034567", deliveryID: "ERD1543567"})
                expect(res.body).toHaveProperty("success", true);
            });
        });
        describe("Request with details of a unregistered fuel delivery", () => {
            it("Should return a 400", async () => {
                const res = await supertest(app).post('/api/fuelOrder/checkFuelDeliveryRegistered')
                    .send({orderID: "OGS1234567", deliveryID: "RBF7654321"})
                expect(res.body).toHaveProperty("success", false);
            });
        });
    });
    describe("check if a fuel delivery is registered in the MFE", () => {
        describe("Request body without deliveryID", () => {
            it("Should return a 400", async () => {
                await supertest(app).post('/api/fuelOrder/checkFuelOrderExistence')
                .send({orderID: "CSA9034567", registrationNumber: "ASD1234567"})
                .expect(400);
            });
        });
        describe("Request body without orderID", () => {
            it("Should return a 400", async () => {
                await supertest(app).post('/api/fuelOrder/checkFuelOrderExistence')
                .send({deliveryID: "ERD1543567", registrationNumber: "ASD1234567"})
                .expect(400);
            });
        });
        describe("Request body without fuel station registrationNumber", () => {
            it("Should return a 400", async () => {
                await supertest(app).post('/api/fuelOrder/checkFuelOrderExistence')
                .send({orderID: "CSA9034567", deliveryID: "ERD1543567"})
                .expect(400);
            });
        });
        describe("Request with details of a non existent fuel order", () => {
            it("Should return a 400", async () => {
                const res = await supertest(app).post('/api/fuelOrder/checkFuelOrderExistence')
                    .send({orderID: "CSA9035476", deliveryID: "ERD1543599", registrationNumber: "AAP1234567"})
                expect(res.body).toHaveProperty("success", false);
            });
        });
        describe("Request with details of a existing fuel order", () => {
            it("Should return a 400", async () => {
                const res = await supertest(app).post('/api/fuelOrder/checkFuelOrderExistence')
                    .send({orderID: "OGS1234567", deliveryID: "RBF7654321", registrationNumber: "HBD1291047"})
                expect(res.body).toHaveProperty("success", true);
            });
        });
    });
    describe("get the details of a fuel delivery from the MFE", () => {
        describe("Request body without deliveryID", () => {
            it("Should return a 400", async () => {
                await supertest(app).post('/api/fuelOrder/getFuelOrderDetailsMFE')
                .send({orderID: "CSA9034567", registrationNumber: "ASD1234567"})
                .expect(400);
            });
        });
        describe("Request body without orderID", () => {
            it("Should return a 400", async () => {
                await supertest(app).post('/api/fuelOrder/getFuelOrderDetailsMFE')
                .send({deliveryID: "ERD1543567", registrationNumber: "ASD1234567"})
                .expect(400);
            });
        });
        describe("Request body without fuel station registrationNumber", () => {
            it("Should return a 400", async () => {
                await supertest(app).post('/api/fuelOrder/getFuelOrderDetailsMFE')
                .send({orderID: "CSA9034567", deliveryID: "ERD1543567"})
                .expect(400);
            });
        });
        describe("Request with details of a non existent fuel order", () => {
            it("Should return a 400", async () => {
                const res = await supertest(app).post('/api/fuelOrder/getFuelOrderDetailsMFE')
                    .send({orderID: "CSA9035476", deliveryID: "ERD1543599", registrationNumber: "AAP1234567"})
                expect(res.body).toHaveProperty("success", false);
            });
        });
        describe("Request with details of a existing fuel order", () => {
            it("Should return a 400", async () => {
                const fuelOrder = {
                    orderID: 'OGS1234567',
                    deliveryID: 'RBF7654321',
                    fuelStationRegistrationNumber: 'HBD1291047',
                    fuel: 'Petrol',
                    fuelAmount: 3000,
                    value: 1500000,
                    orderDate: '18/09/2022',
                    deliveryDate: '23/09/2022'
                }
                const res = await supertest(app).post('/api/fuelOrder/getFuelOrderDetailsMFE')
                    .send({orderID: "OGS1234567", deliveryID: "RBF7654321", registrationNumber: "HBD1291047"})
                expect(res.body).toHaveProperty("success", true);
                expect(res.body).toHaveProperty("fuelOrder", fuelOrder);
            });
        });
    });
});
