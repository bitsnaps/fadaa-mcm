const fs = require('fs');
const path = require('path');
const { getUploadDir } = require('../lib/filesHelper');

const listTrash = async (c) => {
    try {
        const { page = 1, limit = 5 } = c.req.query();
        const uploadDir = getUploadDir();
        const trashDir = path.join(uploadDir, 'trash');
        
        const trashedFiles = [];
        if (!fs.existsSync(trashDir)) {
            fs.mkdirSync(trashDir, { recursive: true });
        }

        if (fs.existsSync(trashDir)) {
            const files = fs.readdirSync(trashDir);
            for (const file of files) {
                const filePath = path.join(trashDir, file);
                const stat = fs.statSync(filePath);

                trashedFiles.push({
                    name: file,
                    path: path.join('/uploads', 'trash', file).replace(/\\/g, '/'),
                    size: stat.size,
                    createdAt: stat.birthtime,
                });
            }
        }

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedFiles = trashedFiles.slice(startIndex, endIndex);

        return c.json({
            success: true,
            data: paginatedFiles,
            pagination: {
                total: trashedFiles.length,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(trashedFiles.length / limit),
            },
        });
    } catch (error) {
        console.error('Error listing trashed files:', error);
        return c.json({ success: false, message: 'Failed to list trashed files' }, 500);
    }
};

const permanentDeleteFile = async (c) => {
    try {
        const { filePath } = c.req.param();
        const decodedPath = decodeURIComponent(filePath);

        const uploadDir = getUploadDir();
        const trashDir = path.join(uploadDir, 'trash');
        const sourcePath = path.join(trashDir, decodedPath);

        console.log('****** sourcePath: ', sourcePath);
        
        if (fs.existsSync(sourcePath)) {
            fs.unlinkSync(sourcePath);
            return c.json({ success: true, message: 'File permanently deleted' });
        }

        return c.json({ success: false, message: 'File not found in trash' }, 404);
    } catch (error) {
        console.error('Error permanently deleting file:', error);
        return c.json({ success: false, message: 'Failed to permanently delete file' }, 500);
    }
};

const emptyTrash = async (c) => {
    try {
        const uploadDir = getUploadDir();
        const trashDir = path.join(uploadDir, 'trash');

        if (fs.existsSync(trashDir)) {
            const files = fs.readdirSync(trashDir);
            for (const file of files) {
                const filePath = path.join(trashDir, file);
                fs.unlinkSync(filePath);
            }
        }

        return c.json({ success: true, message: 'Trash emptied successfully' });
    } catch (error) {
        console.error('Error emptying trash:', error);
        return c.json({ success: false, message: 'Failed to empty trash' }, 500);
    }
};

module.exports = {
    listTrash,
    permanentDeleteFile,
    emptyTrash,
};