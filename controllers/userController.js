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


module.exports = {getUserByNIC}