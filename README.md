# AI-Master Assistant 🧠📄

AI-Master Assistant is a smart AI-powered study and document assistant. It allows users to upload documents, generate flashcards, and chat with document content using advanced language models via OpenRouter and Mistral APIs.

This project is built with a **React frontend** and an **Express/Node.js backend**, integrated with LLM APIs to assist users in understanding and revising documents efficiently.

---

## ✨ Features

- 📤 Upload and process documents (PDF, DOCX, TXT)
- 💬 Chat with document content using AI
- 🃏 Generate smart flashcards
- 🗑️ Manage and delete uploaded documents
- 🎨 Modern UI with Oni sword theme (Tailwind CSS)

---

## 🛠️ Tech Stack

### Frontend
- React
- Axios
- Tailwind CSS
- Vite (for fast dev and build)

### Backend
- Node.js + Express
- Multer (file upload)
- pdf-parse / docx parser
- OpenRouter API (Mistral models)
- Flashcard generation logic

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ai-master-assistant.git
cd ai-master-assistant
````

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
```

Start the backend server:

```bash
node index.js
```

> The backend will run on `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Start the frontend in development:

```bash
npm run dev
```

To build for production:

```bash
npm run build
```

---

## 🌐 Deployment Notes (Static Site on Render)

1. Build the frontend:

```bash
npm run build
```

2. On Render:

   * Choose **Static Site**
   * Set the **Build Command**: `npm run build`
   * Set the **Publish Directory**: `dist`
   * If CORS issues arise, ensure your backend is CORS-enabled for frontend domain.

---

## 📦 API Endpoints (Backend)

* `POST /api/documents/upload` – Upload a document
* `GET /api/documents` – Fetch uploaded documents
* `DELETE /api/documents/:filename` – Delete a document
* `POST /api/flashcards` – Generate flashcards from a document
* `POST /api/chat` – Ask questions about the document

---

## 📝 Environment Variables

In `backend/.env`:

```env
OPENROUTER_API_KEY=your_api_key_here
```

---

## 📄 License

MIT License

---

## 🙏 Credits

* [OpenRouter](https://openrouter.ai)
* [Mistral](https://mistral.ai)
* [Tailwind CSS](https://tailwindcss.com)

```
---
