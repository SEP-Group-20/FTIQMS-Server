require('express-async-errors');
const errHandler = require("../midleware/async");
const router = require('express').Router();
const userController = require('../controllers/userController');

router.post("/getUserByNIC", userController.getUserByNIC);
router.post("/getUsername", userController.getUsername);
router.post("/registerAdmin", errHandler(userController.registerAdmin));
router.post('/isEmailRegistered', userController.getUserByEmail);


module.exports = router;