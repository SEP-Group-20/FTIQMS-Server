const { User } = require('../models/User');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const { ADMIN, MANAGER } = require("../utils/rolesList");
const pwdGenerator = require('generate-password');
const sendMail = require("../utils/emailService");
const { COMPLETELY_NEW, PWD_UPDATED } = require('../utils/ManagerStatuses');
const { result } = require('lodash');
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
            user: _.pick(result, ["_id", "NIC", "firstName", "lastName", "mobile"])
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
const getUsernameByNIC = async (NIC) => {
    // get the logged in user's firstname and lastname using the customer's NIC number from the database
    const result = await User.findOne({
        NIC: NIC
    }).select({
        firstName: 1,
        lastName: 1
    });
    return result;
}

// get the full name of a user given the eamil
const getUsernameByEmail = async (email) => {
    // get the logged in user's firstname and lastname using the user's email from the database
    const result = await User.findOne({
        email: email
    }).select({
        firstName: 1,
        lastName: 1
    });
    return result;
}

// get the full name of a user given the NIC or eamil
const getUsername = async (req, res) => {
    // if NIC number is not send send a error response
    if (!req.body.userNIC && !req.body.userEmail)
        return res.sendStatus(400);

    let username = {}

    if (req.body.userNIC)
        username = await getUsernameByNIC(req.body.userNIC);

    // get the logged in user's firstname and lastname using the users's email from the database
    if (req.body.userEmail)
        username = await getUsernameByEmail(req.body.userEmail);

    // if user's names retrival is a failure send a error flag as the response
    if (!username)
        return res.json({ success: false });
    else {
        // send the names along with a success flag as the response
        return res.json({
            success: true,
            user: username
        });
    }
}

/*This function is to generate a password according to the password policies */
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

// get details of all the admins in the system
const getAllAdmins = async (req, res) => {
    currentUserEmail = req.body.userEmail

    // get all admin users of the system from the database
    const result = await User.find({
        role: ADMIN
    })

    // if all admin detail retrival is successful send the details to the frontend as a response with a success flag

    if (!result)
        return res.json({ success: false });
    else{
    return res.json({
        success: true,
        allAdminDetails: result
    });
    }
}

// get details of all the fuel station managers in the system
const getAllFSMs = async (req, res) => {
    currentUserEmail = req.body.userEmail

    // get all fuel station manager users of the system from the database
    const result = await User.aggregate([
        {$match:{role:5002} 
    },
    {$lookup:{
        from:'fuelstations',
        localField:'email',
        foreignField:'email',
        as: 'fuelStation',
    }}]
    )

    // if all fuel station manager detail retrival is successful send the details to the frontend as a response with a success flag
    if (!result)
        return res.json({ success: false });
    else{
    return res.json({
        success: true,
        allFSMDetails: result
    });
    }
}

const getAllUsers = async (req, res) => {
    currentUserEmail = req.body.userEmail

    // get all admin and Fuel Station managers of the system from the database
    const result = await User.find({
        "$or": [{
            role: ADMIN
        }, {
            role: MANAGER
        }]
    })

    // if all admin detail retrival is successful send the details to the frontend as a response with a success flag
    if (!result)
        return res.json({ success: false });
    else{
    return res.json({
        success: true,
        allUserDetails: result
    });
    }
}

const updatePWD = async (req, res) => {
    const user = await User.findById(req.userID, { password: 1, status: 1 });

    if (!req.body.newPwd || !user) return res.sendStatus(400); //bad request if no pwd

    // here hash the password before store in the database
    const hash = await bcrypt.hash(req.body.newPwd, SALT_ROUNDS);

    user.password = hash;
    if (user.status === COMPLETELY_NEW) user.status = PWD_UPDATED;
    const result = await user.save();
    if (result) res.json({ success: true });
}

const getUserDetails = async (req, res) => { //get user details
    
    const details = await User.findById(req.userID,{firstName:1, lastName:1, NIC:1, mobile:1, vehicles:1});
    return res.send(details);
    
}

// get details of a customer given the NIC
const getCustomerDetailsByNIC = async (NIC) => {
    // get the logged in user's details using the customer's NIC number from the database
    const result = await User.findOne({
        NIC: NIC,
        role: 5000
    });

    // if user detail retrival is a failure send a error flag as the response
    if (!result)
        return ({ success: false });
    else {
        // get the _id, NIC, firstname, lastname, mobile number, fuelAllocation, fuelRemaining from the user's details
        // and send only those in the response with a success flag
        return ({
            success: true,
            customer: _.pick(result, ["_id", "NIC", "firstName", "lastName", "mobile", "fuelStations", "fuelAllocation", "remainingFuel"])
        });
    }
}


const getFSMDetailsByID = async (req, res) => {
     
    //fuel station manager is also a user
    const details = await User.findById(req.body.userID,{firstName:1, lastName:1, mobile:1, email:1});
    return res.send(details);
}

const getAdminDetailsByID = async (req, res) => {
     
    //admin is also a user
    const details = await User.findById(req.body.userID,{firstName:1, lastName:1, mobile:1, email:1});
    return res.send(details);
}

