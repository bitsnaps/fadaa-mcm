const fs = require('fs');
const path = require('path');
const { moveFileToTrash } = require('../services/trashService');
const models = require('../models');
const { getUploadDir } = require('../lib/filesHelper');

const listFiles = async (c) => {
    try {
        const { page = 1, limit = 5 } = c.req.query();
        const uploadDir = getUploadDir();
        const subDirs = ['attachments', 'avatars', 'contracts', 'documents'];
        const allFiles = [];

        for (const subDir of subDirs) {
            const currentDir = path.join(uploadDir, subDir);
            if (fs.existsSync(currentDir)) {
                const files = fs.readdirSync(currentDir);
                for (const file of files) {
                    const filePath = path.join(currentDir, file);
                    const stat = fs.statSync(filePath);
                    allFiles.push({
                        name: file,
                        path: path.join('/uploads', subDir, file).replace(/\\/g, '/'),
                        size: stat.size,
                        createdAt: stat.birthtime,
                        source: subDir,
                    });
                }
            }
        }

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedFiles = allFiles.slice(startIndex, endIndex);

        return c.json({
            success: true,
            data: paginatedFiles,
            pagination: {
                total: allFiles.length,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(allFiles.length / limit),
            },
        });
    } catch (error) {
        console.error('Error listing files:', error);
        return c.json({ success: false, message: 'Failed to list files' }, 500);
    }
};

const deleteFile = async (c) => {
    try {
        const { filePath } = c.req.param();
        const decodedPath = decodeURIComponent(filePath);

        console.log('**** decodedPath: ', decodedPath);
        
        const isLinked = await isFileLinked(decodedPath);
        if (isLinked) {
            return c.json({ success: false, message: 'File is linked to a record and cannot be deleted.' }, 400);
        }

        await moveFileToTrash(decodedPath);

        return c.json({ success: true, message: 'File moved to trash successfully' });
    } catch (error) {
        console.error('Error moving file to trash:', error);
        return c.json({ success: false, message: 'Failed to move file to trash' }, 500);
    }
};

const isFileLinked = async (filePath) => {
    const document = await models.Document.findOne({ where: { file_path: filePath } });
    if (document) return true;

    const clientAttachment = await models.ClientAttachment.findOne({ where: { file_path: filePath } });
    if (clientAttachment) return true;

    const contract = await models.Contract.findOne({ where: { document_url: filePath } });
    if (contract) return true;

    return false;
};

module.exports = {
    listFiles,
    deleteFile,
};