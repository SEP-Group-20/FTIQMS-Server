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

router.get("/getCustomerDetailsByNIC",verifyJWT, userController.getCustomerDetailsByNIC)
router.post("/getFSMDetails",userController.getFSMDetailsByID)
router.post("/getAdminDetails",userController.getAdminDetailsByID)
router.post("/getAllUserDetails",userController.getAllUsers)
router.post("/getFSMCount", userController.getFSMCount)
router.post("/getCustomerCount", userController.getCustomerCount)

router.post("/updatePwd", verifyJWT, userController.updatePWD);
router.post("/getUserDetails", verifyJWT, userController.getUserDetails);
router.get("/getSelectedFuelStations", verifyJWT, userController.getSelectedFuelStations);
router.post("/setSelectedFuelStations", verifyJWT, userController.setSelectedFuelStations);
router.post("/resetUserPwd", userController.resetPwd);
router.post('/resetFSMPassword', userController.resetFSMPassword);




module.exports = router;