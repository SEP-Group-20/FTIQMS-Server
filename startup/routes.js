const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const {errorMiddleware} = require('../midleware/error');
const authRouter = require('../routes/auth');
const corsOptions = require('../utils/corsOptions');
const userRouter = require("../routes/user");
const vehicleRouter = require("../routes/vehicle");
const customerRouter = require("../routes/customer");
const fuelStationRouter = require("../routes/fuelStation");
const fuelOrderRouter = require("../routes/fuelOrder");

module.exports = (app) => {
    //to manage access to the API
    app.use(cors(corsOptions));
    app.use(express.json());

    //to parse copkies for authorization purposes
    app.use(cookieParser());

    //routes
    app.use("/api/auth", authRouter);
    app.use("/api/user",userRouter);
    app.use("/api/vehicle", vehicleRouter);
    app.use("/api/customer", customerRouter);
    app.use("/api/fuelStation", fuelStationRouter);
    app.use("/api/fuelOrder", fuelOrderRouter);

    //error middleware
    app.use(errorMiddleware);
}