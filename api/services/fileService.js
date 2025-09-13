const fs = require('fs');
const path = require('path');
const { getUploadDir } = require('../lib/errorHandler');

const downloadFile = async (c, filePath) => {
    try {
        const decodedPath = decodeURIComponent(filePath);
        
        const uploadDir = getUploadDir();
        const absolutePath = path.resolve(uploadDir, decodedPath);

        if (!fs.existsSync(absolutePath)) {
            return c.json({ success: false, message: 'File not found' }, 404);
        }

        const fileStream = fs.createReadStream(absolutePath);
        const fileName = path.basename(decodedPath);

        const contentType = fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';

        c.header('Content-Type', contentType);
        c.header('Content-Disposition', `attachment; filename=${encodeURIComponent(fileName)}`);
        
        return c.body(fileStream);
    } catch (error) {
        console.error('Error downloading file:', error);
        return c.json({ success: false, message: 'Failed to download file' }, 500);
    }
};

module.exports = { downloadFile };