const getFSMCount = async (req, res) => {
    currentUserID = req.body.userID
    
     var fsmCount = await User.aggregate([
      {
       $match: {role: MANAGER }
      },
      {
        $count: "fsm_count"
      }

    ]
    )

    if (!fsmCount)
        return ({success: false});
    else{
        return res.send(fsmCount);
    }
}

const getCustomerCount = async (req, res) => {
    currentUserID = req.body.userID
    
     var customerCount = await User.aggregate([
      {
       $match: {role: 5000}
      },
      {
        $count: "customer_count"
      }

    ]
    )

    if (!customerCount)
        return ({success: false});
    else{
        return res.send(customerCount);
    }
}


/*this function returns fuel station id's that are selected by the customer */
const getSelectedFuelStations = async (req, res) => {

    //find the users selected fuel stations from the database
    const result = await User.findById(req.userID, { fuelStations: 1 });

    // console.log(result);
    res.json(result);
}

/*this piece of function find the user for given user id and update the fuelstations array */
const setSelectedFuelStations = async (req, res) => {

    if (!req.body.fuelStations) return res.sendStatus(400); // return bad request status code if no fuel stations given

    //first find the user from the database
    const station = await User.findById(req.userID, { fuelStations: 1 });
    station.fuelStations = req.body.fuelStations;
    await station.save();

    res.sendStatus(200);
}
/*this controler reset the password of a user given by email */
const resetPwd = async (req, res) => {
    const email = req.body.email;
    const pwd = req.body.password;
    if (!email || !pwd) return res.sendStatus(400); // bad request if incomplete input fields

    //find the user from the databse
    const user = await User.findOne({ email: email }, { password: 1 });
    const hash = await bcrypt.hash(pwd, SALT_ROUNDS);

    //hash the new password
    user.password = hash;

    //save user into the database
    await user.save();
    res.sendStatus(200);
}

// reset the password of the fuel station manager
const resetFSMPassword = async (req, res) => {
    if (!req.body.userEmail || !req.body.newPassword) return res.sendStatus(400);

    let forgot;
    forgot = (req.body.forgot) ? true : false;

    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;

    // get the logged in fuel station manager's password using the fuel station manager's email from the database
    const user = await User.findOne({
        email: req.body.userEmail
    }).select({
        password: 1
    });

    if (!user) return res.sendStatus(400);

    if (!forgot) {//compare the stored password and password which is entered by the user
        const result = await bcrypt.compare(oldPassword, user.password);

        // check if the current password has and old password hash match
        if (!result) {
            return res.json({
                success: false,
                message: "Wrong old password"
            });
        }
    }

    // hash the old password
    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // set the password as the new hshed password
    user.password = newHash;

    // save the updated fuel station manager
    await user.save();

    // send the details to the frontend as a response with a success flag
    return res.json({
        success: true,
        message: "Password reset successful"
    });
}

// get details of a admin 
const getAdminAccountDetails = async (req, res) => {
    if (!req.body.userEmail) return res.sendStatus(400);

    // get the logged in admin's details using the email address from the database
    const admin = await User.findOne({
        email: req.body.userEmail
    });

    if (!admin) return res.sendStatus(400);
    
    const adminDetails = _.pick(admin, [
        "firstName",
        "lastName",
        "email",
        "mobile",
    ]);

    return res.json({
        success: true,
        adminDetails: adminDetails
    });
}

// reset the password of the admin
const resetAdminPassword = async (req, res) => {
    if (!req.body.userEmail || !req.body.newPassword) return res.sendStatus(400);
    let forgot;
    forgot = (req.body.forgot) ? true : false;

    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;

    // get the logged in admin's password using the admin's NIC number from the database
    const admin = await User.findOne({
        email: req.body.userEmail
    }).select({
        password: 1
    });

    if (!admin) return res.sendStatus(400);

    if (!forgot) {//compare the stored password and password which is entered by the user
        const result = await bcrypt.compare(oldPassword, admin.password);

        // check if the current password has and old password hash match
        if (!result) {
            return res.json({
                success: false,
                message: "Wrong old password"
            });
        }
    }

    // hash the old password
    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // set the password as the new hshed password
    admin.password = newHash;

    // save the updated admin
    await admin.save();

    // send the details to the frontend as a response with a success flag
    return res.json({
        success: true,
        message: "Password reset successful"
    });
}


module.exports = {
    getUserByNIC,
    getUsername,
    getUserByEmail,
    registerAdmin,
    getAllAdmins,
    getAllFSMs,
    getUsernameByNIC,
    getUsernameByEmail,
    generatePWD,
    updatePWD,
    getUserDetails,
    getCustomerDetailsByNIC,
    getFSMDetailsByID,
    getAdminDetailsByID,
    getAllUsers,
    getFSMCount,
    getCustomerCount,
    getSelectedFuelStations,
    setSelectedFuelStations,
    resetPwd,
    resetFSMPassword,
    getAdminAccountDetails,
    resetAdminPassword
}

