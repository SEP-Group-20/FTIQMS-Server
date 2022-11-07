require('express-async-errors');
const router = require('express').Router();
const vehicleController = require('../controllers/vehicleController');

router.post("/checkVehicleRegistered", vehicleController.checkVehicleRegistered);
router.post("/checkVehicleExistence", vehicleController.checkVehicleExistence);
router.post("/getVehicleDetailsDMT", vehicleController.getVehicleDetailsDMT);
router.post("/getVehicleDetails/:vid", vehicleController.getVehicleDetails);
router.post("/register", vehicleController.registerVehicle);
router.post("/assignFuelQueue", vehicleController.assignFuelQueue);

module.exports = router;