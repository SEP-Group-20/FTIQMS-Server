const nodemailer = require('nodemailer');
const emailAccount = require("../config/email-account.json");

let transporter = nodemailer.createTransport(emailAccount);

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