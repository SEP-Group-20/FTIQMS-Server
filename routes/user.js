require('express-async-errors');
const router = require('express').Router();
const userController = require('../controllers/userController');

router.post("/checkNIC",userController.checkNIC)

module.exports = router;