const fs = require('fs');
const path = require('path');

let arabicFontBase64;

const getArabicFontBase64 = () => {
    if (!arabicFontBase64) {
        // Since this utility might be used from different locations,
        // we should resolve the path relative to the project root or use absolute paths.
        // Assuming this file is in api/lib/, the fonts are in api/fonts/
        const fontPath = path.join(__dirname, '../fonts/Amiri.ttf');
        arabicFontBase64 = fs.readFileSync(fontPath).toString('base64');
    }
    return arabicFontBase64;
};

const applyArabicFont = (doc) => {
    const fontBase64 = getArabicFontBase64();
    doc.addFileToVFS('Amiri.ttf', fontBase64);
    doc.addFont('Amiri.ttf', 'Amiri', 'normal');
    doc.setFont('Amiri');
};

module.exports = {
    applyArabicFont
};
