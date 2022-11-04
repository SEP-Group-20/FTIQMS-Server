const supertest = require('supertest')
const app = require('../../index');

describe("Customer", () => {
    describe("get all registered vehicles of a customer", () => {
        describe("Request body is empty", () => {
            it("Should return a 400", async () => {
                await supertest(app).post('/api/customer/getAllRegisteredVehicleDetails')
                    .expect(400);
            });
        });
        describe("Request body with invalid NIC", () => {
            it("Should return a 400", async () => {
                await supertest(app).post('/api/customer/getAllRegisteredVehicleDetails')
                .send({userNIC: "1828"})
                .expect(400);
            });
        });
        describe("Request body with valid NIC", () => {
            it("Should return a success message and vehicle details", async () => {
                const res = await supertest(app).post('/api/customer/getAllRegisteredVehicleDetails')
                    .send({userNIC: "200207802507V"});
                expect(res.body).toHaveProperty("success", true);
            });
        });
    });
    describe("get remaining fuel of a customer", () => {
        describe("Request body is empty", () => {
            it("Should return a 400", async () => {
                await supertest(app).post('/api/customer/getFuelStatus')
                    .expect(400);
            });
        });
        describe("Request body with invalid NIC", () => {
            it("Should return a 400", async () => {
                await supertest(app).post('/api/customer/getFuelStatus')
                .send({userNIC: "1828"})
                .expect(400);
            });
        });
        describe("Request body with valid NIC", () => {
            it("Should return a success message and vehicle details", async () => {
                const res = await supertest(app).post('/api/customer/getFuelStatus')
                    .send({userNIC: "200207802507V"});
                expect(res.body).toHaveProperty("success", true);
            });
        });
    });
});
