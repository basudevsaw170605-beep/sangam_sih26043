export const notFound = (req, res) =>
  res
    .status(404)
    .json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
export const errorHandler = (err, req, res, next) => {
  console.error(err);
  let status = err.statusCode || 500,
    message = err.message || 'Something went wrong';
  if (err.name === 'ValidationError') {
    status = 422;
    message = Object.values(err.errors)
      .map((x) => x.message)
      .join(', ');
  }
  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid resource identifier';
  }
  if (err.code === 11000) {
    status = 409;
    message = 'A record with that value already exists';
  }
  if (err.name === 'MulterError') {
    status = 422;
    message = err.message;
  }
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { error: err.name }),
  });
};
