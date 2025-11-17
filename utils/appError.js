class AppError extends Error {
    constructor(message, statusCode) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // This is an operational error, not a programming error

        Error.captureStackTrace(this, this.constructor); // Capture the stack trace for debugging
    }
}

module.exports = AppError;