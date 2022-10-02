require('express-async-errors');
const router = require('express').Router();
const fuelStationController = require('../controllers/fuelStationController');

router.post("/checkFuelStationRegistered", fuelStationController.checkFuelStationRegistered);
router.post("/checkFuelStationExistence", fuelStationController.checkFuelStationExistence);
router.post("/getFuelStationDetailsMFE", fuelStationController.getFuelStationDetailsMFE);
router.post("/getFuelStationDetails/:fid", fuelStationController.getFuelStationDetails);
router.post("/register", fuelStationController.registerFuelStation);

module.exports = router;