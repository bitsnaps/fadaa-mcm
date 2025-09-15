const getUploadDir = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.UPLOAD_DIR;
  }
  return '../public/uploads'; // This is maybe better to grab it from the var env, even on dev mode.
};

const path = require('path');

const resolveFilePath = (filePath) => {
    const uploadDir = getUploadDir();
    const relativePath = filePath.startsWith('/uploads') ? filePath.substring('/uploads'.length) : filePath;
    return path.join(uploadDir, relativePath);
};

module.exports = { getUploadDir, resolveFilePath };
