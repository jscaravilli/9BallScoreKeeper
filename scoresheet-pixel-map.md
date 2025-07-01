# APA Scoresheet Pixel Mapping Reference

## Overall Dimensions
- Width: 11 inches (landscape)
- Height: 8.5 inches (landscape)
- At 96 DPI: 1056px × 816px

## Top Rectangle Section - Player Data

### Player Names
```
Player 1: top: 136px, left: 125px
Player 2: top: 170px, left: 125px
```

### Skill Levels
```
Player 1 SL: top: 136px, left: 619px, width: 24px
Player 2 SL: top: 170px, left: 619px, width: 24px
```

### Score Grid Starting Position
```
Player 1 Row: top: 136px, left: 315px
Player 2 Row: top: 170px, left: 315px
Cell Width: 21.8px spacing
```

### Right Side Columns
```
Defensive Shots:
  Player 1: top: 136px, left: 645px, width: 48px
  Player 2: top: 170px, left: 645px, width: 48px

Total Points:
  Player 1: top: 136px, left: 709px, width: 38px
  Player 2: top: 170px, left: 709px, width: 38px

Match Points Earned:
  Player 1: top: 136px, left: 772px, width: 38px
  Player 2: top: 170px, left: 772px, width: 38px

Running Total:
  Player 1: top: 136px, left: 834px, width: 38px
  Player 2: top: 170px, left: 834px, width: 38px
```

## Score Grid Positions (Relative to baseX: 315px)

### Numbers (get circles):
```
Score 1:  position 0    = 315px
Score 5:  position 1    = 336.8px
Score 10: position 2    = 358.6px
Score 14: position 3    = 380.4px
Score 19: position 4    = 402.2px
Score 25: position 5    = 424px
Score 31: position 6    = 445.8px
Score 35: position 7    = 467.6px
Score 38: position 8    = 489.4px
Score 46: position 9    = 511.2px
Score 50: position 10   = 533px
Score 55: position 11   = 554.8px
Score 60: position 12   = 576.6px
Score 65: position 13   = 598.4px
Score 70: position 14   = 620.2px
Score 75: position 15   = 642px
```

### Dots (get slashes):
```
Scores 2-4:   position 0.5  = 325.9px
Scores 6-9:   position 1.5  = 347.7px
Scores 11-13: position 2.5  = 369.5px
Scores 15-18: position 3.5  = 391.3px
Scores 20-24: position 4.5  = 413.1px
Scores 26-30: position 5.5  = 434.9px
Scores 32-34: position 6.5  = 456.7px
Scores 36-37: position 7.5  = 478.5px
Scores 39-45: position 8.5  = 500.3px
Scores 47-49: position 9.5  = 522.1px
Scores 51-54: position 10.5 = 543.9px
Scores 56-59: position 11.5 = 565.7px
Scores 61-64: position 12.5 = 587.5px
Scores 66-69: position 13.5 = 609.3px
Scores 71-74: position 14.5 = 631.1px
```

## Match Information

### Times
```
Start Time: top: 43px, right: 144px
End Time:   top: 43px, right: 38px
```

### Table Type
```
4x8 Regulation Checkbox: bottom: 56px, left: 691px
```

## Future Expansion Areas

### Dead Balls
```
Player 1 Dead Balls: top: 152px, left: 280px
Player 2 Dead Balls: top: 186px, left: 280px
```

### Innings Display
```
Innings Counter: top: 118px, left: 450px
```

## Visual Layout
```
┌─────────────────────────────────────────────────────────┐
│  Match Info                              Start | End    │ 43px
│                                                         │
│                                                         │
│  ┌─ Player Names ──────────────────────────────────┐    │
│  │ Player 1 Name    SL  [Score Grid...] DS TP MP RT│    │ 136px
│  │ Player 2 Name    SL  [Score Grid...] DS TP MP RT│    │ 170px
│  └─────────────────────────────────────────────────┘    │
│    125px           619px 315px→      645px→             │
│                                                         │
│                                                         │
│                                        [4x8 Reg ✓]     │ bottom: 56px
└─────────────────────────────────────────────────────────┘
                                      691px
```