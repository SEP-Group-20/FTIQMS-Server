const supertest = require('supertest')
const {  User } = require('../../models/User');
const app = require('../../index');
describe("Auth", () => {
    describe("register customer", () => {
        describe("Request body is empty", () => {
            it("Should return a 400", async () => {
                await supertest(app).post('/api/auth/register')
                    .expect(400);
            });
        });
        describe("Request body with invalid NIC", () => {
            it("Should return a 400", async () => {
                await supertest(app).post('/api/auth/register')
                    .send({ NIC: "1828", firstName: "kasun", lastName: "pavithra", mobile: "0775831590", password: "ABC123$a" })
                    .expect(400);
            });
        });
        describe("Request body with valid request body", () => {
            it("Should return a 201", async () => {
                const res = await supertest(app).post('/api/auth/register')
                    .send({ NIC: "199930310820", firstName: "kasun", lastName: "pavithra", mobile: "0775831590", password: "ABC123$a" });
                expect(res.status).toBe(201);
                expect(res.body).toHaveProperty("_id");
                await User.deleteOne({
                    _id:res.body._id
                });
            });
        });
        describe("Request body with already registered NIC", () => {
            it("Should return a 401", async () => {

                const user = new User({NIC: "199930310821", firstName: "kasun", lastName: "pavithra", mobile: "0775831590", password: "ABC123$a"})
                await user.save();
                const res = await supertest(app).post('/api/auth/register')
                    .send({ NIC: "199930310821", firstName: "kasun", lastName: "pavithra", mobile: "0775831590", password: "ABC123$a" });
                expect(res.status).toBe(401);
                expect(res.body).toHaveProperty("message","AlreadyRegisteredNIC");
                await User.deleteOne({_id:user._id})
            });
        });
    });
});
