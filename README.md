# Placement Prep Tracker

A full-stack web application designed to help students manage placement preparation efficiently. The platform allows users to organize companies, track preparation progress, manage interview notes, and monitor placement-related activities in one place.

---

# Features

## Authentication System

* User signup and login
* Secure authentication using JWT
* Protected routes and middleware
* Session-based access control

## Dashboard

* Centralized placement preparation overview
* Quick access to companies, notes, and collections
* Clean premium dark glassmorphism UI
* Responsive layout for desktop, tablet, and mobile

## Company Management

Users can:

* Add companies
* Edit company details
* Delete companies
* Track placement status
* Store company-specific information

## Collections System

Users can:

* Create collections/categories
* Organize preparation material
* Group companies or notes together
* Update and delete collections

## Notes Management

Users can:

* Create preparation notes
* Save interview experiences
* Store important questions and answers
* Edit and delete notes

## Responsive UI

* Mobile-friendly design
* Tablet support
* Desktop optimized layout
* Modern glassmorphism styling

---

# Tech Stack

## Frontend

* HTML
* CSS
* JavaScript

## Backend

* Node.js
* Express.js

## Database

* MongoDB
* Mongoose

## Authentication

* JWT (JSON Web Token)
* bcrypt

---

# Project Structure

```bash
placement-prep-tracker/
│
├── backend/            # Express.js API & MongoDB Models
├── frontend/           # Vanilla JS/CSS Dashboard UI
├── .gitignore
└── README.md
```

---

# Installation

## 1. Clone the Repository

```bash
git clone <your-github-repo-link>
cd placement-prep-tracker
```

## 2. Install Backend Dependencies

```bash
cd backend
npm install
```

## 3. Configure Environment Variables

Create a `.env` file inside the backend folder.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_here
```

> [!IMPORTANT]
> Make sure to provide a valid `JWT_SECRET` for secure authentication. For local development, you can use a simple string, but use a strong random key for production.

## 4. Start the Backend Server

```bash
npm start
```

or

```bash
node server.js
```

## 5. Run Frontend

Open the frontend HTML files using Live Server in VS Code.

---

# API Routes

## Auth Routes

* `POST /api/auth/signup`
* `POST /api/auth/login`

## Company Routes

* `GET /api/company`
* `POST /api/company`
* `PUT /api/company/:id`
* `DELETE /api/company/:id`

## Collection Routes

* `GET /api/collections`
* `POST /api/collections`
* `PUT /api/collections/:id`
* `DELETE /api/collections/:id`

## Notes Routes

* `GET /api/notes`
* `POST /api/notes`
* `PUT /api/notes/:id`
* `DELETE /api/notes/:id`

---

# Future Improvements

Possible future upgrades:

* Interview scheduling system
* Resume upload and analysis
* DSA progress tracker
* Mock interview feature
* AI-powered preparation suggestions
* Placement analytics dashboard
* Notification/reminder system
* Cloud storage integration

---

# Deployment

The project can be deployed using:

* Frontend: Vercel
* Backend: Render
* Database: MongoDB Atlas

---

# Author

Developed by Ritesh.

---

# License

This project is for educational and learning purposes.
