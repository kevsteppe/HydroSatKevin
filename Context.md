# HydroSatKevin Development Context

## Project Overview
HydroSatKevin is a customer feedback system POC with sentiment analysis using AWS Comprehend. Built with React frontend and AWS Lambda backend, deployed via GitHub Actions CI/CD.

## Current Status (Updated August 2025)
- **Backend**: Complete with POST /feedback and GET /viewFeedback endpoints, all tests passing (20 tests)
- **Frontend**: Complete feedback form with error handling, comprehensive test coverage (9 tests)
- **CI/CD**: GitHub Actions pipeline working, AWS deployment successful with API URL validation
- **Testing**: Comprehensive Jest test suite - backend DynamoDB mocking resolved, frontend API error handling tested
- **AWS**: Infrastructure deployed, production API confirmed working with real feedback data
- **Performance**: Statistics updates now fire-and-forget for faster API response times

## Architecture Summary
- **Frontend**: React + TypeScript + Vite (multi-page: giveFeedback.html, viewFeedback.html, error.html)
- **Backend**: AWS Lambda + TypeScript, DynamoDB, AWS Comprehend
- **Infrastructure**: AWS SAM template with API Gateway, Lambda, DynamoDB, S3
- **CI/CD**: GitHub Actions with AWS credentials and deployment bucket

## Key Technical Decisions
- **Sentiment Mapping**: POSITIVE→Good, NEGATIVE→Bad, NEUTRAL/MIXED→Neutral
- **Idempotency**: Backend-handled using hash of session + feedback text
- **Session Management**: Browser sessionStorage with crypto.randomUUID()
- **Testing Strategy**: Jest for both backend and frontend (simple tests for now)
- **Build Strategy**: TypeScript compilation excludes test files to avoid Jest globals

## AWS Configuration
- **Region**: us-east-1
- **SAM Deployment Bucket**: hydrosatkevin-sam-deployment-1754074648
- **Stack Name**: hydrosatkevin-prod
- **GitHub Secrets**: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, SAM_DEPLOYMENT_BUCKET

## Recent Issues Fixed
1. **Handler Paths**: Fixed SAM template to use dist/handlers/[file].[function] format
2. **Frontend Build**: Added missing HTML pages, excluded test files from TypeScript compilation
3. **Test Commands**: Fixed GitHub Actions workflow to use correct Jest commands
4. **S3 Policy**: Fixed bucket policy resource reference from ${FrontendBucket} to ${FrontendBucket.Arn}
5. **Vite Types**: Added "vite/client" to tsconfig.json for import.meta.env support
6. **DynamoDB Mocking**: Resolved Jest circular reference issues with AWS SDK v3 mocking using fresh module imports
7. **Test Suite**: All backend tests (20) and frontend tests (9) passing with comprehensive error handling coverage
8. **API URL Configuration**: Fixed production deployment API URL configuration with validation tests
9. **Performance Optimization**: Made statistics updates non-blocking for faster feedback submission
10. **Error Handling**: Implemented separate try-catch blocks for different operation types

## Testing Architecture
- **Backend**: Jest with AWS SDK v3 DynamoDB mocking using fresh module imports pattern
- **Frontend**: React Testing Library with comprehensive API error scenario coverage
- **Pattern**: DynamoDB mocking uses reusable approach with test isolation via dynamic imports
- **Coverage**: All CRUD operations, error scenarios, idempotency checks, statistics updates

## File Structure
```
├── backend/
│   ├── src/
│   │   ├── handlers/ (feedback.ts, viewFeedback.ts)
│   │   ├── services/ (dynamodb.ts, comprehend.ts)
│   │   ├── types/ (feedback.ts)
│   │   └── __tests__/ (basic Jest tests)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/ (FeedbackForm.tsx)
│   │   ├── utils/ (session.ts)
│   │   ├── styles/ (giveFeedback.css)
│   │   └── __tests__/ (basic Jest tests)
│   ├── giveFeedback.html
│   ├── viewFeedback.html
│   ├── error.html
│   └── package.json
├── .github/workflows/deploy.yml
├── template.yaml (AWS SAM - production)
├── template-local.yaml (AWS SAM - local DynamoDB tables)
├── CLAUDE.md (project instructions/work list)
└── Context.md (this file)
```

## API Endpoints (Production: https://deekszj17e.execute-api.us-east-1.amazonaws.com/Prod/)
- **POST /feedback**: Submit customer feedback, returns sentiment analysis (fire-and-forget statistics)
- **GET /viewFeedback**: Returns all feedback (will be available after next deployment)
- **GET /statistics**: Not yet implemented

**Production Data Confirmed**: Real feedback entries with proper sentiment analysis and confidence scores

## Immediate Next Steps
1. ✅ Fixed DynamoDB test mocking issues and async operation handling
2. ✅ All backend tests passing (20 tests) with SuccessFailure enum integration
3. ✅ Frontend tests comprehensive with API error handling (9 tests)
4. ✅ Production API confirmed working with real sentiment analysis data
5. ✅ Performance optimized with non-blocking statistics updates
4. ✅ Fix SAM template endpoint naming (GET /feedback → GET /viewFeedback)
5. Implement GET /statistics endpoint
6. Create proper viewFeedback admin dashboard component
7. Add CloudFront distribution for HTTPS support
8. Monitor AWS deployment pipeline completion

## Development Environment Setup
- **Setup Local Tables**: `cd backend && npm run deploy-local-db` (one-time setup)
- **Local Backend**: `cd backend && npm run build && npm run local` (SAM at localhost:3000)
- **Local Frontend**: `cd frontend && npm run dev` (Vite at localhost:5173)
- **Testing**: `npm test` in respective directories
- **AWS Credentials**: Configured locally, resolved conflicts with work profiles

## Important Notes
- Always ask user to add to commit messages before committing
- Keep todo list and CLAUDE.md work list synchronized
- Frontend bucket name will be auto-generated by AWS (hydrosatkevin-prod-frontend-{account-id})
- User noted concern about Claude's todo list clarity - maintain better tracking
- Tests must pass before deployment, builds must complete successfully
- User chose GitHub Actions for convenience but noted it's rudimentary vs. multi-stage pipelines

## Dependencies
- **Backend**: AWS SDK v3, uuid, TypeScript, Jest
- **Frontend**: React 18, TypeScript, Vite, Jest, @testing-library
- **AWS**: SAM CLI, AWS CLI configured with IAM user "HydroSat" (Administrator Access)

## User Preferences/Context
- Wants to eventually self-code top-k or similar ML features
- Prefers to be prompted for commit message additions
- Fixed local AWS credential conflicts with work environment
- Values explicit progress tracking and synchronization between todo/work lists