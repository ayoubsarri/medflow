# Clinic Management System

The Clinic Management System is a comprehensive, full-stack web application designed to streamline the daily operations of a medical clinic. It digitizes patient records, automates appointment scheduling, and provides specialized portals for different clinic staff. By replacing paper-based processes with an interactive digital workspace, the system improves clinic efficiency, reduces patient wait times through a live queue screen, and provides administrators with data-driven insights.

## Tech Stack

| Component | Technology |
|---|---|
| **Frontend** | React, Next.js, TailwindCSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Authentication** | JSON Web Tokens (JWT), bcrypt |
| **Real-time** | Socket.IO |

## How to Run Locally

Follow these steps to set up and run the project on your local machine:

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd clinic-management-system-main
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Set up Backend Environment Variables**
   Create a `.env` file in the `backend/` directory based on the `.env.example` file. Add your MongoDB URI and a JWT secret.
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_random_string
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
   ```

4. **Run the Backend Server**
   ```bash
   npm run dev
   ```
   The server will start on port 5000 (or the port defined in your .env).

5. **Install Frontend Dependencies**
   Open a new terminal window, navigate to the frontend folder, and install packages.
   ```bash
   cd frontend
   npm install
   ```

6. **Run the Frontend Application**
   ```bash
   npm run dev
   ```
   The frontend will be accessible at `http://localhost:3000`.

## User Roles

The system is designed with Role-Based Access Control (RBAC), supporting four distinct user roles:

- **Admin**: Has full access to the system. Can manage staff accounts (add, delete, suspend), configure doctor working schedules, view system-wide analytics, generate and export reports, and adjust global clinic settings.
- **Doctor**: Can view their daily appointment schedule, access detailed patient medical histories, record consultation notes, and generate PDF medical justifications and prescriptions.
- **Receptionist**: Acts as the clinic's front desk. Can register new patients, book appointments using the smart scheduling tool, manage the live patient queue by updating appointment statuses, and communicate internally with doctors.
- **Patient**: Can access the patient portal using their unique file number to view their upcoming appointments, review past consultation history, update personal details, upload external medical records, and request new appointments.

## Main Features

- **Appointment Scheduling**: Smart booking system that prevents overlaps and respects doctor break intervals.
- **Patient Records**: Digital health records including allergies, chronic conditions, and past consultation notes.
- **Live Queue Screen**: A real-time waiting room display that automatically updates as receptionists and doctors change appointment statuses.
- **Consultations**: Doctors can finalize visits, write notes, and automatically issue PDF prescriptions and medical justifications.
- **Reports & Analytics**: Admins can generate and export CSV reports covering patient intake, no-show rates, and staff workload.
- **Internal Messaging**: Real-time chat between receptionists and doctors using Socket.IO to coordinate patient flow smoothly.

## Project Structure

This project follows a strict separation of concerns, divided into two main folders:

- **`frontend/`**: Contains the Next.js React application. It handles the UI, routing between pages, and making HTTP requests to the backend API.
- **`backend/`**: Contains the Node.js/Express server. It follows the **MVC (Model-View-Controller)** pattern:
  - **Models**: Defines the MongoDB database schemas (e.g., Patient, Appointment).
  - **Controllers**: Contains the core business logic (e.g., calculating available time slots, verifying passwords).
  - **Routes**: Acts as a traffic director, mapping specific URLs (like `/api/admin/staff`) to the correct controller functions and applying security middleware.