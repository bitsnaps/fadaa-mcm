const fs = require('fs');
const path = require('path');

const deleteFile = async (c, filePath) => {
    try {
        // TODO: This could be improved by resolving the upload dir from `UPLOAD_DIR` var env
        const abosultePath = path.join(__dirname, '../public', filePath);
        if (fs.existsSync(abosultePath)) {
            fs.unlinkSync(abosultePath);
        }    
    } catch (error) {
        console.error('Error deleting file:', error);
        return c.json({ success: false, message: 'Failed to delete file' }, 500);
    }
};

const downloadFile = async (c, filePath) => {
    try {
        const decodedPath = decodeURIComponent(filePath);
        
        const absolutePath = path.resolve(process.env.UPLOAD_DIR, decodedPath);

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