require('express-async-errors');
const router = require('express').Router();
const fuelStationController = require('../controllers/fuelStationController');

router.post("/checkFuelStationRegistered", fuelStationController.checkFuelStationRegistered);
router.post("/checkFuelStationExistence", fuelStationController.checkFuelStationExistence);
router.post("/getFuelStationDetailsMFE", fuelStationController.getFuelStationDetailsMFE);
router.post("/getFuelStationRegistrationNumber", fuelStationController.getFuelStationRegistrationNumber);
router.post("/getFuelStationDetails/:fid", fuelStationController.getFuelStationDetails);
router.post("/getFuelDetails", fuelStationController.getFuelDetails);
router.post("/setFuelStatus", fuelStationController.setFuelStatus);
router.post("/register", fuelStationController.registerFuelStation);
router.post("/getAllFuelDeliveryDetails", fuelStationController.getAllFuelDeliveries);
router.get("/getFuelStationLocation/:managerId",fuelStationController.getFuelStationLocation);
router.post("/setFuelStationLocation",fuelStationController.setFuelStationLocation)

module.exports = router;