require('express-async-errors');
const errHandler = require("../midleware/async");
const router = require('express').Router();
const userController = require('../controllers/userController');
const verifyJWT = require('../midleware/verifyJWT');

router.post("/getUserByNIC", userController.getUserByNIC);
router.post("/getUsername", userController.getUsername);
router.post("/registerAdmin", errHandler(userController.registerAdmin));
router.post('/isEmailRegistered', userController.getUserByEmail);
router.post("/getAllAdminDetails", userController.getAllAdmins);
router.post("/getAllFSMDetails", userController.getAllFSMs);
router.post("/updatePwd",verifyJWT, userController.updatePWD);

module.exports = router;