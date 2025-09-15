const fs = require('fs');
const path = require('path');
const { getUploadDir, resolveFilePath } = require('../lib/filesHelper');

const moveFileToTrash = async (filePath) => {
    const uploadDir = getUploadDir();
    const trashDir = path.join(uploadDir, 'trash');

    if (!fs.existsSync(trashDir)) {
        fs.mkdirSync(trashDir, { recursive: true });
    }

    // The filePath is a URL path like /uploads/..., not a file system path.
    // We need to resolve the absolute path on the file system.
    const sourcePath = resolveFilePath(filePath);
    const fileName = path.basename(sourcePath);
    const destinationPath = path.join(trashDir, fileName);

    if (fs.existsSync(sourcePath)) {
        fs.renameSync(sourcePath, destinationPath);
    }
};

module.exports = { moveFileToTrash };