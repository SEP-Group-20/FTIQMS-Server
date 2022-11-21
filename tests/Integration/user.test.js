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
        // describe("Request body with valid request body", () => {
        //     it("Should return a 201", async () => {
        //         const res = await supertest(app).post('/api/user/registerAdmin')
        //             .send({ email: "pavithramk.19@uom.lk", firstName: "kasun", lastName: "pavithra"});
        //         expect(res.status).toBe(201);
        //         expect(res.body).toHaveProperty("_id");
        //         await User.deleteOne({
        //             _id: res.body._id
        //         });
        //     });
        // });
        // describe("Request body with already registered NIC", () => {
        //     it("Should return a 401", async () => {

        //         const user = new User({ NIC: "199930310821", firstName: "kasun", lastName: "pavithra", mobile: "0775831590", password: "ABC123$a" })
        //         await user.save();
        //         const res = await supertest(app).post('/api/auth/register')
        //             .send({ NIC: "199930310821", firstName: "kasun", lastName: "pavithra", mobile: "0775831590", password: "ABC123$a" });
        //         expect(res.status).toBe(401);
        //         expect(res.body).toHaveProperty("message", "AlreadyRegisteredNIC");
        //         await User.deleteOne({ _id: user._id })
        //     });
        // });
    });
});
