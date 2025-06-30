#!/usr/bin/env python3
import os
from PIL import Image

# Convert the 9-ball image to proper PWA icon sizes
def create_pwa_icons():
    # Open the source image
    source_path = "attached_assets/360_F_164815013_dTTCrIEDJtEUsssQKo6p6SqdFnI8zPoT_1751146723688.jpg"
    
    if not os.path.exists(source_path):
        print(f"Source image not found: {source_path}")
        return
    
    # Open and convert to RGBA for transparency support
    img = Image.open(source_path)
    img = img.convert("RGBA")
    
    # Create 192x192 icon
    icon_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
    icon_192.save("icon-192.png", "PNG", optimize=True)
    print("Created icon-192.png")
    
    # Create 512x512 icon
    icon_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
    icon_512.save("icon-512.png", "PNG", optimize=True)
    print("Created icon-512.png")
    
    print("PWA icons updated successfully!")

if __name__ == "__main__":
    create_pwa_icons()