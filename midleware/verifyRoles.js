/*This piece of function checks whether the user has access to the requested route */
const verifyRoles = (...allowdRoles) => {
    return (req, res, next) => {
        if (!req?.role) return res.status(401).json({"message":"RoleIsMissingFromRequest"});   //unauthorizes 
        const rolesArray = [...allowdRoles];
        // 
        // if the user's role doesn't include in the allowed roles list, reject the request 
        if (!rolesArray.includes(parseInt(req.role))) return res.status(401).json({"message":"NotAnAuthorizedUser"})  //unauthorized

        //otherwise goto next middleware
        next();

    }
}

module.exports = verifyRoles;