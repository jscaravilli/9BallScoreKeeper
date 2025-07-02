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

// Simple print function that opens the rendered image
export async function printScoresheetImage(
  tallies: Array<{ x: number; y: number; symbol: string; game: number }>,
  circles: Array<{ x: number; y: number }>,
  verticalLines: Array<{ x: number; y: number }>
): Promise<void> {
  
  try {
    const canvas = await renderScoresheetToCanvas(tallies, circles, verticalLines);
    
    // Convert to data URL
    const dataURL = canvas.toDataURL('image/png');
    
    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>APA Scoresheet</title>
            <style>
              @page { size: letter landscape; margin: 0.25in; }
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              img { max-width: 100%; max-height: 100%; }
            </style>
          </head>
          <body>
            <img src="${dataURL}" alt="APA Scoresheet" />
          </body>
        </html>
      `);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    }
    
  } catch (error) {
    console.error('Print generation failed:', error);
  }
}