const getUploadDir = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.UPLOAD_DIR;
  }
  return '../public/uploads'; // This is maybe better to grab it from the var env, even on dev mode.
};

module.exports = { getUploadDir };
