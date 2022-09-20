const express = require('express');
const cookieParser = require('cookie-parser');
const {errorMiddleware} = require('../midleware/error');
const auth = require('../routes/auth');

module.exports = (app) => {
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/auth", auth);


    //error middleware
    app.use(errorMiddleware);
}