require('express-async-errors');
const router = require('express').Router();
const customerController = require('../controllers/customerController');
const verifyJWT = require('../midleware/verifyJWT');

router.post("/getAllRegisteredVehicleDetails", customerController.getAllRegisteredVehicles);
router.post('/getFuelStatus', customerController.getRemainingFuel);
router.post("/getCustomerDetails",verifyJWT, customerController.getCustomerDetails)

module.exports = router;