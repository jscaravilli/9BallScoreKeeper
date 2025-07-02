// PDF generation utilities for scoresheet printing

export async function generateScoresheetPDF(containerId: string = 'scoresheet-container') {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return null;

  try {
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    if (!printWindow) throw new Error('Could not open print window');

    // Get the scoresheet container
    const container = document.querySelector(`.${containerId}`) as HTMLElement;
    if (!container) throw new Error('Scoresheet container not found');

    // Clone the container
    const clonedContainer = container.cloneNode(true) as HTMLElement;

    // Create PDF-optimized HTML
    const pdfHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>APA 9-Ball Scoresheet</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            @page {
              size: letter landscape;
              margin: 0.25in;
            }
            
            body {
              font-family: Arial, sans-serif;
              background: white;
            }
            
            .pdf-container {
              width: 100%;
              height: 100vh;
              display: flex;
              justify-content: center;
              align-items: center;
              page-break-inside: avoid;
            }
            
            .scoresheet-content {
              width: 3300px;
              height: 2550px;
              transform: scale(0.73);
              transform-origin: center center;
              position: relative;
              overflow: hidden;
            }
            
            img {
              width: 100%;
              height: 100%;
              object-fit: fill;
            }
            
            /* Preserve all absolute positioning and colors */
            .absolute { position: absolute; }
            .font-bold { font-weight: bold; }
            .text-center { text-align: center; }
          </style>
        </head>
        <body>
          <div class="pdf-container">
            ${clonedContainer.outerHTML}
          </div>
        </body>
      </html>
    `;

    // Write to the new window
    printWindow.document.write(pdfHTML);
    printWindow.document.close();

    // Wait for images to load
    await new Promise(resolve => {
      printWindow.addEventListener('load', resolve);
      setTimeout(resolve, 2000); // Fallback timeout
    });

    // Trigger print dialog
    printWindow.print();

    // Close the window after printing
    setTimeout(() => {
      printWindow.close();
    }, 1000);

    return true;
  } catch (error) {
    console.error('PDF generation failed:', error);
    return false;
  }
}

// Alternative method using modern browser APIs
export async function downloadScoresheetPDF(containerId: string = 'scoresheet-container') {
  // This would require additional libraries like html2canvas + jsPDF
  // For now, we'll use the print method above
  console.log('Download PDF feature requires additional libraries');
  return generateScoresheetPDF(containerId);
}