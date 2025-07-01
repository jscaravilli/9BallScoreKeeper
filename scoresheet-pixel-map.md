# APA Scoresheet Scoring Area Pixel Map

## Focus Area: Scoring Grid Only
Based on user markup showing blue dots at key positions for tally placement.

## Key Observations from Markup
- Top player is lag winner (Player 1)
- Blue dots indicate precise tally positions
- Score grid spans from 1 to 75
- Numbers get circles, intermediate scores get slash marks
- Two distinct rows for Player 1 (top) and Player 2 (bottom)

## Score Grid Measurements
From the marked-up images, analyzing the scoring area rectangle:

### Grid Boundaries
```
Left edge of score grid: ~85px from image left
Right edge of score grid: ~815px from image left
Grid width: ~730px
Number of columns: 16 (from 1 to 75)
Column width: ~45.6px (730px ÷ 16 columns)
```

### Row Positions
```
Player 1 (Lag Winner - Top): ~35px from image top
Player 2 (Bottom): ~80px from image top
Row height: ~45px between rows
```

### Tally Positions (Extrapolated from Blue Dots)
Based on the pattern in the markup, here are the precise X positions for each score:

#### Number Positions (Get Circles)
```
Score 1:  85px   (column 0)
Score 5:  130px  (column 1) 
Score 10: 176px  (column 2)
Score 14: 222px  (column 3)
Score 19: 268px  (column 4)
Score 25: 314px  (column 5)
Score 31: 360px  (column 6)
Score 35: 406px  (column 7)
Score 38: 452px  (column 8)
Score 46: 498px  (column 9)
Score 50: 544px  (column 10)
Score 55: 590px  (column 11)
Score 60: 636px  (column 12)
Score 65: 682px  (column 13)
Score 70: 728px  (column 14)
Score 75: 774px  (column 15)
```

#### Dot Positions (Get Slash Marks)
```
Scores 2-4:   107px  (between columns 0-1)
Scores 6-9:   153px  (between columns 1-2)
Scores 11-13: 199px  (between columns 2-3)
Scores 15-18: 245px  (between columns 3-4)
Scores 20-24: 291px  (between columns 4-5)
Scores 26-30: 337px  (between columns 5-6)
Scores 32-34: 383px  (between columns 6-7)
Scores 36-37: 429px  (between columns 7-8)
Scores 39-45: 475px  (between columns 8-9)
Scores 47-49: 521px  (between columns 9-10)
Scores 51-54: 567px  (between columns 10-11)
Scores 56-59: 613px  (between columns 11-12)
Scores 61-64: 659px  (between columns 12-13)
Scores 66-69: 705px  (between columns 13-14)
Scores 71-74: 751px  (between columns 14-15)
```

### Right Side Columns (From Blue Dots)
```
Defensive Shots: ~820px
Total Points: ~860px
Match Points: ~900px
Running Total: ~940px
```

## Implementation for Overlay
This focused map covers only the essential scoring area that will be overlaid onto the larger PNG scoresheet image. The coordinates are relative to the scoring rectangle crop shown in the markup images.