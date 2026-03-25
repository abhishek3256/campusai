const pdfParse = require('pdf-parse');
const fs = require('fs');

async function testPdf() {
    // Generate a dummy pdf with a link? Hard from scratch.
    // Let's just make the custom pagerender and test it on null if we can't find a pdf.
    const render_page = async (pageData) => {
        const textContent = await pageData.getTextContent();
        let text = '';
        let lastY;
        for (let item of textContent.items) {
            if (lastY == item.transform[5] || !lastY){
                text += item.str;
            }  
            else{
                text += '\n' + item.str;
            }    
            lastY = item.transform[5];
        }
        try {
            const annotations = await pageData.getAnnotations();
            const links = annotations.filter(a => a.subtype === 'Link' && a.url).map(a => a.url);
            if (links.length > 0) {
                text += '\n[Links: ' + links.join(', ') + ']';
            }
        } catch (e) {
            console.error(e);
        }
        return text;
    };
    
    // Create an empty dummy pdf buffer just to see if it throws error
    const dummyBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 0 >>\nstream\nendstream\nendobj\ntrailer\n<< /Root 1 0 R /Size 5 >>\n%%EOF', 'utf8');

    try {
        const data = await pdfParse(dummyBuffer, { pagerender: render_page });
        console.log("Passed", data.text);
    } catch(e) {
        console.log("Error", e.message);
    }
}

testPdf();
