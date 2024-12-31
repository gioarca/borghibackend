// Utility function to create an error object with a specific status code and message
const errorHandler = (statusCode, message) => {
  const error = new Error();
  error.statusCode = statusCode;
  error.message = message;
  return error;
};

module.exports = errorHandler;
