const path = require('path');

const getUploadDir = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.UPLOAD_DIR;
  }
  return '../public/uploads'; // This is maybe better to grab it from the var env, even on dev mode.
};

const resolveFilePath = (filePath) => {
    const uploadDir = getUploadDir();
    // Sanitize the file path by removing any leading slashes and 'uploads' segments
    const sanitizedPath = filePath.replace(/^\/+/, '').replace(/^uploads\/?/, '');
    return path.join(uploadDir, sanitizedPath);
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
