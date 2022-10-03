var admin = require("firebase-admin");
var serviceAccount = require("../config/firebase-service-account.json");

/*Here makes connection to the firebase admin service */
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
