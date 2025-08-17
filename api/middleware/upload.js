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

const uploadMiddleware = createMiddleware(async (c, next) => {
    try {
        const uploadDir = ensureUploadDir();
        const formData = await c.req.parseBody({ all: true });
        const file = formData['profile_picture'];

        if (!file || !(file instanceof Blob)) {
            return c.json({ success: false, message: 'No file uploaded or invalid file type.' }, 400);
        }

        const fileArrayBuffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(fileArrayBuffer);
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = path.join(uploadDir, fileName);

        await fs.promises.writeFile(filePath, fileBuffer);

        c.req.filePath = `/uploads/${fileName}`;

    } catch (error) {
        console.error('File upload error:', error);
        return c.json({ success: false, message: 'File upload failed' }, 500);
    }
    await next();
});

module.exports = { uploadMiddleware };