const nodemailer = require('nodemailer');
const emailAccount = require("../config/email-account.json");

//create transporter
let transporter = nodemailer.createTransport(emailAccount);

/*This function formats message and send the email using transporter  */
const sendMail = (to, subject, text) => {
    return new Promise((resolve, reject) => {
        const message = {
            from: emailAccount.auth.user,
            to,
            subject,
            text
        }
        transporter.sendMail(message,(err)=>{
            if(err) return reject(err);
            resolve(true);
        });
    });
};

module.exports = sendMail;