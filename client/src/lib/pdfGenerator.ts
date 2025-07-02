import jsPDF from 'jspdf';
import scoresheetPng from "@assets/9B Blank-0_1751450594313.png";

// Canvas-based image rendering with markup burned into PNG
export async function renderScoresheetToCanvas(
  tallies: Array<{ x: number; y: number; symbol: string; game: number }>,
  circles: Array<{ x: number; y: number }>,
  verticalLines: Array<{ x: number; y: number }>
): Promise<HTMLCanvasElement> {
  
  // Create canvas with exact PNG dimensions
  const canvas = document.createElement('canvas');
  canvas.width = 3300;
  canvas.height = 2550;
  const ctx = canvas.getContext('2d')!;
  
  // Load the base PNG image
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = scoresheetPng;
  });
  
  // Draw the base scoresheet
  ctx.drawImage(img, 0, 0, 3300, 2550);
  
  // Draw tally marks
  ctx.font = 'bold 48.5px Arial';
  ctx.fillStyle = 'blue';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  tallies.forEach(tally => {
    ctx.fillText(tally.symbol, tally.x, tally.y);
  });
  
  // Draw vertical game separators
  ctx.font = '900 53.4px Arial';
  ctx.fillStyle = 'black';
  
  verticalLines.forEach(line => {
    ctx.fillText('|', line.x, line.y);
  });
  
  // Draw target circles
  ctx.strokeStyle = 'blue';
  ctx.lineWidth = 7;
  ctx.fillStyle = 'transparent';
  
  circles.forEach(circle => {
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, 34.5, 0, 2 * Math.PI); // 69px diameter = 34.5px radius
    ctx.stroke();
  });
  
  return canvas;
}

// Convert canvas to PDF and download
export async function downloadScoresheetPDF(
  tallies: Array<{ x: number; y: number; symbol: string; game: number }>,
  circles: Array<{ x: number; y: number }>,
  verticalLines: Array<{ x: number; y: number }>
): Promise<void> {
  
  try {
    // Render to canvas
    const canvas = await renderScoresheetToCanvas(tallies, circles, verticalLines);
    
    // Scale canvas for letter paper (landscape: 11" x 8.5")
    // At 150 DPI: 1650px x 1275px
    const printCanvas = document.createElement('canvas');
    printCanvas.width = 1650; // 11" at 150 DPI
    printCanvas.height = 1275; // 8.5" at 150 DPI
    const printCtx = printCanvas.getContext('2d')!;
    
    // Calculate scaling to fit letter paper
    const scaleX = 1650 / 3300; // 0.5
    const scaleY = 1275 / 2550; // 0.5
    const scale = Math.min(scaleX, scaleY);
    
    // Center the image
    const scaledWidth = 3300 * scale;
    const scaledHeight = 2550 * scale;
    const offsetX = (1650 - scaledWidth) / 2;
    const offsetY = (1275 - scaledHeight) / 2;
    
    // Draw scaled image
    printCtx.fillStyle = 'white';
    printCtx.fillRect(0, 0, 1650, 1275);
    printCtx.drawImage(canvas, offsetX, offsetY, scaledWidth, scaledHeight);
    
    // Convert to blob and download
    printCanvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'apa-scoresheet.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
    
  } catch (error) {
    console.error('Canvas rendering failed:', error);
  }
}

// Automatic PDF generation and download
export async function printScoresheetImage(
  tallies: Array<{ x: number; y: number; symbol: string; game: number }>,
  circles: Array<{ x: number; y: number }>,
  verticalLines: Array<{ x: number; y: number }>
): Promise<void> {
  
  try {
    // Render to canvas with markup
    const canvas = await renderScoresheetToCanvas(tallies, circles, verticalLines);
    
    // Convert canvas to data URL
    const dataURL = canvas.toDataURL('image/png');
    
    // Create PDF document (letter size landscape: 11" x 8.5")
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'in',
      format: 'letter'
    });
    
    // Calculate dimensions to fit the full scoresheet on one page
    const pageWidth = 11;  // 11 inches
    const pageHeight = 8.5; // 8.5 inches
    const margin = 0.25;   // 0.25 inch margin
    
    const availableWidth = pageWidth - (2 * margin);
    const availableHeight = pageHeight - (2 * margin);
    
    // Scoresheet aspect ratio: 3300/2550 = 1.294
    const aspectRatio = 3300 / 2550;
    
    // Calculate dimensions to fit within available space
    let imgWidth = availableWidth;
    let imgHeight = availableWidth / aspectRatio;
    
    // If height exceeds available space, scale down
    if (imgHeight > availableHeight) {
      imgHeight = availableHeight;
      imgWidth = imgHeight * aspectRatio;
    }
    
    // Center the image on the page
    const xPos = (pageWidth - imgWidth) / 2;
    const yPos = (pageHeight - imgHeight) / 2;
    
    // Add the image to PDF
    pdf.addImage(dataURL, 'PNG', xPos, yPos, imgWidth, imgHeight);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
    const filename = `APA-Scoresheet-${timestamp}.pdf`;
    
    // Download the PDF
    pdf.save(filename);
    
    console.log(`PDF generated: ${filename}`);
    
  } catch (error) {
    console.error('PDF generation failed:', error);
  }
}