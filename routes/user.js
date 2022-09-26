require('express-async-errors');
const router = require('express').Router();
const userController = require('../controllers/userController');

router.post("/getUserByNIC",userController.getUserByNIC);

module.exports = router;