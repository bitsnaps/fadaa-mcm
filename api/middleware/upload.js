const { createMiddleware } = require('hono/factory');
const fs = require('fs');
const path = require('path');

const ensureUploadDir = () => {
    const uploadDir = process.env.UPLOAD_DIR;
    // if (!uploadDir) {
    //     throw new Error('UPLOAD_DIR environment variable is not set.');
    // }
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
};

const uploadMiddleware = (subDir = '', inputName = 'document') => {
    return createMiddleware(async (c, next) => {
        try {
            const baseUploadDir = ensureUploadDir();
            const uploadDir = path.join(baseUploadDir, subDir);
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const formData = await c.req.parseBody({ all: true });
            const file = formData[inputName];

            if (!file || !(file instanceof Blob) || !file.name) {
                // If no file is present, just continue to the next middleware.
                // The route handler will be responsible for validating if the file was required.
                return await next();
            }

            const fileArrayBuffer = await file.arrayBuffer();
            const fileBuffer = Buffer.from(fileArrayBuffer);
            const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
            const filePath = path.join(uploadDir, fileName);

            await fs.promises.writeFile(filePath, fileBuffer);

            // Make the relative path available to the route handler
            c.req.filePath = path.join('/uploads', subDir, fileName).replace(/\\/g, '/');

        } catch (error) {
            console.error('File upload error:', error);
            return c.json({ success: false, message: 'File upload failed' }, 500);
        }
        await next();
    });
};


module.exports = { uploadMiddleware };