require('express-async-errors');
const router = require('express').Router();
const fuelOrderController = require('../controllers/fuelOrderController');

router.post("/checkFuelDeliveryRegistered", fuelOrderController.checkFuelDeliveryRegistered);
router.post("/checkFuelOrderExistence", fuelOrderController.checkFuelOrderExistence);
router.post("/getFuelOrderDetailsMFE", fuelOrderController.getFuelOrderDetailsMFE);
router.post("/getFuelOrderDetails/:oid", fuelOrderController.getFuelDeliveryDetails);
router.post("/register", fuelOrderController.registerFuelDelivery);

module.exports = router;