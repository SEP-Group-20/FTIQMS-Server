const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const {errorMiddleware} = require('../midleware/error');
const auth = require('../routes/auth');
const corsOptions = require('../utils/corsOptions');

module.exports = (app) => {
    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/auth", auth);


    //error middleware
    app.use(errorMiddleware);
}