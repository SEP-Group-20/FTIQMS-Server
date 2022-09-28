const { User } = require('../models/User');
const _ = require('lodash');

const getUserByNIC = async (req,res)=>{
    if(!req.body.NIC) return res.sendStatus(400);

    const result = await User.findOne({
        NIC: req.body.NIC
    });
    if(!result) return res.json({success:false});
    else{
        return res.json({
            success: true,
            user: _.pick(result,["NIC", "firstName", "lastName", "mobile"])
        });
    }
}

const getUsername = async (req,res)=>{
    if(!req.body.userNIC) 
        return res.sendStatus(400);

    const result = await User.findOne({
        NIC: req.body.userNIC
    }).select({
        firstName: 1,
        lastName: 1
    });

    if(!result)
        return res.json({success: false});
    else{
        return res.json({
            success: true,
            user: result
        });
    }
}


module.exports = {getUserByNIC, getUsername}