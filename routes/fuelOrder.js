require('express-async-errors');
const router = require('express').Router();
const fuelOrderController = require('../controllers/fuelOrderController');

router.post("/checkFuelDeliveryRegistered", fuelOrderController.checkFuelDeliveryRegistered);
router.post("/checkFuelOrderExistence", fuelOrderController.checkFuelOrderExistence);
router.post("/getFuelOrderDetailsMFE", fuelOrderController.getFuelOrderDetailsMFE);
router.post("/register", fuelOrderController.registerFuelDelivery);
router.post("/getOrderCount", fuelOrderController.getOrderCount);
router.post("/getRecentFuelOrders",fuelOrderController.getAllFuelDeliveries);


module.exports = router;