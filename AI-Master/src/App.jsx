import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './oni-sword-effects.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [processingResult, setProcessingResult] = useState(null);
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [revealedAnswers, setRevealedAnswers] = useState({});

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return alert('Please select a file first!');

    const formData = new FormData();
    formData.append('document', selectedFile);

    try {
      const response = await axios.post('http://localhost:5000/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProcessingResult(response.data.document);
      setFlashcards(response.data.document.flashcards);
      fetchDocuments();
    } catch (error) {
      console.error('Upload failed', error);
      alert('Document upload failed');
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/documents');
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch documents', error);
    }
  };

  const handleChatWithDocument = async (documentPath) => {
    try {
      const response = await axios.post('http://localhost:5000/api/chat', {
        query: chatQuery,
        documentPath: documentPath,
      });
      setChatResponse(response.data.response);
    } catch (error) {
      console.error('Chat failed', error);
      alert('Failed to get chat response');
    }
  };

  const handleDeleteDocument = async (filename) => {
    try {
      await axios.delete(`http://localhost:5000/api/documents/${filename}`);
      fetchDocuments();
    } catch (error) {
      console.error('Delete failed', error);
    }
  };

  const handleGenerateFlashcards = async (documentPath) => {
    try {
      const response = await axios.post('http://localhost:5000/api/flashcards', {
        documentPath: documentPath,
      });
      setFlashcards(response.data.flashcards);
    } catch (error) {
      console.error('Flashcard generation failed', error);
      alert('Failed to generate flashcards');
    }
  };

  const toggleAnswer = (index) => {
    setRevealedAnswers((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-6 font-sans oni-background relative overflow-hidden">
      <div className="oni-sword-layer"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <h1 className="text-4xl font-extrabold mb-8 text-center">AI-Master Assistant</h1>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-neutral-800 p-6 rounded-xl shadow-md border border-neutral-700">
            <h2 className="text-xl font-semibold mb-4">Upload</h2>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-neutral-700 file:text-white hover:file:bg-neutral-600"
            />
            <button
              onClick={handleUpload}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded"
            >
              Upload
            </button>
          </div>

          <div className="bg-neutral-800 p-6 rounded-xl shadow-md border border-neutral-700 col-span-2">
            <h2 className="text-xl font-semibold mb-4">Uploaded Docs</h2>
            {documents.length === 0 ? (
              <p className="text-gray-400">No documents uploaded yet.</p>
            ) : (
              <ul className="space-y-3">
                {documents.map((doc, index) => (
                  <li key={index} className="bg-neutral-700 rounded-lg p-3 flex justify-between items-center">
                    <span>{doc.filename}</span>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleChatWithDocument(doc.path)}
                        className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded"
                      >Chat</button>
                      <button
                        onClick={() => handleGenerateFlashcards(doc.path)}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded"
                      >Flashcards</button>
                      <button
                        onClick={() => handleDeleteDocument(doc.filename)}
                        className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded"
                      >Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-neutral-800 p-6 rounded-xl shadow-md border border-neutral-700 col-span-3">
            <h2 className="text-xl font-semibold mb-4">Ask Questions</h2>
            <div className="flex space-x-4">
              <input
                type="text"
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                placeholder="Type your question..."
                className="flex-grow p-2 bg-neutral-700 text-white rounded border border-neutral-600"
              />
              <button
                onClick={() => handleChatWithDocument(processingResult?.path)}
                disabled={!processingResult}
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-white"
              >Send</button>
            </div>
            {chatResponse && (
              <div className="mt-4 p-4 bg-neutral-700 rounded">
                <h3 className="font-bold mb-2">AI Response:</h3>
                <p>{chatResponse}</p>
              </div>
            )}
          </div>

          {flashcards.length > 0 && (
            <div className="bg-neutral-800 p-6 rounded-xl shadow-md border border-neutral-700 col-span-3">
              <h2 className="text-xl font-semibold mb-4">Flashcards</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {flashcards.map((card, index) => (
                  <div
                    key={index}
                    onClick={() => toggleAnswer(index)}
                    className="bg-neutral-700 p-4 rounded-lg hover:shadow-lg transition cursor-pointer flashcard"
                  >
                    <h3 className="font-semibold mb-1">Q:</h3>
                    <p className="mb-2">{card.question}</p>
                    {revealedAnswers[index] && (
                      <>
                        <h3 className="font-semibold mb-1">A:</h3>
                        <p>{card.answer}</p>
                      </>
                    )}
                    {!revealedAnswers[index] && (
                      <p className="text-gray-400 italic">Click to reveal answer</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
