const { User } = require('../models/User');
const _ = require('lodash');
const { ADMIN } = require("../utils/rolesList")

const getUserByNIC = async (req, res) => {
    if (!req.body.NIC) return res.sendStatus(400);

    const result = await User.findOne({
        NIC: req.body.NIC
    });
    if (!result) return res.json({ success: false });
    else {
        return res.json({
            success: true,
            user: _.pick(result, ["NIC", "firstName", "lastName", "mobile"])
        });
    }
}

const getUsername = async (req, res) => {
    if (!req.body.userNIC)
        return res.sendStatus(400);

    const result = await User.findOne({
        NIC: req.body.userNIC
    }).select({
        firstName: 1,
        lastName: 1
    });

    if (!result)
        return res.json({ success: false });
    else {
        return res.json({
            success: true,
            user: result
        });
    }
}

const registerAdmin = async (req, res) => {
    const email = req.body.email;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;

    if (!email || !firstName || !lastName) return res.sendStatus(400);

    const result = await User.findOne({
        email: email
    });
    if (result) return res.status(401).json({ message: "EmailAlreadyRegistered" });

    const user = new User({ email, firstName, lastName });
    user.role = ADMIN;
    user.password = "DefaultPWD1";
    res.status(201).send(_.pick(await user.save(), ["_id"]));
}


module.exports = { getUserByNIC, getUsername, registerAdmin }