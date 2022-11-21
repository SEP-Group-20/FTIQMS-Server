const supertest = require('supertest')
const app = require('../../index');
const { User } = require('../../models/User');

describe("User", () => {
    describe("register admin", () => {
        describe("Request body is empty", () => {
            it("Should return a 400", async () => {
                await supertest(app).post('/api/user/registerAdmin')
                    .expect(400);
            });
        });
        describe("Request body with no email", () => {
            it("Should return a 400", async () => {
                await supertest(app).post('/api/user/registerAdmin')
                    .send({ NIC: "1828", firstName: "kasun", lastName: "pavithra"})
                    .expect(400);
            });
        });
    });
});
