const fs = require('fs');
const path = require('path');
const { moveFileToTrash } = require('../services/trashService');
const models = require('../models');
const { getUploadDir, resolveFilePath, getContentType } = require('../lib/filesHelper');

const listFiles = async (c) => {
    try {
        const { page = 1, limit = 5, search = '' } = c.req.query();
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

        const filteredFiles = allFiles.filter(file => file.name.toLowerCase().includes(search.toLowerCase()));

        const totalFiles = filteredFiles.length;
        const totalPages = Math.ceil(totalFiles / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedFiles = filteredFiles.slice(startIndex, endIndex);

        return c.json({
            success: true,
            data: paginatedFiles,
            pagination: {
                total: totalFiles,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: totalPages,
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

// Helper to extract full requested path after wildcard route and normalize to start with /uploads
const extractRequestedPath = (c, variant) => {
  const base = variant === 'download' ? '/api/files/download/' : '/api/files/preview/';
  const fullPath = c.req.path || '';
  let raw = '';
  if (fullPath.startsWith(base)) {
    raw = fullPath.slice(base.length);
  } else {
    // Fallback for non-wildcard matching
    const params = c.req.param();
    raw = params.filePath || '';
  }
  const decoded = decodeURIComponent(raw);
  if (decoded.startsWith('/uploads')) return decoded;
  if (decoded.startsWith('uploads/')) return '/' + decoded;
  if (decoded) return '/uploads/' + decoded;
  return decoded;
};

const downloadFile = async (c) => {
    try {
        // const { filePath } = c.req.param();
        // const decodedPath = decodeURIComponent(filePath);
        const decodedPath = extractRequestedPath(c, 'download');
        const sourcePath = resolveFilePath(decodedPath);
        
        if (fs.existsSync(sourcePath)) {
            const fileStream = fs.createReadStream(sourcePath);
            const fileName = path.basename(sourcePath);
            const contentType = getContentType(fileName);

            c.header('Content-Type', contentType);
            c.header('Content-Disposition', `attachment; filename=${encodeURIComponent(fileName)}`);

            return c.body(fileStream);
        }

        return c.json({ success: false, message: 'File not found' }, 404);
    } catch (error) {
        console.error('Error downloading file:', error);
        return c.json({ success: false, message: 'Failed to download file' }, 500);
    }
};

const previewFile = async (c) => {
    try {
        // const { filePath } = c.req.param();
        // const decodedPath = decodeURIComponent(filePath);
        const decodedPath = extractRequestedPath(c, 'preview');
        const sourcePath = resolveFilePath(decodedPath);

        if (fs.existsSync(sourcePath)) {
            const fileStream = fs.createReadStream(sourcePath);
            const fileName = path.basename(sourcePath);
            const contentType = getContentType(fileName);

            c.header('Content-Type', contentType);
            c.header('Content-Disposition', `inline; filename=${encodeURIComponent(fileName)}`);

            return c.body(fileStream);
        }

        return c.json({ success: false, message: 'File not found' }, 404);
    } catch (error) {
        console.error('Error previewing file:', error);
        return c.json({ success: false, message: 'Failed to preview file' }, 500);
    }
};

module.exports = {
    listFiles,
    deleteFile,
    downloadFile,
    previewFile,
};