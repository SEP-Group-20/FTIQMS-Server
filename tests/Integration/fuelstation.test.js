const supertest = require('supertest')
const app = require('../../index');

describe("Fuel station", () => {
    describe("get fuel station by fuel station id", () => {
        describe("with no fuel station ID", () => {
            it("Should return a 404", async () => {
                await supertest(app).get('/api/fuelStation/getFuelStationById')
                    .expect(404);
            });
        });
        describe("with invalid fuel station ID", () => {
            it("Should return a 500", async () => {
                await supertest(app).get('/api/fuelStation/getFuelStationById/12342')
                    .expect(500);
            });
        });
        describe("with valid fuel station ID", () => {
            it("Should return a 500", async () => {
                await supertest(app).get('/api/fuelStation/getFuelStationById/12342')
                    .expect(500);
            });
        });
    });
});
