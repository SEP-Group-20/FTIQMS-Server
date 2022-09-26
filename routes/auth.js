require('express-async-errors');
const router = require('express').Router();
const ROLES_LIST = require('../utils/rolesList');
const verifyJWT = require('../midleware/verifyJWT');
const verifyRoles = require('../midleware/verifyRoles');
const authController = require('../controllers/authController');

router.post("/register", authController.registerCustomer);
router.post('/login', authController.login);
router.post('/customerlogin', authController.customerLogin);
router.get('/refresh/:role', authController.refresh);
router.get('/logout', verifyJWT, authController.logout);
router.get('/check', verifyJWT, verifyRoles(ROLES_LIST.USER), (req, res) => {
    res.send({ userID: req.userID, role: req.role });
});
router.post("/checkNIC", authController.checkNIC);
router.post("/getMobileByNIC", authController.getMobileByNIC);
router.post("/validateFirebaseAndLogin", authController.validateFirebaseAndLogin);

module.exports = router;