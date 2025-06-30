import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APA_HANDICAPS } from "@/lib/apa-handicaps";
import type { Match } from "@shared/schema";

interface PlayerSetupModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (player1Name: string, player1SkillLevel: number, player2Name: string, player2SkillLevel: number) => void;
  currentMatch?: Match | null;
}

export default function PlayerSetupModal({ open, onClose, onSave, currentMatch }: PlayerSetupModalProps) {
  const [player1Name, setPlayer1Name] = useState("");
  const [player1SkillLevel, setPlayer1SkillLevel] = useState(5);
  const [player2Name, setPlayer2Name] = useState("");
  const [player2SkillLevel, setPlayer2SkillLevel] = useState(5);

  useEffect(() => {
    if (currentMatch) {
      setPlayer1Name(currentMatch.player1Name);
      setPlayer1SkillLevel(currentMatch.player1SkillLevel);
      setPlayer2Name(currentMatch.player2Name);
      setPlayer2SkillLevel(currentMatch.player2SkillLevel);
    }
  }, [currentMatch]);

  const handleSave = () => {
    if (player1Name.trim() && player2Name.trim()) {
      onSave(player1Name.trim(), player1SkillLevel, player2Name.trim(), player2SkillLevel);
    }
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>Joseph's Unofficial APA 9 Ball Scorekeeper</DialogTitle>
          <DialogDescription>
            Set up player names and APA skill levels to start tracking your 9-ball match.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Player 1 Setup */}
          <div>
            <Label htmlFor="player1Name">Player 1 Name (Lag Winner)</Label>
            <Input
              id="player1Name"
              value={player1Name}
              onChange={(e) => setPlayer1Name(e.target.value)}
              placeholder="Enter name"
              className="mt-1"
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
            <Label htmlFor="player2Name">Player 2 Name</Label>
            <Input
              id="player2Name"
              value={player2Name}
              onChange={(e) => setPlayer2Name(e.target.value)}
              placeholder="Enter name"
              className="mt-1"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
