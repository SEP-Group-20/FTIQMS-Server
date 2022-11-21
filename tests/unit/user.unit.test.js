const userController = require('../../controllers/userController');
require('../../startup/db')();

describe("getUsernameByNIC Unit", () => {
    describe("When NIC is invalid", () => {
        it('Should return none', async () => {
            const result = await userController.getUsernameByNIC("200207802500");
            expect(result).toEqual(null);
        });
    });
    describe("When NIC is valid", () => {
        it('Should return the firstname and lastname of the user', async () => {
            const user = {
                "firstName": "Rakindu",
                "lastName": "Paranayapa"
            };
            const result = await userController.getUsernameByNIC("200207802507");
            expect(result.firstName).toEqual(user.firstName);
            expect(result.lastName).toEqual(user.lastName);
        });
    });
});

describe("getUsernameByEmail Unit", () => {
    describe("When email is invalid", () => {
        it('Should return none', async () => {
            const result = await userController.getUsernameByEmail("familysilva@gmail.com");
            expect(result).toEqual(null);
        });
    });
    describe("When email is valid", () => {
        it('Should return the firstname and lastname of the user', async () => {
            const user = {
                "firstName": "Kumara",
                "lastName": "Perera"
            };
            const result = await userController.getUsernameByEmail("familyparanayapa@gmail.com");
            expect(result.firstName).toEqual(user.firstName);
            expect(result.lastName).toEqual(user.lastName);
        });
    });
});

describe("getCustomerDetailsByNIC Unit", () => {
    describe("When NIC is invalid", () => {
        it('Should return none', async () => {
            const result = await userController.getCustomerDetailsByNIC("997970560v");
            expect(result).toEqual(null);
        });
    });
    describe("When NIC is valid", () => {
        it('Should return the relevant customers details', async () => {
            
            const result = await userController.getCustomerDetailsByNIC("997970560V");
            expect(result.success).toEqual(true);

        });
    });
});

