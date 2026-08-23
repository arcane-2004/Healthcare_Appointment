const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details for server diagnostics
  console.error('[Error Handler]', {
    name: err.name,
    message: err.message,
    code: err.code,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Mongoose Bad ObjectId / CastError
  if (err.name === 'CastError') {
    const message = `Resource not found with id: ${err.value}`;
    return res.status(404).json({
      success: false,
      message
    });
  }

  // Mongoose Duplicate Key Error (Code 11000) -> HTTP 409 Conflict
  if (err.code === 11000) {
    let message = 'Duplicate field value entered.';
    const keyPattern = err.keyPattern || {};

    if (keyPattern.doctorId && keyPattern.date && keyPattern.startTime) {
      message = 'This slot has already been booked.';
    } else if (keyPattern.email) {
      message = 'An account with this email address already exists.';
    } else if (keyPattern.userId) {
      message = 'A record already exists for this user.';
    }

    return res.status(409).json({
      success: false,
      message
    });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    return res.status(400).json({
      success: false,
      message
    });
  }

  // JSON Web Token Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authorization token has expired.'
    });
  }

  // Default server error
  res.status(err.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;
