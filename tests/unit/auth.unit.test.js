const authController = require('../../controllers/authController');
describe("validateCustomer Unit", () => {
    describe("When NIC is invalid", () => {
        it('Should return a object with an error', () => {
            const result = authController.validateCustomer({ NIC: "1232", firstName: "kasun", lastName: "pavithra", mobile: "0775831590", password: "ABC123$a" });
            expect(result).toHaveProperty("error");
        });
    });
    describe("When mobile number is missing", () => {
        it('Should return a object with an error', () => {
            const result = authController.validateCustomer({ NIC: "199930310820", firstName: "kasun", lastName: "pavithra", password: "ABC123$a" });
            expect(result).toHaveProperty("error");
        });
    });
    describe("When the password doesn't satisfy policies", () => {
        it('Should return a object with an error', () => {
            const result = authController.validateCustomer({ NIC: "199930310820", firstName: "kasun", lastName: "pavithra", mobile: "0775831590", password: "ABC1" });
            expect(result).toHaveProperty("error");
        });
    });
    describe("When all properties are valid", () => {
        it('Should return a object without any error', () => {
            const user = { NIC: "199930310820", firstName: "kasun", lastName: "pavithra", mobile: "0775831590", password: "ABC123$a" };
            const result = authController.validateCustomer(user);
            expect(result).toEqual({ value: user });
        });
    });
});


