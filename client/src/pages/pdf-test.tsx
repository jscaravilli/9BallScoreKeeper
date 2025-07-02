import { Button } from "@/components/ui/button";
import { printScoresheetImage } from "@/lib/pdfGenerator";

export default function PDFTest() {
  const handleTestPDF = async () => {
    // Sample test data with both players
    const tallies = [
      // Player 1 tallies (top row, y=149)
      { x: 258, y: 149, symbol: '/', game: 1 },
      { x: 286, y: 149, symbol: '/', game: 1 },
      { x: 313, y: 149, symbol: '/', game: 1 },
      { x: 344, y: 149, symbol: '/', game: 1 },
      { x: 376, y: 149, symbol: '/', game: 1 },
      // 9-ball (2 tallies)
      { x: 414, y: 149, symbol: '/', game: 1 },
      { x: 414, y: 149, symbol: '/', game: 1 },
      
      // Player 2 tallies (bottom row, y=511)
      { x: 255, y: 511, symbol: '/', game: 1 },
      { x: 283, y: 511, symbol: '/', game: 1 },
      { x: 310, y: 511, symbol: '/', game: 1 },
      { x: 341, y: 511, symbol: '/', game: 1 },
    ];
    
    // Sample target circles for skill levels 3 and 5
    const circles: Array<{ x: number; y: number }> = [
      { x: 313, y: 149 }, // Player 1 skill level target
      { x: 311, y: 511 }, // Player 2 skill level target
    ];
    
    const verticalLines: Array<{ x: number; y: number }> = [
      { x: 425, y: 149 }, // Game separator for Player 1 between positions (not covering tallies)
      { x: 367, y: 511 }, // Game separator for Player 2 between positions (not covering tallies)
    ];

    await printScoresheetImage(tallies, circles, verticalLines);
  };

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">PDF Generation Test</h1>
      <p>Click the button below to test automatic PDF generation with sample markup:</p>
      
      <Button onClick={handleTestPDF} className="bg-blue-600 hover:bg-blue-700">
        Generate Test PDF (Print)
      </Button>
      
      <div className="text-sm text-gray-600">
        <p>This test will:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Render the scoresheet PNG to canvas</li>
          <li>Add sample tallies for both Player 1 (7 marks) and Player 2 (4 marks)</li>
          <li>Include target circles for both players' skill levels</li>
          <li>Add game separator vertical line</li>
          <li>Convert to single-page letter-size PDF</li>
          <li>Open PDF in new window ready for manual printing (Ctrl+P)</li>
        </ul>
      </div>
    </div>
  );
}