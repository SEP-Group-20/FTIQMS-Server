require('express-async-errors');
const router = require('express').Router();
const customerController = require('../controllers/customerController');

router.post("/getAllRegisteredVehicleDetails", customerController.getAllRegisteredVehicles);
router.post('/getFuelStatus', customerController.getRemainingFuel);

module.exports = router;