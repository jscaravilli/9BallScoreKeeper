from PIL import Image, ImageDraw, ImageFont, ImageFilter
import random
import math

# Create a sample showing cloth texture with player colors
def create_noise_texture(width, height, intensity=0.02):
    """Create a subtle noise texture to simulate cloth fibers"""
    noise = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    pixels = noise.load()
    
    for x in range(width):
        for y in range(height):
            # Random noise for cloth texture
            noise_value = random.randint(-int(255 * intensity), int(255 * intensity))
            alpha = min(255, max(0, 30 + noise_value))
            pixels[x, y] = (255, 255, 255, alpha)
    
    return noise

def create_weave_pattern(width, height, scale=4):
    """Create a subtle weave pattern"""
    pattern = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(pattern)
    
    for x in range(0, width, scale):
        for y in range(0, height, scale):
            # Alternating weave pattern
            if (x // scale + y // scale) % 2 == 0:
                alpha = 15
            else:
                alpha = 8
            
            draw.rectangle([x, y, x + scale, y + scale], 
                         fill=(0, 0, 0, alpha))
    
    return pattern

# Sample colors
colors = [
    {"name": "Championship Green", "hex": "#0F4A3C", "player": "Player 1"},
    {"name": "Electric Blue", "hex": "#3B82F6", "player": "Player 2"},
]

# Image dimensions
sample_width = 600
sample_height = 400
margin = 20

img = Image.new('RGB', (sample_width, sample_height), '#f8f9fa')
draw = ImageDraw.Draw(img)

# Load fonts
try:
    title_font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 20)
    name_font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 14)
    desc_font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 11)
except:
    try:
        title_font = ImageFont.truetype("arial.ttf", 20)
        name_font = ImageFont.truetype("arial.ttf", 14)
        desc_font = ImageFont.truetype("arial.ttf", 11)
    except:
        title_font = ImageFont.load_default()
        name_font = ImageFont.load_default()
        desc_font = ImageFont.load_default()

# Title
title = "Billiards Cloth Texture Sample"
title_bbox = draw.textbbox((0, 0), title, font=title_font)
title_width = title_bbox[2] - title_bbox[0]
draw.text(((sample_width - title_width) // 2, 15), title, fill='#1f2937', font=title_font)

# Create two sample areas side by side
area_width = (sample_width - 3 * margin) // 2
area_height = 200
start_y = 60

for i, color in enumerate(colors):
    x = margin + i * (area_width + margin)
    y = start_y
    
    # Create base color background
    base_color = tuple(int(color['hex'][j:j+2], 16) for j in (1, 3, 5))
    
    # Create the colored background
    color_img = Image.new('RGB', (area_width, area_height), base_color)
    
    # Add cloth texture layers
    # 1. Weave pattern
    weave = create_weave_pattern(area_width, area_height, scale=3)
    color_img.paste(weave, (0, 0), weave)
    
    # 2. Fiber noise texture
    noise = create_noise_texture(area_width, area_height, intensity=0.015)
    color_img.paste(noise, (0, 0), noise)
    
    # 3. Subtle directional lines for fabric grain
    grain = Image.new('RGBA', (area_width, area_height), (0, 0, 0, 0))
    grain_draw = ImageDraw.Draw(grain)
    
    for line_y in range(0, area_height, 6):
        # Slight variations in line opacity
        alpha = random.randint(5, 15)
        grain_draw.line([(0, line_y), (area_width, line_y)], 
                       fill=(255, 255, 255, alpha), width=1)
    
    for line_x in range(0, area_width, 8):
        alpha = random.randint(3, 12)
        grain_draw.line([(line_x, 0), (line_x, area_height)], 
                       fill=(0, 0, 0, alpha), width=1)
    
    color_img.paste(grain, (0, 0), grain)
    
    # Paste the textured area onto main image
    img.paste(color_img, (x, y))
    
    # Add border
    draw.rectangle([x, y, x + area_width, y + area_height], 
                   outline='#d1d5db', width=2)
    
    # Add score overlay to show how it looks in context
    score_width = 80
    score_height = 50
    score_x = x + (area_width - score_width) // 2
    score_y = y + (area_height - score_height) // 2
    
    # Semi-transparent white background for score
    score_overlay = Image.new('RGBA', (score_width, score_height), (255, 255, 255, 220))
    img.paste(score_overlay, (score_x, score_y), score_overlay)
    
    # Score text
    draw.text((score_x + 35, score_y + 10), "15", fill='#1f2937', font=title_font)
    draw.text((score_x + 28, score_y + 32), "Score", fill='#6b7280', font=desc_font)
    
    # Label below
    label_y = y + area_height + 10
    draw.text((x, label_y), f"{color['name']}", fill='#1f2937', font=name_font)
    draw.text((x, label_y + 18), f"{color['player']} Background", fill='#6b7280', font=desc_font)
    draw.text((x, label_y + 32), f"{color['hex']}", fill='#9ca3af', font=desc_font)

# Add description
desc_y = start_y + area_height + 80
description = [
    "Cloth Texture Features:",
    "• Subtle weave pattern simulating billiards felt",
    "• Random fiber noise for authentic texture",
    "• Directional grain lines for fabric appearance",
    "• Low opacity overlays preserve color visibility"
]

for i, line in enumerate(description):
    font = name_font if i == 0 else desc_font
    color = '#1f2937' if i == 0 else '#6b7280'
    draw.text((margin, desc_y + i * 16), line, fill=color, font=font)

# Save the image
img.save('cloth_texture_sample.png', 'PNG', quality=95)
print("Cloth texture sample saved as 'cloth_texture_sample.png'")