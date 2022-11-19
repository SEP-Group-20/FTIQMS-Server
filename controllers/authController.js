const Joi = require('joi');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { EMAIL_REGEX, NAME_REGEX, MOBILE_REGEX, User } = require('../models/User');
const { FuelStation } = require('../models/FuelStation');
const ROLES_LIST = require('../utils/rolesList');
const admin = require('../utils/firebaseAdminService');

const SALT_ROUNDS = 9;

const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;
const NIC_REGEX = /^([0-9]{9}[x|X|v|V]|[0-9]{12})$/;

/* this function validates the object that is passed to the parameter. */
const validateCustomer = (user) => {
    const schema = Joi.object({
        NIC: Joi.string().pattern(NIC_REGEX).required().error(new Error("JoiValidationError")),
        password: Joi.string().pattern(PWD_REGEX).required().error(new Error("JoiValidationError")),
        firstName: Joi.string().min(1).max(50).pattern(NAME_REGEX).required().error(new Error("JoiValidationError")),
        lastName: Joi.string().min(1).max(50).error(new Error("JoiValidationError")),
        mobile: Joi.string().pattern(MOBILE_REGEX).required().error(new Error("JoiValidationError"))
    })
    return schema.validate(user)
}

/*This is controller for handling costomer registration */
const registerCustomer = async (req, res) => {

    //first validate request body and reject the request with status code 400 if vallidation fails
    const { error } = validateCustomer(req.body);
    if (error) {
        res.status(400).send(error);
        return
    }

    //check whether NIC is already registered in the system
    const alreadyRegistered = await User.findOne({
        NIC: req.body.NIC
    }).select({
        NIC: 1
    });

    if (!alreadyRegistered) {
        //here hash the password
        const hash = await bcrypt.hash(req.body.password, SALT_ROUNDS);

        let user = _.pick(req.body, ["NIC", "firstName", "lastName", "mobile"]);
        user.password = hash;
        user.role = ROLES_LIST.CUSTOMER;
        //specify initial fuel allocation
        user["fuelAllocation"] = { "Petrol": 0, "Diesel": 0 };
        user["remainingFuel"] = { "Petrol": 0, "Diesel": 0 };

        //create user object according to the details
        user = new User(user);
        res.status(201).send(_.pick(await user.save(), ["NIC", "_id", "firstName"]));

    } else {
        res.status(401).json({ "message": "AlreadyRegisteredNIC" });
    }

}

/*this is login funtionality for the users other than the customers */
const login = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    //if email or password is missing reject request with 400 status code
    if (!email || !password) return res.sendStatus(400); //bad request

    //find the user from email address
    const user = await User
        .findOne({ email: email })
        .select({ email: 1, password: 1, role: 1, status: 1 });
    // if user not found reject request with 401 status code
    if (!user) return res.sendStatus(401);

    //compare the stored password and password which is entered by the user
    const result = await bcrypt.compare(password, user.password);

    if (!result) {
        //if passwords don't match reject the request with 401 status code
        return res.sendStatus(401);
    } else {
        //if passwords match, then crete access token
        const accessToken = jwt.sign({
            "userInfo": {
                "id": user._id,
                "role": user.role,   //5000 for users
                "email": user.email,
                "status": user.status
            }
        }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '300s' });

        // create refresh token which is used to refresh access token
        const refreshToken = jwt.sign({ "id": user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d' });

        //save refresh token to database
        user.refreshToken = refreshToken;
        user.save();
        //send refresh token as http-only cokies
        res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        res.send({ accessToken: accessToken, user: _.pick(user, ['email', '_id', 'role']) });

    }
}

/*this is login funtionality for the fusel station staff users */
const FSSLogin = async (req, res) => {
    const registrationNumber = req.body.registrationNumber;
    const password = req.body.pwd;
    if (!registrationNumber || !password) return res.sendStatus(400); //bad request

    //find user by the registrationNumber
    const user = await FuelStation.findOne({ registrationNumber: registrationNumber })
        .select({ registrationNumber: 1, staffPassword: 1 });
    if (!user) return res.sendStatus(401);

    //compare two passwords
    const result = await bcrypt.compare(password, user.staffPassword);

    if (!result) {
        return res.sendStatus(401);
    } else {
        //send refresh token to user as a http-only cokie
        res.send({ user: _.pick(user, ['registrationNumber']) });

    }
}

