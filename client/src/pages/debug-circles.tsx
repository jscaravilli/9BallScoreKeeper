import { APA_HANDICAPS } from "@/lib/apa-handicaps";
import type { ApaSkillLevel } from "@shared/schema";

export default function DebugCircles() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">APA Skill Level Debug</h1>
      
      <div className="grid grid-cols-1 gap-4">
        {(Object.entries(APA_HANDICAPS) as [string, number][]).map(([skillLevel, target]) => {
          const coordIndex = target - 1;
          return (
            <div key={skillLevel} className="border p-4 rounded">
              <h3 className="font-semibold">Skill Level {skillLevel}</h3>
              <p>Target Points: {target}</p>
              <p>Coordinate Index: {coordIndex} (should be position {target})</p>
              <p>Circle should appear at position: {target}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}