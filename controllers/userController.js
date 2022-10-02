const { User } = require('../models/User');
const _ = require('lodash');

// get details of a user given the NIC
const getUserByNIC = async (req,res)=>{
    // if NIC number is not send send a error response
    if(!req.body.NIC) return res.sendStatus(400);

    // get the logged in user's details using the customer's NIC number from the database
    const result = await User.findOne({
        NIC: req.body.NIC
    });

    // if user detail retrival is a failure send a error flag as the response
    if(!result) return res.json({success:false});
    else{
        // get the NIC, firstname, lastname, mobile number from the user's details
        // and send only those in the response with a success flag
        return res.json({
            success: true,
            user: _.pick(result,["NIC", "firstName", "lastName", "mobile"])
        });
    }
}

// get the full name of a user given the NIC
const getUsername = async (req,res)=>{
    // if NIC number is not send send a error response
    if(!req.body.userNIC) 
        return res.sendStatus(400);

    // get the logged in user's firstname and lastname using the customer's NIC number from the database
    const result = await User.findOne({
        NIC: req.body.userNIC
    }).select({
        firstName: 1,
        lastName: 1
    });

    // if user's names retrival is a failure send a error flag as the response
    if(!result)
        return res.json({success: false});
    else{
        // send the names along with a success flag as the response
        return res.json({
            success: true,
            user: result
        });
    }
}

// get details of a user given the email
const getUserByEmail = async (req,res) => {
    // if email is not send send a error response
    if(!req.body.email) return res.sendStatus(400);

    // get the logged in user's details using the customer's email from the database
    const result = await User.findOne({
        email: req.body.email
    });

    // if user detail retrival is a failure send a error flag as the response
    if(!result) return res.json({success:false});
    else{
        // get the email, firstname, lastname, mobile number from the user's details
        // and send only those in the response with a success flag
        return res.json({
            success: true,
            user: _.pick(result,["email", "firstName", "lastName", "mobile"])
        });
    }
}

module.exports = {getUserByNIC, getUsername, getUserByEmail}