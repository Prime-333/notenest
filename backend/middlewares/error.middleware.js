const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  console.error({
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
};

module.exports = errorHandler;
