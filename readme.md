. Setup and Run Instructions
Prerequisites:
Install Node.js (v20+ recommended).
Install PostgreSQL.
Database Setup:
Open your PostgreSQL terminal (psql).
Create the database:
Generated sql
CREATE DATABASE voyai;
Use code with caution.
SQL
Connect to the new database: \c voyai
Run the SQL schema provided in database.sql below to create the tables.
Backend Setup:
Create a directory named backend.
Save all the files from the "Backend Code" section into this directory.
Create a .env file in the backend directory by copying .env.example. Fill in your database connection details and a JWT_SECRET.
Generated code
# .env content
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/voyai
PORT=5000
JWT_SECRET=your_super_secret_key_for_jwt
SIM_MODE=true
BOOKING_COM_API_KEY=your_real_key_or_leave_blank_for_sim
AIRBNB_TOKEN=your_real_token_or_leave_blank_for_sim
Use code with caution.
Navigate to the backend directory in your terminal and run:
Generated bash
npm install
npm start
Use code with caution.
Bash
The server will be running on http://localhost:5000.
Frontend Setup:
Create a directory named frontend.
Save all the files from the "Frontend Code" section into the frontend/src directory (and package.json in the root).
Navigate to the frontend directory in your terminal and run:
Generated bash
npm install
npm run dev
Use code with caution.
Bash
The React app will be running on http://localhost:3000 (or another port if 3000 is busy).
Usage:
Navigate to http://localhost:3000/register to create an admin account.
Log in at http://localhost:3000/login.
You will be redirected to the admin dashboard to manage your properties.
The public booking page is available at http://localhost:3000/book.
2. Database Schema
database.sql
Generated sql
-- SQL Schema for VoyAI

-- Users Table for admin authentication
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Properties Table
CREATE TABLE Properties (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES Users(id),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rooms Table
CREATE TABLE Rooms (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES Properties(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    capacity INTEGER NOT NULL,
    base_rate NUMERIC(10, 2) NOT NULL,
    amenities TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reservations Table
CREATE TABLE Reservations (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES Rooms(id) ON DELETE CASCADE,
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'confirmed', -- e.g., confirmed, pending, cancelled
    channel VARCHAR(50) DEFAULT 'direct', -- e.g., direct, booking.com, airbnb
    total_price NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Channel Sync Logs
CREATE TABLE ChannelSyncs (
    id SERIAL PRIMARY KEY,
    channel_name VARCHAR(50) NOT NULL,
    sync_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL, -- e.g., success, failed
    details TEXT
);

-- Housekeeping Tasks
CREATE TABLE HousekeepingTasks (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES Rooms(id) ON DELETE CASCADE,
    task_description VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- e.g., pending, completed
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add some indexes for performance
CREATE INDEX idx_reservations_room_id ON Reservations(room_id);
CREATE INDEX idx_reservations_dates ON Reservations(check_in_date, check_out_date);
CREATE INDEX idx_rooms_property_id ON Rooms(property_id);
