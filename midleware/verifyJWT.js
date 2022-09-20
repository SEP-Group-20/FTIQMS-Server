const jwt = require("jsonwebtoken");

const verifyJWT = (req, res, next) => {
    // console.log(req.headers)
    const authHeader = req.headers.authorization || req.headers.Authorization;
    // console.log('dfdfdfd',authHeader);
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json("You're not Authenticated!");
   
    
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
        if (err) res.status(403).json({ auth: false, message: "Invalid token!" });
        else {
            req.userID = decode.userInfo.id;
            req.role = decode.userInfo.role;
            next();
        }
    });
}

module.exports = verifyJWT;