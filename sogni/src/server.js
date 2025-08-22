const express = require('express');
const path = require('path');
const sogni = require('./sogni');
const multer = require('multer');
const app = express();
const upload = multer();
app.use(express.json());  // Add JSON parsing middleware
app.use(express.static(path.join(__dirname, '../public')));

app.post('/api/generate-character', upload.single('referenceImage'), async (req, res) => {
  try {
    const data = req.body;
    let referenceImageBuffer = null;
    if (req.file) {
      referenceImageBuffer = req.file.buffer;
    }
    const imageUrl = await sogni.generateCharacterCard(data, referenceImageBuffer);
    res.json({ imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
