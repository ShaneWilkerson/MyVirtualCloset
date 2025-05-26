from PIL import Image
import sys
import os
import json

def normalize_image(input_path, output_size=512):
    image = Image.open(input_path).convert("RGBA")
    bbox = image.getbbox()  # Crop to non-transparent content

    if not bbox:
        raise Exception("No visible content to crop")

    cropped = image.crop(bbox)

    # Resize while maintaining aspect ratio
    cropped.thumbnail((output_size, output_size), Image.LANCZOS)

    # Create square canvas and center image
    final = Image.new("RGBA", (output_size, output_size), (255, 255, 255, 0))
    offset = (
        (output_size - cropped.width) // 2,
        (output_size - cropped.height) // 2
    )
    final.paste(cropped, offset, cropped)

    # Save to normalized folder
    output_path = input_path.replace("outputs", "normalized").rsplit(".", 1)[0] + "_norm.png"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    final.save(output_path)

    print(json.dumps({ "normalized_path": output_path }))

if __name__ == "__main__":
    try:
        normalize_image(sys.argv[1])
    except Exception as e:
        print(json.dumps({ "error": str(e) }))
