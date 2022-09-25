const Joi = require('joi');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { EMAIL_REGEX, NAME_REGEX, MOBILE_REGEX, User } = require('../models/User');
const ROLES_LIST = require('../utils/rolesList');

const SALT_ROUNDS = 9;

const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;

const validateCustomer = (user) => {
    const schema = Joi.object({
        NIC: Joi.string().required(),
        password: Joi.string().pattern(PWD_REGEX).required(),
        firstName: Joi.string().min(1).max(50).pattern(NAME_REGEX).required(),
        lastName: Joi.string().min(1).max(50),
        mobile: Joi.string().pattern(MOBILE_REGEX).required()
    })
    return schema.validate(user)
}

const registerCustomer = async (req, res) => {

    const { error } = validateCustomer(req.body);
    if (error) {
        res.status(400).send(error);
        return
    }

    const alreadyRegistered = await User.findOne({
        NIC: req.body.NIC
    }).select({
        NIC: 1
    });

    if (!alreadyRegistered) {
        const hash = await bcrypt.hash(req.body.password, SALT_ROUNDS);

        let user = _.pick(req.body, ["NIC", "firstName", "lastName", "mobile"]);
        user.password = hash;
        user.role = ROLES_LIST.USER;

        user = new User(user);
        res.status(201).send(_.pick(await user.save(), ["NIC", "_id", "firstName"]));

    } else {
        res.status(400).json({ "message": "AlreadyRegisteredNIC" });
    }

}

const login = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    if (!email || !password) return res.sendStatus(400); //bad request

    const user = await User
        .findOne({ email: email })
        .select({ email: 1, password: 1, role: 1 });
    if (!user) return res.sendStatus(401);

    const result = await bcrypt.compare(password, user.password);

    if (!result) {
        return res.sendStatus(401);
    } else {
        const accessToken = jwt.sign({
            "userInfo": {
                "id": user._id,
                "role": user.role,   //5000 for users
                "email": user.email
            }
        }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '300s' });

        const refreshToken = jwt.sign({ "id": user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d' });

        user.refreshToken = refreshToken;
        user.save();
        res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        res.send({ accessToken: accessToken, user: _.pick(user, ['email', '_id', 'role']) });

    }
}

const customerLogin = async (req, res) => {
    const NIC = req.body.NIC;
    const password = req.body.password;
    if (!NIC || !password) return res.sendStatus(400); //bad request

    const user = await User
        .findOne({ NIC: NIC })
        .select({ NIC: 1, password: 1, role: 1 });
    if (!user) return res.sendStatus(401);

    const result = await bcrypt.compare(password, user.password);

    if (!result) {
        return res.sendStatus(401);
    } else {
        const accessToken = jwt.sign({
            "userInfo": {
                "id": user._id,
                "role": user.role,   //5000 for users
                "NIC": user.NIC
            }
        }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '300s' });

        const refreshToken = jwt.sign({ "id": user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d' });

        user.refreshToken = refreshToken;
        user.save();
        res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        res.send({ accessToken: accessToken, user: _.pick(user, ['NIC', '_id', 'role']) });

    }
}

const refresh = async (req, res) => {
    const cookies = req.cookies;
    // console.log(cookies)
    // console.log('came for token');
    if (!cookies?.jwt || !req.params.role) return res.sendStatus(401);
    // console.log(cookies.jwt);
    const refreshToken = cookies.jwt;

    const user = await User
        .findOne({ refreshToken: refreshToken, role: req.params.role })
        .select({ _id: 1, role: 1 });
    if (!user) return res.status(403).json({ "message": "Invalid token" });

    // here you need to check the wethear there is a refreshtoken in a database
    //if not return with statuscode 403
    //and also you need to get the role of the user


    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decode) => {
        if (err) return res.sendStatus(403);
        const accessToken = jwt.sign({
            "userInfo": {
                "id": user._id,
                "role": req.params.role       //for now it is  for registeredUsers
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

const checkNIC = async (req,res)=>{
    if(!req.body.NIC) return res.sendStatus(400);

    const result = await User.findOne({
        NIC: req.body.NIC
    });
    if(!result) return res.json({success:true});
    res.json({success:false});
}

module.exports = {registerCustomer,login,refresh,logout,checkNIC,customerLogin};