const { User } = require('../models/User');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const { ADMIN } = require("../utils/rolesList");
const pwdGenerator = require('generate-password');
const sendMail = require("../utils/emailService");
const SALT_ROUNDS = 9;

// get details of a user given the NIC
const getUserByNIC = async (req, res) => {
    // if NIC number is not send send a error response
    if (!req.body.NIC) return res.sendStatus(400);

    // get the logged in user's details using the customer's NIC number from the database
    const result = await User.findOne({
        NIC: req.body.NIC
    });

    // if user detail retrival is a failure send a error flag as the response
    if (!result) return res.json({ success: false });
    else {
        // get the NIC, firstname, lastname, mobile number from the user's details
        // and send only those in the response with a success flag
        return res.json({
            success: true,
            user: _.pick(result, ["NIC", "firstName", "lastName", "mobile"])
        });
    }
}

// get details of a user given the email
const getUserByEmail = async (req, res) => {
    // if email is not send send a error response
    if (!req.body.email) return res.sendStatus(400);

    // get the logged in user's details using the customer's email from the database
    const result = await User.findOne({
        email: req.body.email
    });

    // if user detail retrival is a failure send a error flag as the response
    if (!result) return res.json({ success: false });
    else {
        // get the email, firstname, lastname, mobile number from the user's details
        // and send only those in the response with a success flag
        return res.json({
            success: true,
            user: _.pick(result, ["email", "firstName", "lastName", "mobile"])
        });
    }
}

// get the full name of a user given the NIC
const getUsername = async (req, res) => {
    // if NIC number is not send send a error response
    if (!req.body.userNIC && !req.body.userEmail)
        return res.sendStatus(400);

    // get the logged in user's firstname and lastname using the customer's NIC number from the database
    const result = await User.findOne({ $or: [
        {NIC: req.body.userNIC},
        {email: req.body.userEmail}
    ]}).select({
        firstName: 1,
        lastName: 1
    });

    // if user's names retrival is a failure send a error flag as the response
    if (!result)
        return res.json({ success: false });
    else {
        // send the names along with a success flag as the response
        return res.json({
            success: true,
            user: result
        });
    }
}

/*This function is to generate a password accourdig to the password policies */
const generatePWD = () => {
    return pwdGenerator.generate({
        length: 10,
        numbers: true,
        symbols: true,
        lowercase: true,
        uppercase: true,
        strict: true
    });
}

/* this is the controller for adding new admin to the databse and 
sending their credentials to newly entered email address */
const registerAdmin = async (req, res) => {
    const email = req.body.email;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;

    // if one or more fields are missing in the body, the request will be rejected with the status code 400.
    if (!email || !firstName || !lastName) return res.sendStatus(400);

    //checking whether email is already there in the users collection
    const result = await User.findOne({
        email: email
    });
    if (result) return res.status(401).json({ message: "EmailAlreadyRegistered" });

    const user = new User({ email, firstName, lastName });
    user.role = ADMIN;

    //here generate a new password for new admin account
    const pwd = generatePWD();
    console.log(pwd);

    // here hash the password before store in the database
    const hash = await bcrypt.hash(pwd, SALT_ROUNDS);
    user.password = hash;

    //send credetoals contained email to the new email account 
    await sendMail(to = email, subject = "Credentials For New Admin Account", text = `New admin account username: ${email} and password: ${pwd}.`);

    //send the response to the user
    res.status(201).send(_.pick(await user.save(), ["_id"]));
}

module.exports = { getUserByNIC, getUsername, getUserByEmail, registerAdmin }

