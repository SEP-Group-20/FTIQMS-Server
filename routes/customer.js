require('express-async-errors');
const router = require('express').Router();
const customerController = require('../controllers/customerController');
const verifyJWT = require('../midleware/verifyJWT');

router.post("/getCustomerDetails", customerController.getCustomerDetails);
router.post("/getAllRegisteredVehicleDetails", customerController.getAllRegisteredVehicles);
router.post('/getFuelStatus', customerController.getRemainingFuel);
router.post('/resetPassword', customerController.resetPassword);
router.post('/getDashboardDetails', customerController.getDashboardDetails);

module.exports = router;