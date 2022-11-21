const supertest = require('supertest');
const bcrypt = require('bcrypt');
const { User } = require('../../models/User');
const app = require('../../index');
const SALT_ROUNDS = 9;
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
                    _id: res.body._id
                });
            });
        });
        describe("Request body with already registered NIC", () => {
            it("Should return a 401", async () => {

                const user = new User({ NIC: "199930310821", firstName: "kasun", lastName: "pavithra", mobile: "0775831590", password: "ABC123$a" })
                await user.save();
                const res = await supertest(app).post('/api/auth/register')
                    .send({ NIC: "199930310821", firstName: "kasun", lastName: "pavithra", mobile: "0775831590", password: "ABC123$a" });
                expect(res.status).toBe(401);
                expect(res.body).toHaveProperty("message", "AlreadyRegisteredNIC");
                await User.deleteOne({ _id: user._id })
            });
        });
    });

    describe("Auth user login", () => {
        describe("Request body is empty", () => {
            it("Should return a 400", async () => {
                await supertest(app).post('/api/auth/login')
                    .expect(400);
            });
        });
        describe("Request only with email", () => {
            it("Should return a 400", async () => {
                await supertest(app).post('/api/auth/login')
                    .send({ email: "kasun@gmail.com" })
                    .expect(400);
            });
        });
        describe("Request only with password", () => {
            it("Should return a 400", async () => {
                await supertest(app).post('/api/auth/login')
                    .send({ password: "ANSGD12#2a" })
                    .expect(400);
            });
        });
        describe("With an email not registered in the system", () => {
            it("Should return a 401", async () => {
                await supertest(app).post('/api/auth/login')
                    .send({ password: "ANSGD12#2a", email: "johndoily@gmail.com" })
                    .expect(401);
            });
        });
        describe("Login with legal email and password", () => {
            it("Should return a 200", async () => {
                const email = "saman@gmail.com";
                const pwd = "ABC123$a";
                await User.findOneAndDelete({ email: email });
                const hash = await bcrypt.hash(pwd, SALT_ROUNDS);
                const user = new User({ email: email, firstName: "kasun", lastName: "pavithra", mobile: "0775831590", password: hash });
                await user.save();
                await supertest(app).post('/api/auth/login')
                    .send({ password: pwd, email: email })
                    .expect(200);
                await User.deleteOne({
                    _id: user._id
                });
            });
            it("Should return accessToken", async () => {
                const email = "saman@gmail.com";
                const pwd = "ABC123$a";
                await User.findOneAndDelete({ email: email });
                const hash = await bcrypt.hash(pwd, SALT_ROUNDS);
                const user = new User({ email: email, firstName: "kasun", lastName: "pavithra", mobile: "0775831590", password: hash });
                await user.save();
                const res = await supertest(app).post('/api/auth/login')
                    .send({ password: pwd, email: email });
                expect(res.body).toHaveProperty("accessToken");
                await User.deleteOne({
                    _id: user._id
                });
            });

            it("Should return refresh token in the cookies", async () => {
                const email = "saman@gmail.com";
                const pwd = "ABC123$a";
                await User.findOneAndDelete({ email: email });
                const hash = await bcrypt.hash(pwd, SALT_ROUNDS);
                const user = new User({ email: email, firstName: "kasun", lastName: "pavithra", mobile: "0775831590", password: hash });
                await user.save();
                const res = await supertest(app).post('/api/auth/login')
                    .send({ password: pwd, email: email });
                expect(res.get("Set-Cookie")).toBeDefined();
                await User.deleteOne({
                    _id: user._id
                });
            });

        });

    });
    describe("Customer login", () => {
        describe("Login only with NIC", () => {
            it("Should return a 400", async () => {
                await supertest(app).post('/api/auth/customerLogin')
                    .send({ NIC: "199930310867" })
                    .expect(400);
            });
        });
        describe("Login only with password", () => {
            it("Should return a 400", async () => {
                await supertest(app).post('/api/auth/customerLogin')
                    .send({ password: "Kasun123$" })
                    .expect(400);
            });
        });
        describe("Invalid NIC and password pair", () => {
            it("Should return a 401", async () => {
                await supertest(app).post('/api/auth/customerLogin')
                    .send({ NIC: "199930310867", password: "Ajashd12$" })
                    .expect(401);
            });
        });

        describe("legal NIC password pair", () => {
            it("Should return a 401", async () => {
                const NIC = "199930310867";
                const pwd = "ABC123$a";
                await User.findOneAndDelete({ NIC: NIC });
                const hash = await bcrypt.hash(pwd, SALT_ROUNDS);
                const user = new User({ NIC: NIC, firstName: "kasun", lastName: "pavithra", mobile: "0775831590", password: hash, role: 5000 });
                await user.save();
                const res = await supertest(app).post('/api/auth/customerLogin')
                    .send({ password: pwd, NIC: NIC });
                expect(res.status).toBe(200);
                await User.deleteOne({
                    _id: user._id
                });
            });

            it("Should return a 401", async () => {
                const NIC = "199930310867";
                const pwd = "ABC123$a";
                await User.findOneAndDelete({ NIC: NIC });
                const hash = await bcrypt.hash(pwd, SALT_ROUNDS);
                const user = new User({ NIC: NIC, firstName: "kasun", lastName: "pavithra", mobile: "0775831590", password: hash, role: 5000 });
                await user.save();
                const res = await supertest(app).post('/api/auth/customerLogin')
                    .send({ password: pwd, NIC: NIC });
                expect(res.body).toHaveProperty("accessToken");
                await User.deleteOne({
                    _id: user._id
                });
            });

            it("Should return a 401", async () => {
                const NIC = "199930310867";
                const pwd = "ABC123$a";
                await User.findOneAndDelete({ NIC: NIC });
                const hash = await bcrypt.hash(pwd, SALT_ROUNDS);
                const user = new User({ NIC: NIC, firstName: "kasun", lastName: "pavithra", mobile: "0775831590", password: hash, role: 5000 });
                await user.save();
                const res = await supertest(app).post('/api/auth/customerLogin')
                    .send({ password: pwd, NIC: NIC });
                expect(res.get('Set-Cookie')).toBeDefined();
                await User.deleteOne({
                    _id: user._id
                });
            });
        });
    });
});

