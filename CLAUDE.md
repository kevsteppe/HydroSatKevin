# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HydroSatKevin is a customer feedback system with sentiment analysis using AWS Comprehend. This is a Proof of Concept (POC) consisting of a React frontend and AWS Lambda backend for collecting and analyzing customer opinions about a single product.

## System Architecture

**Frontend (React + TypeScript):**
- Customer feedback form (max 1000 characters)
- Admin view to display all feedback with sentiment results
- Simple, minimal UI design
- Deployed to S3 static hosting

**Backend (AWS Lambda + TypeScript):**
- REST API endpoint to accept customer feedback with idempotency
- Sentiment analysis using AWS Comprehend (convert to "Good" | "Bad" | "Neutral")
- DynamoDB storage for feedback and running statistics
- REST API endpoint to retrieve all feedback with statistics
- Idempotency key: combination of session + feedback text

## Work To Be Done

**Backend Development:**
- [x] Set up AWS Lambda project structure with TypeScript
- [x] Create POST /feedback endpoint handler with idempotency checking
- [x] Integrate AWS Comprehend for sentiment analysis
- [x] Map AWS Comprehend sentiments: POSITIVE→Good, NEGATIVE→Bad, NEUTRAL/MIXED→Neutral
- [x] Set up DynamoDB data layer functions (feedback + statistics)
- [x] Implement running statistics updates in POST /feedback
- [x] Create GET /viewFeedback endpoint to retrieve all feedback
- [ ] Create GET /statistics endpoint for statistics retrieval
- [x] Configure AWS SAM template for deployment
- [x] Add input validation (1000 character limit)
- [x] Implement error handling and logging

**Frontend Development:**
- [x] Set up React project with TypeScript
- [x] Generate/manage session keys for idempotency
- [x] Create customer feedback form component
- [x] Implement form validation and submission
- [ ] Create admin dashboard for viewing feedback
- [ ] Add sentiment visualization/display
- [x] Style components with basic CSS/styling library
- [x] Configure API integration with backend

**Testing:**
- [x] Set up Jest testing framework for backend
- [ ] Write unit tests for Lambda handlers
- [ ] Write unit tests for sentiment analysis service
- [ ] Write unit tests for DynamoDB data layer
- [ ] Write unit tests for idempotency logic
- [ ] Set up React Testing Library for frontend
- [ ] Write component tests for feedback form
- [ ] Write component tests for admin dashboard
- [ ] Write integration tests for API endpoints
- [x] Set up Cypress for end-to-end regression tests
- [ ] Write Cypress tests for complete user workflows

**Infrastructure & Deployment:**
- [x] Configure DynamoDB tables (feedback + statistics) with proper indexes
- [x] Set up IAM roles and permissions for Lambda and Comprehend
- [x] Configure CORS for frontend-backend communication
- [x] Create GitHub Actions CI/CD pipeline for AWS deployment
- [x] Set up GitHub repository secrets for AWS credentials
- [x] Create SAM deployment S3 bucket
- [x] Create simple passing tests to unblock CI/CD deployment
- [ ] Deploy backend to AWS Lambda via CI/CD
- [ ] Deploy frontend to S3 static hosting via CI/CD
- [ ] Fix SAM template endpoint names - separate POST /feedback and GET /viewFeedback
- [ ] Set up environment variables and configuration

## Development Commands

**Backend (Lambda):**
- `npm install` - Install dependencies
- `npm run build` - Build Lambda functions
- `npm run deploy` - Deploy to AWS using SAM
- `npm test` - Run tests
- `npm run local` - Run Lambda locally with SAM

**Frontend (React):**
- `npm install` - Install dependencies
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run linting
- `npx cypress open` - Open Cypress test runner

## API Endpoints

**POST /feedback**
- Accept customer feedback (text, max 1000 chars, session key)
- Check idempotency using session + feedback text hash
- Use AWS Comprehend for sentiment analysis
- Map to "Good" | "Bad" | "Neutral"
- Store in DynamoDB and update running statistics

**GET /viewFeedback**
- Retrieve all feedback with sentiment results

**GET /statistics**
- Retrieve running statistics (total count, Good/Bad/Neutral percentages)

## Database Schema (DynamoDB)

**FeedbackTable:**
- id (String, Primary Key): Unique feedback ID
- idempotencyKey (String, GSI): Hash of session + feedback text
- text (String): Customer feedback text
- sentiment (String): "Good" | "Bad" | "Neutral"
- confidence (Number): AWS Comprehend confidence score
- sessionId (String): Session identifier
- timestamp (String): ISO timestamp

**StatisticsTable:**
- id (String, Primary Key): "global"
- totalCount (Number): Total feedback count
- goodCount (Number): Count of "Good" feedback
- badCount (Number): Count of "Bad" feedback
- neutralCount (Number): Count of "Neutral" feedback
- lastUpdated (String): ISO timestamp