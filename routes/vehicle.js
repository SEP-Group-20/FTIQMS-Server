require('express-async-errors');
const router = require('express').Router();
const vehicleController = require('../controllers/vehicleController');

router.post("/checkVehicleRegistered", vehicleController.checkVehicleRegistered);
router.post("/checkVehicleExistence", vehicleController.checkVehicleExistence);
router.post("/getVehicleDetails", vehicleController.getVehicleDetails);
router.post("/register", vehicleController.registerVehicle);

module.exports = router;