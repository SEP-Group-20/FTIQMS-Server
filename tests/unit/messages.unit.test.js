const messageController = require('../../controllers/messageController');

describe("sendNotification Unit", () => {
    describe("When mobile number and message is empty", () => {
        it('Should return false', async () => {
            const result = await messageController.sendNotification();
            expect(result).toEqual(false);
        });
    });
    describe("When mobile number is invalid", () => {
        it('Should return false', async () => {
            const result = await messageController.sendNotification("", "When mobile number is invalid");
            expect(result).toEqual(false);
        });
    });
    describe("When message is empty", () => {
        it('Should return false', async () => {
            const result = await messageController.sendNotification("0777846523", "");
            expect(result).toEqual(false);
        });
    });
    // describe("When all parameters are valid", () => {
    //     it('Should return true', async () => {
    //         const result = await messageController.sendNotification("94777846523", "Get fuel thivindu");
    //         expect(result).toEqual(true);
    //     });
    // });
});

