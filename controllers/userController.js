const { User } = require('../models/User');

const checkNIC = async (req,res)=>{
    if(!req.body.NIC) return res.sendStatus(400);

    const result = await User.findOne({
        NIC: req.body.NIC
    });
    if(!result) return res.json({success:true});
    res.json({success:false});
}

module.exports = {checkNIC}