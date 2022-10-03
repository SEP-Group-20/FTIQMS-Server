/* this piece of funtion takes the request hadlers as funtion parameter and executes it within the 
try catch block to catch exceptions. if there any exceptions call error handling middleware */
module.exports = function asyncMiddleware(handler) {
    return async (req, res, next) => {
        try {
            await handler(req, res);
        } catch (err) {
            next(err);
        }
    }
};