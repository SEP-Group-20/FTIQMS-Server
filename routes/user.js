require('express-async-errors');
const router = require('express').Router();
const userController = require('../controllers/userController');

router.post("/getUserByNIC", userController.getUserByNIC);
router.post("/getUsername", userController.getUsername);

module.exports = router;