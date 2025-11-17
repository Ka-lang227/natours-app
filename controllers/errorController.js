const AppError = require('./../utils/appError');

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
}

const handleDuplicateFieldsDB = err => {
    // Extract the field names and values from keyValue object
    const fields = Object.keys(err.keyValue);
    
    // Check if this is a duplicate review (compound index: tour + user)
    if (fields.includes('tour') && fields.includes('user')) {
        const message = 'You have already reviewed this tour. You can only submit one review per tour.';
        return new AppError(message, 400);
    }
    
    // Handle other duplicate field errors
    const field = fields[0];
    const value = err.keyValue[field];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
}

const handleValidationErrorDB = err => {
    // Extract the error messages from err.errors object
    const errors = Object.values(err.errors).map(el => el.message).join('. ')

    const message = `invalid input data. ${errors}`;
    return new AppError(message, 400);
}

const handleJWTErrorDB = () => new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredErrorDB = () => new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, req, res) => {
    //API
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } else {
        // Rendered Website
        console.error('ERROR 💥', err);

        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message  
        });
    }
};

const sendErrorProd = (err, req, res) => {
    //API
    if (req.originalUrl.startsWith('/api')) {
        if(err.isOperational) {
            // Operational, trusted error: send message to client
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
            //Programming or other unknown error: don't leak error details
        } else {
            // 1) Log error
            console.error('ERROR 💥', err);

            // 2) Send generic message
            return res.status(500).json({
                status: 'error',  
                message: 'Something went very wrong!',
            });
        };
    } else {
        //Rendered Website
        if(err.isOperational) {
            // Operational, trusted error: send message to client
            return res.status(err.statusCode).render('error', {
                title: 'Something went wrong!',
                msg: err.message  
            });
            //Programming or other unknown error: don't leak error details
        } else {
            // 1) Log error
            console.error('ERROR 💥', err);

            // 2) Send generic message
            return res.status(err.statusCode).render('error', {
                title: 'Something went wrong!',
                msg: 'Please try again later.'
            });
        }
    }
};

module.exports = (err, req, res, next) => {
    // console.log(err.stack);

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        let error = err;
        
        // Handle specific errors even in development
        if(err.name === 'CastError') error = handleCastErrorDB(err);
        if(err.code === 11000) error = handleDuplicateFieldsDB(err);
        
        sendErrorDev(error, req, res);

    } else if (process.env.NODE_ENV === 'production') {
        // Create a hard copy of the error object
        let error = Object.create(Object.getPrototypeOf(err));
        Object.assign(error, err);
        error.message = err.message;
        error.name = err.name;

        if(error.name === 'CastError') error = handleCastErrorDB(error);
        if(error.code === 11000) error = handleDuplicateFieldsDB(error);
        if(error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if(error.name === 'JsonWebTokenError') error = handleJWTErrorDB();
        if(error.name === 'TokenExpiredError') error = handleJWTExpiredErrorDB();

        // Send error response
        sendErrorProd(error, req, res);
    }
};