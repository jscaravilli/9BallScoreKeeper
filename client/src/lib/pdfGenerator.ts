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
    
    // Open PDF in new window ready for manual printing
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Open in new window ready for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>APA Scoresheet - ${filename}</title>
            <style>
              @page { size: letter landscape; margin: 0.25in; }
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              embed { width: 100%; height: 100vh; }
            </style>
          </head>
          <body>
            <embed src="${pdfUrl}" type="application/pdf" />
            <p style="position: fixed; top: 10px; left: 10px; background: rgba(0,0,0,0.7); color: white; padding: 8px; border-radius: 4px; font-size: 12px;">
              Press Ctrl+P to print this scoresheet
            </p>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      // Wait for PDF to load, then focus window for user to print manually
      setTimeout(() => {
        printWindow.focus();
        // Clean up URL after some time
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl);
        }, 60000); // Keep URL for 1 minute
      }, 1000);
    }
    
    console.log(`PDF ready for printing: ${filename}`);
    
  } catch (error) {
    console.error('PDF generation failed:', error);
  }
}

// Generate PDF directly from match data (for match history printing)
export async function printMatchScoresheet(match: any): Promise<void> {
  if (!match || !match.events || !match.completedAt) {
    console.error('Invalid match data for PDF generation');
    return;
  }

  try {
    // Player 1 coordinates array (lag winner)
    const PLAYER1_COORDINATES = [
      [255,149], [283,149], [310,149], [341,149], [373,149], [411,149], [435,149], [466,149], [497,149], [542,149],
      [591,149], [618,149], [649,149], [698,149], [753,149], [781,149], [812,149], [840,149], [885,149], [940,149],
      [968,149], [995,149], [1023,149], [1054,149], [1102,149], [1151,149], [1182,149], [1213,149], [1241,149], [1272,149],
      [1320,149], [1372,149], [1400,149], [1431,149], [1476,149], [1514,149], [1545,149], [1594,149], [1646,149], [1677,149],
      [1704,149], [1732,149], [1763,149], [1791,149], [1822,149], [1867,149], [1919,149], [1947,149], [1978,149], [2023,149],
      [2064,149], [2095,149], [2123,149], [2151,149], [2199,149], [2247,149], [2282,149], [2310,149], [2341,149], [2386,149],
      [2427,149], [2455,149], [2486,149], [2514,149], [2562,149], [2611,149], [2642,149], [2673,149], [2701,149], [2742,149],
      [2787,149], [2818,149], [2846,149], [2877,149], [2925,149]
    ];

    // Player 2 coordinates array
    const PLAYER2_COORDINATES = [
      [252,511], [280,511], [307,511], [338,511], [370,511], [408,511], [432,511], [463,511], [494,511], [539,511],
      [588,511], [615,511], [646,511], [695,511], [750,511], [778,511], [809,511], [837,511], [882,511], [937,511],
      [965,511], [992,511], [1020,511], [1051,511], [1099,511], [1148,511], [1179,511], [1210,511], [1238,511], [1269,511],
      [1317,511], [1369,511], [1397,511], [1428,511], [1473,511], [1511,511], [1542,511], [1591,511], [1643,511], [1674,511],
      [1701,511], [1729,511], [1760,511], [1788,511], [1819,511], [1864,511], [1916,511], [1944,511], [1975,511], [2020,511],
      [2061,511], [2092,511], [2120,511], [2148,511], [2196,511], [2244,511], [2279,511], [2307,511], [2338,511], [2383,511],
      [2424,511], [2452,511], [2483,511], [2511,511], [2559,511], [2608,511], [2639,511], [2670,511], [2698,511], [2739,511],
      [2784,511], [2815,511], [2843,511], [2874,511], [2922,511]
    ];

    // Extract data for canvas rendering
    const tallies: Array<{ x: number; y: number; symbol: string; game: number }> = [];
    const circles: Array<{ x: number; y: number }> = [];
    const verticalLines: Array<{ x: number; y: number }> = [];

    // Process match events to build markup data
    let gameNumber = 1;
    let player1MarkIndex = 0;
    let player2MarkIndex = 0;

    // Helper function to get slash direction
    const getSlashDirection = (gameNum: number): string => {
      return gameNum % 2 === 1 ? '/' : '\\';
    };

    console.log('Processing match events for PDF:', match.events.length, 'events');

    match.events.forEach((event: any, eventIndex: number) => {
      if (event.type === 'ball_scored') {
        const player = event.player;
        const isPlayer1 = player === 1;
        const coordinates = isPlayer1 ? PLAYER1_COORDINATES : PLAYER2_COORDINATES;
        const markIndex = isPlayer1 ? player1MarkIndex : player2MarkIndex;
        
        console.log(`Event ${eventIndex}: Ball ${event.ballNumber} scored by player ${player}, markIndex: ${markIndex}`);
        
        const coord = coordinates[markIndex];
        if (coord && markIndex < coordinates.length) {
          const [x, y] = coord;
          const slashDirection = getSlashDirection(gameNumber);
          
          if (event.ballNumber === 9) {
            // 9-ball gets 2 tally marks
            tallies.push({ x: x + 3, y: y, symbol: slashDirection, game: gameNumber });
            tallies.push({ x: x + 3, y: y, symbol: slashDirection, game: gameNumber });
            console.log(`Added 2 tallies for 9-ball by player ${player} at position ${markIndex}, coords: ${x}, ${y}`);
            
            // Update mark index for ONLY the scoring player
            if (isPlayer1) {
              player1MarkIndex += 2; // 9-ball takes 2 positions
            } else {
              player2MarkIndex += 2;
            }
            
            // Add vertical lines to separate games (when slash direction will change)
            // Place lines between the last tally of this game and first tally of next game
            
            // For Player 1: Add line after their current position (if they have tallies)
            if (player1MarkIndex > 0) {
              const p1Coord = PLAYER1_COORDINATES[player1MarkIndex - 1];
              if (p1Coord) {
                const [p1x, p1y] = p1Coord;
                // Position line halfway between this tally and next position
                const nextCoord = PLAYER1_COORDINATES[player1MarkIndex];
                if (nextCoord) {
                  const [nextX] = nextCoord;
                  const lineX = p1x + ((nextX - p1x) / 2); // Halfway between tallies
                  verticalLines.push({ x: lineX, y: p1y });
                  console.log(`Added game separator for Player 1 between positions ${player1MarkIndex - 1} and ${player1MarkIndex}, x: ${lineX}`);
                } else {
                  // If no next position, place line after current tally
                  verticalLines.push({ x: p1x + 20, y: p1y });
                }
              }
            }
            
            // For Player 2: Add line after their current position (if they have tallies)
            if (player2MarkIndex > 0) {
              const p2Coord = PLAYER2_COORDINATES[player2MarkIndex - 1];
              if (p2Coord) {
                const [p2x, p2y] = p2Coord;
                // Position line halfway between this tally and next position
                const nextCoord = PLAYER2_COORDINATES[player2MarkIndex];
                if (nextCoord) {
                  const [nextX] = nextCoord;
                  const lineX = p2x + ((nextX - p2x) / 2); // Halfway between tallies
                  verticalLines.push({ x: lineX, y: p2y });
                  console.log(`Added game separator for Player 2 between positions ${player2MarkIndex - 1} and ${player2MarkIndex}, x: ${lineX}`);
                } else {
                  // If no next position, place line after current tally
                  verticalLines.push({ x: p2x + 20, y: p2y });
                }
              }
            }
            
            gameNumber++;
          } else {
            // Regular balls get 1 tally mark
            tallies.push({ x: x + 3, y: y, symbol: slashDirection, game: gameNumber });
            console.log(`Added 1 tally for ball ${event.ballNumber} by player ${player} at position ${markIndex}, coords: ${x}, ${y}`);
            
            // Update mark index for ONLY the scoring player
            if (isPlayer1) {
              player1MarkIndex += 1; // Regular ball takes 1 position
            } else {
              player2MarkIndex += 1;
            }
          }
        } else {
          console.warn(`No coordinate available for player ${player} markIndex ${markIndex}, max is ${coordinates.length - 1}`);
        }
      }
    });

    console.log(`Final tally count: ${tallies.length}, vertical lines: ${verticalLines.length}, circles: ${circles.length}`);

    // Add target circles for both players (skill level positions)
    const SL_TARGET_POSITIONS = [1, 5, 10, 14, 19, 25, 31, 35, 38, 46, 50, 55, 60, 65, 70, 75];
    
    // Player 1 target circle
    const player1Target = getPointsToWin(match.player1SkillLevel);
    if (SL_TARGET_POSITIONS.includes(player1Target)) {
      const coordIndex = player1Target - 1;
      if (coordIndex < PLAYER1_COORDINATES.length) {
        const [x, y] = PLAYER1_COORDINATES[coordIndex];
        circles.push({ x: x + 3, y: y });
        console.log(`Added target circle for Player 1 at position ${player1Target}, coords: ${x}, ${y}`);
      }
    }
    
    // Player 2 target circle
    const player2Target = getPointsToWin(match.player2SkillLevel);
    if (SL_TARGET_POSITIONS.includes(player2Target)) {
      const coordIndex = player2Target - 1;
      if (coordIndex < PLAYER2_COORDINATES.length) {
        const [x, y] = PLAYER2_COORDINATES[coordIndex];
        circles.push({ x: x + 3, y: y });
        console.log(`Added target circle for Player 2 at position ${player2Target}, coords: ${x}, ${y}`);
      }
    }

    // Generate filename with player names and timestamp
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
    const filename = `APA-Scoresheet-${match.player1Name}-vs-${match.player2Name}-${timestamp}.pdf`;

    // Call canvas-based print function with custom filename
    await printScoresheetImageWithFilename(tallies, circles, verticalLines, filename);
    
  } catch (error) {
    console.error('Match scoresheet PDF generation failed:', error);
  }
}

