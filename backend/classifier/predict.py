from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import torch
import sys
import json

model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

labels = [
    "a t-shirt", "a hoodie", "a skirt", "a dress", 
    "a pair of pants", "a jacket", "shorts", "a blouse"
]

def predict(image_path):
    image = Image.open(image_path).convert("RGB")
    inputs = processor(text=labels, images=image, return_tensors="pt", padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
        logits_per_image = outputs.logits_per_image
        probs = logits_per_image.softmax(dim=1)
        best_idx = torch.argmax(probs).item()
        return labels[best_idx]

if __name__ == "__main__":
    try:
        label = predict(sys.argv[1])
        print(json.dumps({ "category": label }))
    except Exception as e:
        print(json.dumps({ "error": str(e) }))