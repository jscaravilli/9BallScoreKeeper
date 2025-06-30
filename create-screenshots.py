#!/usr/bin/env python3
import os
from PIL import Image

def create_pwa_screenshots():
    # Source screenshot
    source_path = "attached_assets/Screenshot_20250629_203639_Replit_1751247412738.jpg"
    
    if not os.path.exists(source_path):
        print(f"Source screenshot not found: {source_path}")
        return
    
    # Open the screenshot
    img = Image.open(source_path)
    
    # Create mobile screenshot (standard PWA format)
    # Typical mobile screenshot dimensions: 540x960 or similar aspect ratio
    mobile_width = 540
    mobile_height = 960
    
    # Manual crop to remove Replit interface
    # The app content starts around y=200 and goes to about y=900
    # and is centered horizontally
    original_width, original_height = img.size
    
    # Crop out the Replit interface (browser bar, etc.)
    # Focus on just the app content area
    app_left = 0  # Start from left edge
    app_top = 320  # Skip all browser/Replit interface completely
    app_right = original_width  # Go to right edge
    app_bottom = original_height - 320  # Crop to end at green area, remove bottom navigation
    
    crop_box = (app_left, app_top, app_right, app_bottom)
    
    # Crop and resize
    cropped = img.crop(crop_box)
    mobile_screenshot = cropped.resize((mobile_width, mobile_height), Image.Resampling.LANCZOS)
    mobile_screenshot.save("screenshot-mobile.png", "PNG", optimize=True)
    print("Created screenshot-mobile.png")
    

    
    print("PWA screenshots created successfully!")

if __name__ == "__main__":
    create_pwa_screenshots()