# Unifye Events 

> Discover, host, and participate in hackathons, bootcamps, competitions, workshops, seminars, and community events — all in one place.

🌐 Live Website: [Unifye.in](https://unifye.in)

---

## Overview

**Unifye Events** is a modern event management and discovery platform designed for students, developers, organizers, and communities.

The platform allows users to:

*  Discover upcoming events
*  Participate in hackathons & competitions
*  Host and manage events
*  Create individual or team-based participation
*  Build a public developer/student profile
*  Connect with friends and communities

The goal of Unifye is to create a centralized ecosystem where opportunities, learning, networking, and innovation come together.

---

#  Features

##  Authentication System

* Google OAuth Authentication
* Secure session handling
* Role-based access (Participant / Organizer)

##  Event Management

* Create and publish events
* Upload event cover images
* Add:

  * Event title
  * Description
  * Date & time
  * Capacity
  * Location
  * Participation mode
* Support for:

  * Hackathons
  * Bootcamps
  * Competitions
  * Workshops
  * Seminars

##  Participation Modes

* Individual participation
* Team-based participation
* Hybrid mode (Both)

##  Event Discovery

* Search events
* Filter by categories
* Browse public events feed
* Clean and modern UI for exploration

##  User Dashboard

* Personalized dashboard
* View registered events
* Track participation
* Manage hosted events

##  Public Profiles

* Developer-style public profiles
* Add:

  * Skills
  * Portfolio links
  * GitHub
  * LinkedIn
  * Bio
* Activity section

##  Social Features

* Friend system
* User search
* Community interactions

##  Modern UI/UX

* Responsive design
* Clean minimal interface
* Smooth interactions
* Accessible layouts

---

#  Tech Stack

## Frontend

* React.js
* Vite
* Tailwind CSS
* React Router
* Axios

## Backend

* Node.js
* Express.js

## Database

* MongoDB
* Mongoose

## Authentication

* Passport.js
* Google OAuth 2.0

## Media & Deployment

* Cloudinary
* Render
* Vercel

---

#  Screenshots

##  Discover Events

* Browse hackathons, bootcamps, workshops, and competitions
* Search and filter events easily

##  Create Event

* Organizers can publish professional event listings
* Supports image uploads and rich descriptions

##  Dashboard

* Personalized event tracking and analytics

##  User Profile

* Public profile with skills and social links

---

#  Project Vision

Unifye aims to become a student-first and creator-first platform that helps people:

* Find opportunities faster
* Build meaningful connections
* Collaborate in teams
* Showcase their skills
* Grow through events and communities

---

#  Installation & Setup

## 1. Clone the repository

```bash
git clone https://github.com/your-username/unifye-events.git
cd unifye-events
```

---

## 2. Install dependencies

### Frontend

```bash
cd client
npm install
```

### Backend

```bash
cd server
npm install
```

---

## 3. Environment Variables

Create a `.env` file inside both `client` and `server`.

### Server `.env`

```env
PORT=5000

MONGO_URI=your_mongodb_uri

SESSION_SECRET=your_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 4. Run the application

### Start Backend

```bash
cd server
npm run dev
```

### Start Frontend

```bash
cd client
npm run dev
```

---

#  Project Structure

```bash
unifye/
│
├── client/                 # Frontend
│   ├── src/
│   ├── public/
│   └── components/
│
├── server/                 # Backend
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── services/
│   └── config/
│
└── README.md
```

---

#  Security Features

* Helmet.js for HTTP security
* Rate limiting
* Secure cookies
* CORS protection
* Error handling middleware
* Input validation

---

#  Future Improvements

*  Real-time notifications
*  Event chat system
*  Certificate generation
*  Mobile app
*  Organizer analytics
*  QR-based event check-in
*  AI-powered event recommendations
*  Leaderboards & achievements

---

#  Contributing

Contributions are welcome!

```bash
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
```

---

#  Author

## Somraj Nandi

* Portfolio
* GitHub
* LinkedIn

---

# ⭐ Support

If you like this project, consider giving it a ⭐ on GitHub!

---

#  Contact

For collaborations, feedback, or suggestions:
- ✉️ [Mail](mailto:somrajnandi112@gmail.com)
- 🌐 [Unifye.in](https://unifye.in)
