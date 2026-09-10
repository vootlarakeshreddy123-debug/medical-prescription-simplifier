# Medical Prescription Simplifier

<p align="center">
  <img src="public/images/Screenshot 2026-09-10 195449.png" alt="medical prescription simplifier" width="800"/>
</p>

## About

An AI-powered web application that extracts and simplifies information from medical prescriptions using OCR and AI. It helps identify medicines, dosage, frequency, timing, duration, and instructions from prescription images.

## Features

- AI-powered prescription extraction
- OCR (Optical Character Recognition)
- Handwritten prescription recognition
- Medicine name and dosage extraction
- Frequency, timing, and duration extraction
- AI-powered prescription simplification
- Confidence-based information verification
- Edit and verify extracted medicine details
- Medicine interaction checking
- Multilingual prescription explanations
- Prescription history
- Testing and accuracy evaluation dashboard
- Responsive design for desktop and mobile
- Secure API key configuration

## Technologies Used

- React.js
- TypeScript
- Vite
- Tailwind CSS
- Node.js
- Express.js
- Google Gemini API
- Google Cloud Vision API
- OCR
- Sharp
- REST API
- Git & GitHub

## AI & OCR

The application uses OCR and AI vision processing to extract information from prescription images.

The system can identify:

- Medicine names
- Dosage and strength
- Frequency
- Timing
- Duration
- Prescription instructions

Unclear information is highlighted for user verification before proceeding.

## Project Structure

medical-prescription-simplifier/
├── src/
│   ├── components/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
│
├── server/
│   ├── aiService.ts
│   ├── geminiWrapper.ts
│   ├── googleVisionService.ts
│   ├── ocrVisionEngine.ts
│   ├── verificationEngine.ts
│   ├── testingService.ts
│   └── db.ts
│
├── public/
├── .data/
├── server.ts
├── package.json
├── vite.config.ts
└── README.md

## Installation

Clone the repository:


git clone https://github.com/vootlarakeshreddy123-debug/medical-prescription-simplifier.git



Navigate to the project:

cd medical-prescription-simplifier

Install dependencies:

npm install

Create a .env file and add the required API keys.

Run the application:

npm run dev


🌍Live Demo

https://medical-prescription-simplifier.vercel.app/

GitHub Repository

https://github.com/vootlarakeshreddy123-debug/medical-prescription-simplifier

Author

Rakesh Reddy

GitHub:

https://github.com/vootlarakeshreddy123-debug

LinkedIn:

https://www.linkedin.com/in/vootla-rakesh-reddy-249aa63b8/
