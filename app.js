const path = require('path');
const express = require("express");
const { get, request } = require("http");
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
//const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./Routes/tourRoutes');
const userRouter = require('./Routes/userRoutes');
const reviewRouter = require('./Routes/reviewRoutes');
const bookingRouter = require('./Routes/bookingRouter');
const viewRouter = require('./Routes/viewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Global Middlewares
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public/js')));

app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? true  // Allow all origins in production (same-origin requests)
      : 'http://localhost:4000',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(
  helmet({
    contentSecurityPolicy: false, // Completely disable CSP
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'no-referrer-when-downgrade' }
  })
);

// Development logging
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

const limiter = rateLimit({
    max: 100, // Limit each IP to 100 requests per windowMs
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many requests from this IP, please try again in an hour!'
});

app.use('/api', limiter); // Apply rate limiting to all API routes

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); // Limit body size to 10kb
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
}));
app.use(cookieParser()); // Parse cookies

//Data sanitization against NoSQL query injection
app.use(mongoSanitize()); // Remove any characters that could be used in a NoSQL query

//Prevent parameter pollution
app.use(hpp({
    whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price'] // Allow these fields to be passed multiple times in query strings
}));

app.use(compression()); // Compress all responses

// Test middleware to log request time
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
  // console.log('Request Time:', req.requestTime); // commented out: debug log
    next(); 
});


app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter); //Mounting the routers
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter); // Assuming reviewRouter is defined in reviewRoutes.js
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404)); // Pass the error to the global error handler
});

app.use(globalErrorHandler); // Global error handler


module.exports = app;