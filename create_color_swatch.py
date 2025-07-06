from PIL import Image, ImageDraw, ImageFont
import os

# Billiards cloth colors
colors = [
    {"name": "Championship Green", "hex": "#0F4A3C", "desc": "Classic tournament green", "default": "Player 1 Default"},
    {"name": "Tournament Blue", "hex": "#1E3A8A", "desc": "Professional tournament blue", "default": "Player 2 Default"},
    {"name": "Deep Burgundy", "hex": "#5B1A1A", "desc": "Rich deep burgundy cloth", "default": ""},
    {"name": "Championship Black", "hex": "#1F1F1F", "desc": "Premium black cloth", "default": ""},
    {"name": "Electric Blue", "hex": "#1D4ED8", "desc": "Modern electric blue", "default": ""},
    {"name": "Charcoal Gray", "hex": "#374151", "desc": "Professional charcoal gray", "default": ""}
]

# Image dimensions
card_width = 200
card_height = 160
margin = 20
cols = 3
rows = 2

img_width = cols * card_width + (cols + 1) * margin
img_height = rows * card_height + (rows + 1) * margin + 100  # Extra space for title

# Create image
img = Image.new('RGB', (img_width, img_height), '#f8f9fa')
draw = ImageDraw.Draw(img)

# Try to use a system font, fallback to default
try:
    title_font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 24)
    name_font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 14)
    desc_font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 10)
    hex_font = ImageFont.truetype("/System/Library/Fonts/Courier.ttf", 9)
except:
    try:
        title_font = ImageFont.truetype("arial.ttf", 24)
        name_font = ImageFont.truetype("arial.ttf", 14)
        desc_font = ImageFont.truetype("arial.ttf", 10)
        hex_font = ImageFont.truetype("courier.ttf", 9)
    except:
        title_font = ImageFont.load_default()
        name_font = ImageFont.load_default()
        desc_font = ImageFont.load_default()
        hex_font = ImageFont.load_default()

# Draw title
title = "Billiards Cloth Color Options"
title_bbox = draw.textbbox((0, 0), title, font=title_font)
title_width = title_bbox[2] - title_bbox[0]
draw.text(((img_width - title_width) // 2, 20), title, fill='#1f2937', font=title_font)

# Draw color cards
for i, color in enumerate(colors):
    row = i // cols
    col = i % cols
    
    x = margin + col * (card_width + margin)
    y = 70 + margin + row * (card_height + margin)
    
    # Color rectangle (top half)
    color_height = 80
    draw.rectangle([x, y, x + card_width, y + color_height], fill=color['hex'], outline='#d1d5db', width=2)
    
    # Score overlay (simulating game display)
    score_box_width = 60
    score_box_height = 40
    score_x = x + (card_width - score_box_width) // 2
    score_y = y + (color_height - score_box_height) // 2
    
    # Semi-transparent white background for score
    score_overlay = Image.new('RGBA', (score_box_width, score_box_height), (255, 255, 255, 230))
    img.paste(score_overlay, (score_x, score_y), score_overlay)
    
    # Score text
    draw.text((score_x + 25, score_y + 8), "12", fill='#1f2937', font=name_font)
    draw.text((score_x + 18, score_y + 25), "Score", fill='#6b7280', font=desc_font)
    
    # Default label
    if color['default']:
        label_color = '#22c55e' if 'Player 1' in color['default'] else '#3b82f6'
        draw.rectangle([x + 5, y + 5, x + 85, y + 20], fill=label_color)
        draw.text((x + 8, y + 8), color['default'], fill='white', font=desc_font)
    
    # Info section (bottom half)
    info_y = y + color_height
    draw.rectangle([x, info_y, x + card_width, y + card_height], fill='white', outline='#d1d5db', width=2)
    
    # Color name
    draw.text((x + 8, info_y + 8), color['name'], fill='#1f2937', font=name_font)
    
    # Description
    draw.text((x + 8, info_y + 28), color['desc'], fill='#6b7280', font=desc_font)
    
    # Hex code
    draw.text((x + 8, info_y + 45), color['hex'], fill='#9ca3af', font=hex_font)

# Draw explanation box
exp_y = img_height - 80
draw.rectangle([margin, exp_y, img_width - margin, img_height - margin], fill='#f3f4f6', outline='#d1d5db', width=1)

# Explanation text
exp_text = [
    "How it works:",
    "• Each player selects their preferred background color during setup",
    "• The scoring area background changes to the active player's color", 
    "• Colors reset to defaults for each new match"
]

for i, line in enumerate(exp_text):
    font = name_font if i == 0 else desc_font
    color = '#1f2937' if i == 0 else '#6b7280'
    draw.text((margin + 10, exp_y + 8 + i * 15), line, fill=color, font=font)

# Save the image
img.save('billiards_color_swatch.png', 'PNG', quality=95)
print("Color swatch saved as 'billiards_color_swatch.png'")