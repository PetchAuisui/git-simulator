-- PostgreSQL Setup Script
-- Run this script in PostgreSQL to set up the database

-- Create database
CREATE DATABASE git_simulator;

-- Connect to the new database
\c git_simulator

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create repositories table
CREATE TABLE IF NOT EXISTS repositories (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "repoName" TEXT NOT NULL,
  path TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES users(id),
  UNIQUE("userId", "repoName")
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_repositories_userId ON repositories("userId");
CREATE INDEX idx_repositories_userId_repoName ON repositories("userId", "repoName");
