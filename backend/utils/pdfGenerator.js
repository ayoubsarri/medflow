const PDFDocument = require('pdfkit');
/* 
   This utility uses the 'PDFKit' library to transform raw medical data into professional, 
   A5-formatted PDF documents (Prescriptions and Justifications) ready for browser download.
*/
/**
 * REUSABLE BEAUTIFUL PDF GENERATOR
 * @param {Object} res - Express response object
 * @param {Object} data - Contains doctorInfo, patientInfo, and content
 * @param {String} type - 'Prescription' or 'Justification'
 */
exports.generateMedicalPDF = (res, data, type) => {
    const doc = new PDFDocument({ size: 'A5', margin: 40 });

    // Stream the PDF directly to the browser download tab
    doc.pipe(res);

    // ---PROFESSIONAL HEADER ---
    doc.fillColor('#2c3e50').fontSize(18).text('CENTRAL CLINIC', { align: 'center' });
    doc.fillColor('#7f8c8d').fontSize(10).text('123 Medical Boulevard, Algiers', { align: 'center' });
    doc.moveDown(0.5);
    
    // DYNAMIC DOCTOR INFO 
    doc.fillColor('#000').fontSize(11).text(`Dr. ${data.doctorName}`, { align: 'left' });
    doc.fontSize(9).font('Helvetica-Oblique').text(`${data.specialty}`, { align: 'left' });
    
    // Horizontal Line
    doc.moveTo(40, 110).lineTo(380, 110).stroke('#bdc3c7');
    doc.moveDown(2);

    // --- PATIENT & DATE BOX ---
    doc.font('Helvetica-Bold').fontSize(10).text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();
    doc.font('Helvetica').text(`Patient Name: `, { continued: true }).font('Helvetica-Bold').text(`${data.patientName}`);
    doc.font('Helvetica').text(`File Number: `, { continued: true }).font('Helvetica-Bold').text(`${data.fileCode}`);
    doc.moveDown(2);

    // --- THE CONTENT ---
    doc.fillColor('#2c3e50').fontSize(16).font('Helvetica-Bold').text(type.toUpperCase(), { align: 'center', underline: true });
    doc.moveDown(1.5);

    doc.fillColor('#000').fontSize(11).font('Helvetica').text(data.textContent, {
        lineGap: 6,
        align: 'justify'
    });

    // --- 4. SIGNATURE AREA ---
    const bottom = doc.page.height - 100;
    doc.fontSize(10).text('Doctor Signature & Stamp', 250, bottom, { align: 'center' });
    
    // Finalize
    doc.end();
};