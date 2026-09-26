# Sangam — SIH 2026

> AI-powered societal challenge resolution platform for Smart India Hackathon 2026.

## 🚀 About

**Sangam** is a digital platform designed to connect societal challenges with citizens, universities, teams, resources, and solution proposals.

The platform provides a structured workflow for:

- 🏘️ Identifying and submitting societal challenges
- 🤝 Connecting challenges with solution teams
- 🎓 Enabling university participation
- 💡 Managing solution proposals and projects
- 🤖 Supporting AI-assisted challenge analysis
- 📍 Visualizing challenges across Jharkhand districts
- 📊 Monitoring activities and platform analytics
- 🔔 Providing notifications and updates

## ✨ Key Features

### Citizen Portal
- Submit societal challenges
- Track submitted challenges
- View relevant projects and proposals
- Upload supporting evidence

### University Portal
- Discover societal challenges
- Participate through teams
- Develop and submit solutions
- Manage projects and proposals

### Admin Portal
- Manage users and challenges
- Monitor platform activities
- Manage resources
- Review platform analytics

### AI Assistance
The backend includes an AI-analysis module designed to assist with processing and analysing submitted challenges.

### Jharkhand District Mapping
The frontend includes a district-level Jharkhand map for geographical visualization of challenges.

## 🏗️ Technology Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT authentication

### Development

- Git
- GitHub
- ESLint / Prettier

## 📁 Project Structure

```text
sangam_sih26043/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── seed/
│   │   └── utils/
│   ├── package.json
│   └── .env.example
│
├── src/
│   ├── components/
│   ├── context/
│   ├── data/
│   ├── pages/
│   ├── routes/
│   └── services/
│
├── public/
├── index.html
├── package.json
├── vite.config.js
└── .gitignore
