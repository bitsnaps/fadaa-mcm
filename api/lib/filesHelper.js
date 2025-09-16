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

const getContentType = (fileName) => {
    const extension = path.extname(fileName).toLowerCase();
    switch (extension) {
        case '.pdf':
            return 'application/pdf';
        case '.png':
            return 'image/png';
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.txt':
            return 'text/plain';
        case '.csv':
            return 'text/csv';
        default:
            return 'application/octet-stream';
    }
};

module.exports = { getUploadDir, resolveFilePath, getContentType };
