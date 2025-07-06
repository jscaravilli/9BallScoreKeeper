import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Popular billiards cloth colors
export const BILLIARDS_COLORS = [
  {
    name: "Championship Green",
    value: "#0F4A3C",
    description: "Classic tournament green"
  },
  {
    name: "Tournament Blue", 
    value: "#1E3A8A",
    description: "Professional tournament blue"
  },
  {
    name: "Burgundy Red",
    value: "#7C2D12", 
    description: "Rich burgundy cloth"
  },
  {
    name: "Camel Tan",
    value: "#A16207",
    description: "Vintage camel brown"
  },
  {
    name: "Electric Blue",
    value: "#1D4ED8",
    description: "Modern electric blue"
  },
  {
    name: "Championship Purple",
    value: "#6B21A8",
    description: "Premium purple cloth"
  }
] as const;

export type BilliardsColor = typeof BILLIARDS_COLORS[number]['value'];

// Color Swatch Preview Component
export default function BilliardsColorSwatch() {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Billiards Cloth Color Options</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {BILLIARDS_COLORS.map((color, index) => (
            <div 
              key={color.value}
              className="relative rounded-lg border-2 border-gray-300 overflow-hidden"
            >
              {/* Color Background */}
              <div 
                className="h-24 w-full relative"
                style={{ backgroundColor: color.value }}
              >
                {/* Sample Score Display */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/90 dark:bg-black/80 rounded-lg px-3 py-2 text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">12</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">Score</div>
                  </div>
                </div>
                
                {/* Default Labels */}
                {index === 0 && (
                  <div className="absolute top-1 left-1">
                    <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">
                      Player 1 Default
                    </span>
                  </div>
                )}
                {index === 1 && (
                  <div className="absolute top-1 left-1">
                    <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                      Player 2 Default
                    </span>
                  </div>
                )}
              </div>
              
              {/* Color Info */}
              <div className="p-3 bg-white dark:bg-gray-800">
                <h3 className="font-semibold text-sm">{color.name}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">{color.description}</p>
                <p className="text-xs font-mono text-gray-500 mt-1">{color.value}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h4 className="font-semibold mb-2">How it works:</h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Each player selects their preferred background color during setup</li>
            <li>• The scoring area background changes to the active player's color</li>
            <li>• Defaults: Player 1 = Championship Green, Player 2 = Tournament Blue</li>
            <li>• Colors reset to defaults for each new match</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}