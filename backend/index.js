const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

app.post('/remove-bg', upload.single('image'), (req, res) => {
  if (!req.file) {
    console.error('No file received');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const inputPath = path.join(__dirname, req.file.path);
  console.log(`📷 Received file: ${inputPath}`);

  // Step 1: Background removal
  const removeBg = spawn('python', ['classifier/remove_bg.py', inputPath]);

  let removeResult = '';
  removeBg.stdout.on('data', data => removeResult += data.toString());
  removeBg.stderr.on('data', data => console.error('Python stderr:', data.toString()));

  removeBg.on('close', code => {
    try {
      const parsed = JSON.parse(removeResult);
      if (parsed.error) throw new Error(parsed.error);

      const bgRemovedPath = parsed.output_path;

      // Step 2: Normalization
      const normalize = spawn('python', ['classifier/normalize.py', bgRemovedPath]);

      let normalizeResult = '';
      normalize.stdout.on('data', data => normalizeResult += data.toString());
      normalize.stderr.on('data', data => console.error('Python stderr:', data.toString()));

      normalize.on('close', code => {
        try {
          const normParsed = JSON.parse(normalizeResult);
          if (normParsed.error) throw new Error(normParsed.error);

          const normPath = normParsed.normalized_path;
          const predict = spawn('python', ['classifier/predict.py', normPath]);

          let predictResult = '';
          predict.stdout.on('data', data => predictResult += data.toString());
          predict.stderr.on('data', data => console.error('Python stderr (predict):', data.toString()));

          predict.on('close', code => {
            try {
              const prediction = JSON.parse(predictResult);
              const imageData = fs.readFileSync(normPath, { encoding: 'base64' });

              res.json({
                base64_image: imageData,
                prediction
              });
            } catch (err) {
              console.error('Failed in prediction:', err.message);
              res.status(500).json({ error: 'Prediction failed.' });
            }
          });

        } catch (err) {
          console.error('Failed in normalization:', err.message);
          res.status(500).json({ error: 'Normalization failed.' });
        }
      });

    } catch (err) {
      console.error('Failed in background removal:', err.message);
      res.status(500).json({ error: 'Background removal failed.' });
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
