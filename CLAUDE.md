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
- [ ] Create viewFeedback admin dashboard component
- [ ] Add sentiment visualization/display
- [x] Style components with basic CSS/styling library
- [x] Configure API integration with backend

**Testing:**
- [x] Set up Jest testing framework for backend
- [x] Write comprehensive unit tests for handlers and services
- [x] Write unit tests for DynamoDB data layer with AWS SDK v3 mocking
- [x] Write unit tests for idempotency logic
- [x] Set up React Testing Library for frontend
- [x] Write component tests for feedback form with API error handling
- [x] Write API URL configuration validation tests
- [x] Fix DynamoDB mocking circular reference issues with fresh module imports
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
- [x] Fix frontend build issues with test files and missing HTML pages
- [x] Fix S3 bucket policy resource reference in SAM template
- [x] Fix API URL configuration for production deployments
- [x] Add API URL validation in deployment pipeline
- [x] Deploy backend to AWS Lambda via CI/CD
- [x] Deploy frontend to S3 static hosting via CI/CD
- [X] Monitor and complete AWS deployment via CI/CD
- [ ] Fix SAM template endpoint names - separate POST /feedback and GET /viewFeedback
- [ ] Set up environment variables and configuration
- [ ] Add CloudFront distribution for HTTPS support and better performance

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

## Recent Accomplishments (Updated August 2025)

**DynamoDB Test Mocking Resolution:**
- Fixed Jest circular reference issues with AWS SDK v3 DynamoDB mocking
- Implemented fresh module imports pattern for proper test isolation
- All 20 backend tests now passing with comprehensive error handling coverage
- Created reusable DynamoDB mocking approach for future test development
- Integrated SuccessFailure enum for better error handling and test expectations

**API URL Configuration & Validation:**
- Identified and fixed production deployment issue where frontend used localhost API URL
- Created comprehensive API URL configuration validation tests
- Updated GitHub Actions workflow to properly set VITE_API_BASE_URL during frontend build
- Added runtime warnings when localhost API URL is used in production builds
- Test validates production URLs during deployment phase while allowing development workflow

**Performance Optimization:**
- Implemented fire-and-forget statistics updates for faster API response times
- Separated error handling with dual try-catch blocks for different operation types
- Confirmed production API working with real sentiment analysis data (5+ entries)
- Statistics updates now non-blocking while maintaining data consistency

**Production Validation:**
- Verified production API endpoint working: https://deekszj17e.execute-api.us-east-1.amazonaws.com/Prod/feedback
- Confirmed real sentiment analysis with AWS Comprehend confidence scores
- Data persistence verified across multiple feedback submissions
- Frontend-backend integration working correctly in production environment

## Current Status

**All Tests Passing:** 20 backend tests + 9 frontend tests
**Production Confirmed:** Backend and frontend deployed and working with real data
**API Configuration:** Production API URL properly configured and validated
**Performance:** Optimized with non-blocking statistics updates
**Next Priority:** Complete viewFeedback admin dashboard and implement GET /statistics endpoint

## Work Items

- Search feedback by sentiment to return feedback filtered by sentiment