const customerLogin = async (req, res) => {
    const NIC = req.body.NIC;
    const password = req.body.password;
    if (!NIC || !password) return res.sendStatus(400); //bad request

    //find user by the NIC
    const user = await User
        .findOne({ NIC: NIC })
        .select({ NIC: 1, password: 1, role: 1 });
    if (!user) return res.sendStatus(401);

    //compare two passwords
    const result = await bcrypt.compare(password, user.password);

    if (!result) {
        return res.sendStatus(401);
    } else {
        //create access token which is used to access the API
        const accessToken = jwt.sign({
            "userInfo": {
                "id": user._id,
                "role": user.role,   //5000 for users
                "NIC": user.NIC
            }
        }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '300s' });

        //create refresh token which is used to refresh the access token
        const refreshToken = jwt.sign({ "id": user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d' });

        //save refresh token in the datadase
        user.refreshToken = refreshToken;
        user.save();

        //send refresh token to user as a http-only cokie
        res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        res.send({ accessToken: accessToken, user: _.pick(user, ['NIC', '_id', 'role']) });

    }
}

/*this function is to get new access token when it is expired. TO obtain
new access token, validation of refresh token is needed */
const refresh = async (req, res) => {
    //access request cookies for the access token
    const cookies = req.cookies;
    console.log(cookies);
    //if jwt is not in the cookies, or role is not there, the request will be rejected
    if (!cookies?.jwt || !req.params.role) return res.sendStatus(401);
    // console.log(cookies.jwt);
    const refreshToken = cookies.jwt;

    //
    var user = (parseInt(req.params.role) === ROLES_LIST.CUSTOMER) ? await User
        .findOne({ refreshToken: refreshToken, role: req.params.role })
        .select({ _id: 1, role: 1, NIC: 1 })
        : await User
            .findOne({ refreshToken: refreshToken, role: req.params.role })
            .select({ _id: 1, role: 1, email: 1, status: 1 });
    if (!user) return res.status(403).json({ "message": "Invalid token" });

    // here you need to check the wethear there is a refreshtoken in a database
    //if not return with statuscode 403
    //and also you need to get the role of the user

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decode) => {
        if (err) return res.sendStatus(403);
        const accessToken = jwt.sign({
            "userInfo": {
                "id": user._id,
                "role": parseInt(req.params.role),       //for now it is  for registeredUsers
                "NIC": user.NIC,
                "email": user.email,
                "status": user.status
            }
        }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '300s'
        });
        return res.status(200).json({
            "message": "Refresh token successful",
            "access_token": accessToken,
        });
    });
}


const logout = async (req, res) => {
    //need to delete the application on client also
    const cookies = req.cookies
    // console.log(req.params)
    if (!cookies?.jwt) return res.sendStatus(204); //no content to send
    const refreshToken = cookies.jwt;

    if (refreshToken === "") return res.status(204);

    // chech whether refreshZToken in the database
    const user = await User
        .findOne({ refreshToken: refreshToken, role: req.role })
        .select({ _id: 1, refreshToken: 1 });

    if (!user) {
        return res.status(404).json({ "message": "UserDoesNotExists" });
    }
    //if there is a record then set refreshToken to '';
    user.refreshToken = '';
    await user.save();

    res.clearCookie('jwt', { httpOnly: true });  // for https we need to pass secure: true
    res.sendStatus(204);
}


/*This piece of funtion checks whether given NIC exists in the database */
const checkNIC = async (req, res) => {
    if (!req.body.NIC) return res.sendStatus(400);

    const result = await User.findOne({
        NIC: req.body.NIC
    });
    if (!result) return res.json({ success: true });
    res.json({ success: false });
}

/*This piece of function returns the mobile number for given NIC, if NIC exists.
Otherwise send the false success */
const getMobileByNIC = async (req, res) => {
    if (!req.body.NIC) return res.sendStatus(400);

    const user = await User.findOne({
        NIC: req.body.NIC
    });
    if (!user) return res.json({ success: false });
    else {
        return res.json({
            success: true,
            NIC: user.NIC,
            mobile: user.mobile
        });
    }
}

/*In the OTP login method, customer is authenticated based on mobile number in the front end. A firebase access token 
is given to the customer once he is authenticated using firebase. This function issues an access token and a refresh token to the 
customer after validating the firebase access token*/
const validateFirebaseAndLogin = async (req, res) => {
    const firebaseToken = req.body.firebaseToken;
    const NIC = req.body.NIC;
    const user_id = req.body.user_id;
    if (!firebaseToken || !NIC || !user_id) return res.sendStatus(400); //bad request
    // console.log(req.body);

    const user = await User
        .findOne({ NIC: NIC });
    if (!user) return res.sendStatus(401);

    //validate firebase token here
    try {
        const decodeValue = await admin.auth().verifyIdToken(firebaseToken);

        // this checks whether user id is matching
        if (decodeValue && decodeValue.user_id === user_id) {
            //create new access token
            const accessToken = jwt.sign({
                "userInfo": {
                    "id": user._id,
                    "role": user.role,   //5000 for users
                    "NIC": user.NIC
                }
            }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '300s' });

            //create new refresh token
            const refreshToken = jwt.sign({ "id": user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d' });

            //save refresh token in the database
            user.refreshToken = refreshToken;
            user.save();

            //send the refresh token to user as a http-only cookie
            res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
            res.send({ accessToken: accessToken, user: _.pick(user, ['NIC', '_id', 'role']) });
        } else {
            return res.sendStatus(401); //unauthorized
        }
    } catch (err) {
        res.status(500).json(err.message);
    }
}



module.exports = {
    registerCustomer,
    login,
    refresh,
    logout,
    checkNIC,
    customerLogin,
    FSSLogin,
    getMobileByNIC,
    validateFirebaseAndLogin,
    validateCustomer
};