
const verifyRoles = (...allowdRoles) => {
    return (req, res, next) => {
        if (!req?.role) return res.status(401).json({"message":"RoleIsMissingFromRequest"});   //unauthorizes 
        const rolesArray = [...allowdRoles];
        // console.log(rolesArray);
        // console.log(parseInt(req.role));
        if (!rolesArray.includes(parseInt(req.role))) return res.status(401).json({"message":"NotAnAuthorizedUser"})  //unauthorized
        next();

    }
}

module.exports = verifyRoles;