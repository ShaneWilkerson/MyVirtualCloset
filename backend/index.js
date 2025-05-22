const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

app.post('/predict', upload.single('image'), (req, res) => {
  if (!req.file) {
    console.error('❌ No file received');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const imagePath = path.join(__dirname, req.file.path);
  console.log(`📷 Received file: ${imagePath}`);

  const python = spawn('python', ['classifier/predict.py', imagePath]);

  let result = '';
  python.stdout.on('data', data => {
    console.log('🐍 Python stdout:', data.toString());
    result += data.toString();
  });

  python.stderr.on('data', data => {
    console.error('❗ Python stderr:', data.toString());
  });

  python.on('close', code => {
    console.log(`🔚 Python process exited with code ${code}`);
    fs.unlinkSync(imagePath); // Cleanup
    try {
      res.json(JSON.parse(result));
    } catch (e) {
      console.error('❌ Failed to parse result:', result);
      res.status(500).json({ error: 'Failed to parse model output' });
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});