const fs = require('fs');
const path = require('path');
const { getUploadDir } = require('../lib/filesHelper');

const moveFileToTrash = async (filePath) => {
    const uploadDir = getUploadDir();
    const trashDir = path.join(uploadDir, 'trash');
    
    if (!fs.existsSync(trashDir)) {
        fs.mkdirSync(trashDir, { recursive: true });
    }

    const sourcePath = path.join(uploadDir, filePath);
    const fileName = path.basename(filePath);
    const destinationPath = path.join(trashDir, fileName);

    if (fs.existsSync(sourcePath)) {
        fs.renameSync(sourcePath, destinationPath);
    }
};

module.exports = { moveFileToTrash };