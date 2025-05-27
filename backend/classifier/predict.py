from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import torch
import sys
import json

# Load model & processor once
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# Label sets
colors = [
    "black", "white", "gray", "red", "blue", "green", 
    "yellow", "purple", "orange", "brown", "pink", "beige"
]

patterns = [
    "solid color", "plain", "striped", "plaid", "floral", "polka dot", 
    "camouflage", "checkered", "animal print", "graphic print"
]

types = [
    "t-shirt", "hoodie", "tank top", "long sleeve shirt", "short sleeve shirt", "dress",
    "skirt", "jeans", "shorts", "jacket", "coat", "blouse", "sweater", "sweatpants", "long sleeve polo shirt", "short sleeve polo shirt"
]

# Prompt templates
type_templates = [
    "a flat-lay image of a {} on a bed",
    "a clothing catalog photo of a {}",
    "a product photo of a {} against a white background"
]

color_templates = [
    "a clothing item that is {}",
    "a {} piece of clothing",
    "a product image showing a {} garment"
]

pattern_templates = [
    "a piece of clothing with a {} pattern",
    "a {} pattern on a fashion item",
    "a product photo of a {} design"
]

def predict_with_prompts(image, labels, templates, threshold=0.6):
    grouped_prompts = []
    grouped_labels = []

    for label in labels:
        for tmpl in templates:
            grouped_prompts.append(tmpl.format(label))
            grouped_labels.append(label)

    # Get raw logits (no softmax yet)
    inputs = processor(text=grouped_prompts, images=image, return_tensors="pt", padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
        raw_scores = outputs.logits_per_image.squeeze()

    # Group scores by label
    label_scores = {label: [] for label in labels}
    for score, label in zip(raw_scores, grouped_labels):
        label_scores[label].append(score.item())

    # Average raw scores per label
    averaged_scores = {label: sum(scores) / len(scores) for label, scores in label_scores.items()}

    # Normalize across labels using softmax (optional but good for thresholding)
    label_tensor = torch.tensor(list(averaged_scores.values()))
    probs = torch.softmax(label_tensor, dim=0)
    scored_labels = list(averaged_scores.keys())
    best_idx = torch.argmax(probs).item()
    best_label = scored_labels[best_idx]
    best_score = probs[best_idx].item()

    return best_label if best_score >= threshold else "uncertain"

def predict(image_path):
    image = Image.open(image_path).convert("RGB")

    color = predict_with_prompts(image, colors, color_templates, threshold=0.5)
    pattern = predict_with_prompts(image, patterns, pattern_templates, threshold=0.5)
    clothing_type = predict_with_prompts(image, types, type_templates, threshold=0.5)

    return {
        "color": color,
        "pattern": pattern,
        "type": clothing_type
    }

if __name__ == "__main__":
    try:
        result = predict(sys.argv[1])
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({ "error": str(e) }))
