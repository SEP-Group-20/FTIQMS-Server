const jwt = require("jsonwebtoken");

//this piece of middleware gets the authorization header and validate it
const verifyJWT = (req, res, next) => {
    // rejects request if there is no auth header
    const authHeader = req.headers.authorization || req.headers.Authorization;
    // console.log('dfdfdfd',authHeader);
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json("You're not Authenticated!");
   
    
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
        //reject request if invalid access token
        if (err) res.status(403).json({ auth: false, message: "Invalid token!" });
        else {
            //goto next middleware if valid access token
            req.userID = decode.userInfo.id;
            req.role = decode.userInfo.role;
            next();
        }
    });
}

module.exports = verifyJWT;