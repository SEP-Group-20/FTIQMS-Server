require('express-async-errors');
const router = require('express').Router();
const fuelStationController = require('../controllers/fuelStationController');
const verifyJWT = require('../midleware/verifyJWT');

router.post("/checkFuelStationRegistered", fuelStationController.checkFuelStationRegistered);
router.post("/checkFuelStationExistence", fuelStationController.checkFuelStationExistence);
router.post("/getFuelStationDetailsMFE", fuelStationController.getFuelStationDetailsMFE);
router.post("/getFuelStationRegistrationNumber", fuelStationController.getFuelStationRegistrationNumber);
router.post("/getFuelStationDetails", fuelStationController.getFuelStationDetails);
router.post("/getFuelDetails", fuelStationController.getFuelDetails);
router.post("/setFuelStatus", fuelStationController.setFuelStatus);
router.post("/register", fuelStationController.registerFuelStation);
router.post("/getAllFuelDeliveryDetails", fuelStationController.getAllFuelDeliveries);
router.post("/getFuelStationCount",fuelStationController.getFuelStationCount);
router.get("/getFuelStationLocation/:managerId", fuelStationController.getFuelStationLocation);
router.post("/setFuelStationLocation", fuelStationController.setFuelStationLocation);
router.post("/setInitFuelStatus", verifyJWT, fuelStationController.setInitFuelStat);
router.post("/getCustomerDetails", fuelStationController.getCustomerDetails);
router.post("/recordFuelSale", fuelStationController.recordFuelSale);
router.post("/getDashboardDetails", fuelStationController.getDashboardDetails);
router.get("/getAllFuelStations", fuelStationController.getAllFuelStations);
router.get("/getFuelStationById/:fid", fuelStationController.getFuelStationById);
router.post("/resetFSSPassword", fuelStationController.resetFSSPassword);


module.exports = router;