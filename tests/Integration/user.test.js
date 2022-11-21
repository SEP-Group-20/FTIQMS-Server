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

    describe("get Fuel Station Manager Count", () => {
        
        describe("Fuel station managers exist in the database", () => {
            it("Should return 2", async () => {
                const res = await supertest(app).post('/api/user/getFSMCount')
                    .expect(res.body[0]).toHaveProperty("fsm_count", 2);
            });
        });
    });

    describe("get Customer Count", () => {
        
        describe("Customers exist in the database", () => {
            it("Should return 3", async () => {
                const res = await supertest(app).post('/api/user/getCustomerCount')
                    .expect(res.body[0]).toHaveProperty("customer_count", 3);
            });
        });
    });

    describe("get Admin account details", () => {
        
        describe("Request body with invalid Email", () => {
            it("Should return a 400", async () => {
                await supertest(app).post('/api/user/getAdminAccountDetails')
                .send({ userEmail: "gdhsjsjs@gmail.com" })
                .expect(400);
                
            });
        });

        describe("Request body with valid Email", () => {
            it("Should display the admin details", async () => {
                const res = await supertest(app).post('/api/user/getAdminAccountDetails')
                    .send({ userEmail: "bhashi123@gmail.com" });
                expect(res.body).toHaveProperty("success", true);
            });
        });
    });
    
});

