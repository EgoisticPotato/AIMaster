
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const pdfParse = require('pdf-parse');
require('dotenv').config();

// App Configuration
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

const cors = require('cors');
app.use(cors()); // Allows all origins

// Multer Configuration for File Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// OpenRouter API Service for Document Processing
async function processDocumentWithOpenRouter(filePath) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));

  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', 
      formData, 
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('OpenRouter processing error:', error);
    throw error;
  }
}

// Generate Flashcards Service
async function generateFlashcards(documentText) {
  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: "google/gemini-pro",
      messages: [
        {
          role: "system",
          content: "You are an expert at creating educational flashcards from text."
        },
        {
          role: "user",
          content: `Generate 10 detailed flashcards from the following text. Format each flashcard as a JSON object with 'question' and 'answer' keys:\n\n${documentText}`
        }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Parse the flashcards from the AI response
    const flashcardsText = response.data.choices[0].message.content;
    return JSON.parse(flashcardsText);
  } catch (error) {
    console.error('Flashcard generation error:', error);
    throw error;
  }
}

// Document Upload Route
app.post('/api/documents/upload', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log("File uploaded successfully:", req.file); // Check if file info is present

        res.json({
            message: 'Document uploaded successfully',
            document: {
                filename: req.file.filename,
                originalname: req.file.originalname,
                path: req.file.path,
                // flashcards: [] // Temporarily remove flashcards
            }
        });
    } catch (error) {
        console.error('Document upload error:', error);
        res.status(500).json({ message: 'Document processing failed' });
    }
});

// Flashcard Generation Route
app.post('/api/flashcards', async (req, res) => {
  try {
    const { documentPath } = req.body;

    if (!documentPath || !fs.existsSync(documentPath)) {
      return res.status(400).json({ message: 'Invalid or missing documentPath' });
    }

    // Read and parse PDF
    const fileBuffer = fs.readFileSync(documentPath);
    const pdfData = await pdfParse(fileBuffer);
    const documentText = pdfData.text;

    // Request flashcards from OpenRouter
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: "meta-llama/llama-4-maverick:free",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI tutor. Generate flashcards based on the document."
        },
        {
          role: "user",
          content: `Based on this document content, generate a list of flashcards in JSON format with keys "question" and "answer". Document Content: ${documentText.slice(0, 5000)}`
        }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Attempt to parse the response into flashcards
    let flashcards = [];
    const content = response.data.choices[0].message.content;

    try {
      flashcards = JSON.parse(content);
    } catch (parseError) {
      // Try to extract JSON-like structure with regex if direct parse fails
      const match = content.match(/\[.*\]/s);
      if (match) {
        flashcards = JSON.parse(match[0]);
      } else {
        throw new Error("Unable to parse flashcards from model response");
      }
    }

    res.json({ flashcards });
  } catch (error) {
    console.error('Flashcard generation error:', error);
    res.status(500).json({ message: 'Flashcard generation failed' });
  }
});

// Chatbot Route
app.post('/api/chat', async (req, res) => {
  try {
    const { query, documentPath } = req.body;

    // Read and parse PDF
    const fileBuffer = fs.readFileSync(documentPath);
    const pdfData = await pdfParse(fileBuffer);
    const documentText = pdfData.text;

    // Log or truncate for OpenRouter prompt (limit to 5000 characters)
    console.log(documentText.slice(0, 1000));

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: "meta-llama/llama-4-maverick:free",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant focused on the content of the uploaded document."
        },
        {
          role: "user",
          content: `Document Context: ${documentText.slice(0, 5000)}\n\nQuery: ${query}`
        }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      response: response.data.choices[0].message.content
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Chat processing failed' });
  }
});

// List Uploaded Documents Route
app.get('/api/documents', (req, res) => {
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    res.json(files.map(filename => ({
      filename,
      path: path.join(UPLOAD_DIR, filename)
    })));
  } catch (error) {
    console.error('Error listing documents:', error);
    res.status(500).json({ message: 'Could not list documents' });
  }
});

// Delete Document Route
app.delete('/api/documents/:filename', (req, res) => {
  try {
    const filePath = path.join(UPLOAD_DIR, req.params.filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete the file
    fs.unlinkSync(filePath);
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Could not delete document' });
  }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
