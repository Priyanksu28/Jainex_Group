const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function generatePresentationPDF() {
    console.log("Starting PDF conversion...");
    
    // Find Chrome or Edge executable
    const possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    
    let executablePath = possiblePaths.find(p => fs.existsSync(p));
    if (!executablePath) {
        throw new Error("No Chrome or Edge installation found on system.");
    }
    
    console.log(`Using browser at: ${executablePath}`);
    
    const browser = await puppeteer.launch({
        executablePath,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });
    
    const page = await browser.newPage();
    
    // Set 16:9 widescreen viewport
    await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 2
    });
    
    const htmlPath = path.resolve(__dirname, '..', 'presentation.html');
    const pdfPath = path.resolve(__dirname, '..', 'Jainex_Fleet_Operations_Presentation.pdf');
    
    console.log(`Loading HTML from: ${htmlPath}`);
    await page.goto(`file://${htmlPath}`, {
        waitUntil: 'networkidle0',
        timeout: 60000
    });
    
    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');
    
    console.log("Rendering PDF slides (1920x1080)...");
    await page.pdf({
        path: pdfPath,
        width: '1920px',
        height: '1080px',
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });
    
    await browser.close();
    console.log(`✅ Presentation PDF successfully generated at: ${pdfPath}`);
}

generatePresentationPDF().catch(err => {
    console.error("Error generating PDF:", err);
    process.exit(1);
});
