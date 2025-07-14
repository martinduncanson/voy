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