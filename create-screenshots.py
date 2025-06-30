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
    
    # Calculate crop area to maintain aspect ratio
    original_width, original_height = img.size
    aspect_ratio = mobile_width / mobile_height
    
    if original_width / original_height > aspect_ratio:
        # Image is wider, crop width
        new_width = int(original_height * aspect_ratio)
        left = (original_width - new_width) // 2
        crop_box = (left, 0, left + new_width, original_height)
    else:
        # Image is taller, crop height
        new_height = int(original_width / aspect_ratio)
        top = (original_height - new_height) // 2
        crop_box = (0, top, original_width, top + new_height)
    
    # Crop and resize
    cropped = img.crop(crop_box)
    mobile_screenshot = cropped.resize((mobile_width, mobile_height), Image.Resampling.LANCZOS)
    mobile_screenshot.save("screenshot-mobile.png", "PNG", optimize=True)
    print("Created screenshot-mobile.png")
    
    # Create desktop screenshot (wider format)
    desktop_width = 1280
    desktop_height = 800
    
    # For desktop, we'll use a different approach - pad the mobile screenshot
    desktop_screenshot = Image.new("RGB", (desktop_width, desktop_height), "#1a4b3a")
    
    # Scale mobile screenshot to fit desktop height
    scale_factor = desktop_height / mobile_height
    scaled_mobile_width = int(mobile_width * scale_factor)
    scaled_mobile = mobile_screenshot.resize((scaled_mobile_width, desktop_height), Image.Resampling.LANCZOS)
    
    # Center the mobile screenshot on desktop canvas
    x_offset = (desktop_width - scaled_mobile_width) // 2
    desktop_screenshot.paste(scaled_mobile, (x_offset, 0))
    desktop_screenshot.save("screenshot-desktop.png", "PNG", optimize=True)
    print("Created screenshot-desktop.png")
    
    print("PWA screenshots created successfully!")

if __name__ == "__main__":
    create_pwa_screenshots()