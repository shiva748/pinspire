exports.handleError = (message, status) => {
  let error = new Error(message);
  error.status = status;
  throw error;
};

exports.handleMongoError = (err) => {
  if (err.keyValue) {
    const field = Object.keys(err.keyValue)[0];
    if (field === "username") {
      const error = new Error(
        `The username is already taken. Please choose a different username.`
      );
      error.status = 400;
      return error;
    }
    if (field === "email") {
      const error = new Error(
        `The email is already registered. Please use a different email address.`
      );
      error.status = 400;
      return error;
    }
  }
  return err;
};
