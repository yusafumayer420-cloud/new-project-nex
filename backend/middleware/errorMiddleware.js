const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode);
  
  const errorResponse = {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  };

  // Log error for internal monitoring
  if (process.env.NODE_ENV === 'production') {
    console.error(`[Error] ${err.message}`, {
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip
    });
  } else {
    console.error(err);
  }

  res.json(errorResponse);
};

module.exports = errorHandler;
