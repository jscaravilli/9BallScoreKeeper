import { Button } from "@/components/ui/button";
import { printScoresheetImage } from "@/lib/pdfGenerator";

export default function PDFTest() {
  const handleTestPDF = async () => {
    // Sample test data
    const tallies = [
      { x: 258, y: 149, symbol: '/', game: 1 },
      { x: 286, y: 149, symbol: '/', game: 1 },
      { x: 313, y: 149, symbol: '/', game: 1 },
      { x: 344, y: 149, symbol: '/', game: 1 },
      { x: 376, y: 149, symbol: '/', game: 1 },
      // 9-ball (2 tallies)
      { x: 414, y: 149, symbol: '/', game: 1 },
      { x: 414, y: 149, symbol: '/', game: 1 },
    ];
    
    const circles: Array<{ x: number; y: number }> = [];
    const verticalLines: Array<{ x: number; y: number }> = [];

    await printScoresheetImage(tallies, circles, verticalLines);
  };

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">PDF Generation Test</h1>
      <p>Click the button below to test automatic PDF generation with sample markup:</p>
      
      <Button onClick={handleTestPDF} className="bg-blue-600 hover:bg-blue-700">
        Generate Test PDF
      </Button>
      
      <div className="text-sm text-gray-600">
        <p>This test will:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Render the scoresheet PNG to canvas</li>
          <li>Add 7 sample tally marks (5 single + 1 double for 9-ball)</li>
          <li>Convert to single-page letter-size PDF</li>
          <li>Automatically download the PDF file</li>
        </ul>
      </div>
    </div>
  );
}