// Modified version of printScoresheetImage that accepts custom filename
async function printScoresheetImageWithFilename(
  tallies: Array<{ x: number; y: number; symbol: string; game: number }>,
  circles: Array<{ x: number; y: number }>,
  verticalLines: Array<{ x: number; y: number }>,
  filename: string
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
    
    // Open PDF in new window ready for manual printing
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Open in new window ready for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>APA Scoresheet - ${filename}</title>
            <style>
              @page { size: letter landscape; margin: 0.25in; }
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              embed { width: 100%; height: 100vh; }
            </style>
          </head>
          <body>
            <embed src="${pdfUrl}" type="application/pdf" />
            <p style="position: fixed; top: 10px; left: 10px; background: rgba(0,0,0,0.7); color: white; padding: 8px; border-radius: 4px; font-size: 12px;">
              Press Ctrl+P to print this scoresheet
            </p>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      // Wait for PDF to load, then focus window for user to print manually
      setTimeout(() => {
        printWindow.focus();
        // Clean up URL after some time
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl);
        }, 60000); // Keep URL for 1 minute
      }, 1000);
    }
    
    console.log(`PDF ready for printing: ${filename}`);
    
  } catch (error) {
    console.error('PDF generation failed:', error);
  }
}

// Helper function to calculate points needed to win - using correct APA handicap values
function getPointsToWin(skillLevel: number): number {
  const targets = [14, 19, 25, 31, 38, 46, 55, 65, 75];
  return targets[skillLevel - 1] || 75;
}