import scoresheetPng from "@assets/9B Blank-0_1751450594313.png";

export default function ScoresheetTest() {
  return (
    <div className="scoresheet-container w-full max-w-4xl mx-auto bg-white" style={{ 
      printColorAdjust: 'exact',
      WebkitPrintColorAdjust: 'exact'
    }}>
      <div className="scoresheet-content relative" style={{ 
        width: '3300px', 
        height: '2550px',
        transform: 'scale(0.62)',
        transformOrigin: 'top left',
        overflow: 'hidden',
        border: '2px solid red' // Test border to see exact bounds
      }}>
        {/* Background scoresheet image */}
        <img 
          src={scoresheetPng} 
          alt="APA Scoresheet"
          className="absolute inset-0"
          style={{ 
            width: '3300px', 
            height: '2550px',
            objectFit: 'fill'
          }}
        />
        
        {/* Test markup at various positions */}
        <div className="absolute inset-0">
          {/* Corner markers */}
          <div style={{ position: 'absolute', top: '0px', left: '0px', width: '50px', height: '50px', backgroundColor: 'red', opacity: 0.7 }}>TL</div>
          <div style={{ position: 'absolute', top: '0px', right: '0px', width: '50px', height: '50px', backgroundColor: 'blue', opacity: 0.7 }}>TR</div>
          <div style={{ position: 'absolute', bottom: '0px', left: '0px', width: '50px', height: '50px', backgroundColor: 'green', opacity: 0.7 }}>BL</div>
          <div style={{ position: 'absolute', bottom: '0px', right: '0px', width: '50px', height: '50px', backgroundColor: 'purple', opacity: 0.7 }}>BR</div>
          
          {/* Center marker */}
          <div style={{ position: 'absolute', top: '1275px', left: '1650px', width: '100px', height: '100px', backgroundColor: 'orange', opacity: 0.7, transform: 'translate(-50%, -50%)' }}>CENTER</div>
          
          {/* Edge test markers */}
          <div style={{ position: 'absolute', top: '149px', left: '255px', fontSize: '48px', color: 'red', fontWeight: 'bold' }}>TEST/</div>
          <div style={{ position: 'absolute', top: '149px', left: '3290px', fontSize: '48px', color: 'red', fontWeight: 'bold' }}>EDGE</div>
          <div style={{ position: 'absolute', top: '2540px', left: '1650px', fontSize: '48px', color: 'red', fontWeight: 'bold' }}>BOTTOM</div>
          
          {/* Dimension display */}
          <div style={{ position: 'absolute', top: '100px', left: '100px', backgroundColor: 'white', padding: '10px', border: '1px solid black' }}>
            <div>Container: 3300px × 2550px</div>
            <div>Scale: 0.62 (screen) / 0.73 (print)</div>
            <div>Effective: {Math.round(3300 * 0.62)}px × {Math.round(2550 * 0.62)}px (screen)</div>
            <div>Print: {Math.round(3300 * 0.73)}px × {Math.round(2550 * 0.73)}px</div>
          </div>
        </div>
      </div>
    </div>
  );
}