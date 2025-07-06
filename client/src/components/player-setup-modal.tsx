import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APA_HANDICAPS } from "@/lib/apa-handicaps";
import { BILLIARDS_COLORS, DEFAULT_PLAYER_COLORS } from "@/components/billiards-color-swatch";
import { History, Palette } from "lucide-react";
import type { Match } from "@shared/schema";

interface PlayerSetupModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (player1Name: string, player1SkillLevel: number, player2Name: string, player2SkillLevel: number, player1Color: string, player2Color: string) => void;
  currentMatch?: Match | null;
  onShowHistory?: () => void;
}

export default function PlayerSetupModal({ open, onClose, onSave, currentMatch, onShowHistory }: PlayerSetupModalProps) {
  const [player1Name, setPlayer1Name] = useState("");
  const [player1SkillLevel, setPlayer1SkillLevel] = useState(5);
  const [player1Color, setPlayer1Color] = useState<string>(DEFAULT_PLAYER_COLORS.player1);
  const [player2Name, setPlayer2Name] = useState("");
  const [player2SkillLevel, setPlayer2SkillLevel] = useState(5);
  const [player2Color, setPlayer2Color] = useState<string>(DEFAULT_PLAYER_COLORS.player2);

  useEffect(() => {
    // Only populate form if it's a fresh modal open with existing match data
    // This prevents auto-refreshing during user input
    if (currentMatch && open && !player1Name && !player2Name) {
      setPlayer1Name(currentMatch.player1Name.slice(0, 20));
      setPlayer1SkillLevel(currentMatch.player1SkillLevel);
      setPlayer1Color(currentMatch.player1Color || DEFAULT_PLAYER_COLORS.player1);
      setPlayer2Name(currentMatch.player2Name.slice(0, 20));
      setPlayer2SkillLevel(currentMatch.player2SkillLevel);
      setPlayer2Color(currentMatch.player2Color || DEFAULT_PLAYER_COLORS.player2);
    }
  }, [currentMatch, open]); // Only trigger on modal open, not on every currentMatch change

  const handleSave = () => {
    if (player1Name.trim() && player2Name.trim()) {
      onSave(player1Name.trim().slice(0, 20), player1SkillLevel, player2Name.trim().slice(0, 20), player2SkillLevel, player1Color, player2Color);
    }
  };

  // Prevent closing modal unless form is complete
  const handleOpenChange = (open: boolean) => {
    // Only allow closing if both names are filled AND we're trying to close
    if (!open && player1Name.trim() && player2Name.trim()) {
      onClose();
    }
    // If trying to close but form is incomplete, do nothing (prevents dismissal)
  };

  const handleReset = () => {
    setPlayer1Name("");
    setPlayer1SkillLevel(5);
    setPlayer2Name("");
    setPlayer2SkillLevel(5);
  };

  const skillLevelOptions = Object.entries(APA_HANDICAPS).map(([level, points]) => ({
    value: level,
    label: `${level} (${points} points to win)`,
  }));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm mx-auto [&>button]:hidden">
        <DialogHeader>
          <DialogTitle>Joseph's Unofficial APA 9 Ball Scorekeeper</DialogTitle>
          <DialogDescription>
            Set up player names and APA skill levels to start tracking your 9-ball match.
            <span className="block mt-2 text-sm font-medium text-orange-600">
              Both player names are required to continue.
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Player 1 Setup */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="player1Name">Player 1 Name (Lag Winner)</Label>
              <Select value={player1Color} onValueChange={setPlayer1Color}>
                <SelectTrigger className="w-10 h-8 p-1">
                  <div 
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: player1Color }}
                  />
                </SelectTrigger>
                <SelectContent>
                  {BILLIARDS_COLORS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: color.value }}
                        />
                        {color.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              id="player1Name"
              value={player1Name}
              onChange={(e) => setPlayer1Name(e.target.value.slice(0, 20))}
              placeholder="Enter name"
              maxLength={20}
              className={`${!player1Name.trim() ? 'border-orange-300 focus:border-orange-500' : 'border-green-300 focus:border-green-500'}`}
            />
          </div>
          
          <div>
            <Label htmlFor="player1Skill">Skill Level</Label>
            <Select value={player1SkillLevel.toString()} onValueChange={(value) => setPlayer1SkillLevel(parseInt(value))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {skillLevelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>



          {/* Player 2 Setup */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="player2Name">Player 2 Name</Label>
              <Select value={player2Color} onValueChange={setPlayer2Color}>
                <SelectTrigger className="w-10 h-8 p-1">
                  <div 
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: player2Color }}
                  />
                </SelectTrigger>
                <SelectContent>
                  {BILLIARDS_COLORS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: color.value }}
                        />
                        {color.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              id="player2Name"
              value={player2Name}
              onChange={(e) => setPlayer2Name(e.target.value.slice(0, 20))}
              placeholder="Enter name"
              maxLength={20}
              className={`${!player2Name.trim() ? 'border-orange-300 focus:border-orange-500' : 'border-green-300 focus:border-green-500'}`}
            />
          </div>
          
          <div>
            <Label htmlFor="player2Skill">Skill Level</Label>
            <Select value={player2SkillLevel.toString()} onValueChange={(value) => setPlayer2SkillLevel(parseInt(value))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {skillLevelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>



          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button variant="outline" onClick={handleReset}>
              Reset Form
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!player1Name.trim() || !player2Name.trim()}
              className="pool-green text-white hover:pool-felt"
            >
              Save
            </Button>
          </div>

          {/* Match History Access */}
          {onShowHistory && (
            <div className="pt-4 border-t border-gray-200">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-gray-600 hover:text-gray-800"
                onClick={onShowHistory}
              >
                <History className="h-4 w-4 mr-2" />
                View Match History
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
