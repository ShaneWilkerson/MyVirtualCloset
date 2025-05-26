from rembg import remove
from PIL import Image
import sys
import os
import json
import base64
from io import BytesIO

def main(input_path):
    output_path = input_path.replace("uploads", "outputs").rsplit(".", 1)[0] + "_bg_removed.png"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    input_image = Image.open(input_path).convert("RGBA")
    output_image = remove(input_image)
    output_image.save(output_path)

    buffered = BytesIO()
    output_image.save(buffered, format="PNG")
    encoded_image = base64.b64encode(buffered.getvalue()).decode("utf-8")

    print(json.dumps({
        "output_path": output_path,        
        "base64_image": encoded_image
    }))

if __name__ == "__main__":
    try:
        main(sys.argv[1])
    except Exception as e:
        print(json.dumps({ "error": str(e) }))