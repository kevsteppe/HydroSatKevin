# HydroSatKevin

The submission of the take-home is now ready.

### Access
- The code is available on GitHub, repo name HydroSatKevin.  Collaborator access has been provided to you
- The website is hosted from S3 here: http://hydrosatkevin-prod-frontendbucket-rofeyt1samij.s3-website-us-east-1.amazonaws.com/
- You are welcome to enter some feedback.  Find the link to Admin at the bottom of the page.  The Statistics cards at
the top are clickable to filter the feedback entries.  There's no link back to the feedback.

## Architecture Overview
- React for front-end
- Node.js 22 running on AWS lambda for the handlers/backend
- Data stored in 2 DDB tables, one for feedback, one for the summarized statistics
- Sentiment analysis provided by AWS Comprehend

### Database Structure
- The feedback table has: id, text, sentiment, confidence, timestamp, idempotencyKey
- Secondary index: idempotencyKey
- TODO: it would be good to make an index for sentiment as well, but it's ok for POC
- The statistics table has: goodCount, badCount, neutralCount, totalCount, lastUpdated
- The statistics table has only one entry that is updated in place.
- More discussion on these below

### Build, Deploy, CI/CD
- There is both a local and a prod build.  The local build still uses Amazon DDB, but a separate set of tables
- Prod build and deploy is fully CD with GitHub Actions.  
- Mostly idempotent deploys. If a deployment rolls back, then next deploy will handle the clean-up by deleting the old
stack and replacing it (data is retained), so we can always deploy.  This is simple/naive mechanism, but convenient for
the POC.
- I haven't tried the local setup for a while, so I don't promise it's still good.

## Added Features
- Additions to the stored feedback is idempotent (no-duplicates) based on sessionId + text; duplicate sends of the same 
text from the same session are only entered once.
- I keep a running total count of Good, Bad, Neutral feedbacks.  These are displayed at the top of the Admin page for
easy reference.
- The feedback can be filtered by sentiment in the Admin page by clicking on the cards
- Updates to the statistics table are fully asynch/fire-and-forget to not block posting feedback. (more on this later)

## Architecture Discussion
- I chose AWS as I'm familiar with it generally, DDB, and Lambda.
- I chose DDB as it would enable scaling up to a large number of feedback writes.  That's overkill for a POC, but it's 
also very easy to start using and entering data.  Other object stores would mean more setup.  There's now relational
structure to the data, so no point using an RDBMS.  DDB storage can get expensive, so an archive policy might make 
sense in future.  
- While the front-end makes it hard to accidentally post text twice, with flaky networks, unreliable browsers, robots, etc 
it's nice to have an easy way to unsure non-duplicate feedback.  An idempotencyKey is standard and straight forward
so I added it.
- A statistics overview seemed obviously more useful than just a list of feedback text, so I added that early on.  This
makes the stats display fast and easy.  
- I assumed the consumer wants a quick response and only cares that the feedback is entered.  It's unlikely that the stats
update will fail when the feedback update succeeds, so I did not await on the stats update.  For this POC the difference
is negligable, but I wanted to illustrate the concept.
- Making the stats update fully async creates possibly non-atomic updates. This is managed in two ways.  1) I refactored
the postFeedback to do error handling in three parts: first validate and analyze, if that throws an error the function 
fails.  Second update the statistics, which does not throw errors, just log failures.  Third update the feedback table, 
if that throws an error, the stats update is reversed.  This should generally keep the two tables in synch, but it's 
inherently not atomic. So 2) we should have an occasional sync query that checks for diffs between the tables.  I did
not implement a synch - there are a lot of corner cases and issues at scale there too.
- I used GitHub Actions for CI/CD as it was expedient and convenient.  AWS pipelines are a bit expensive for what they 
provide, so Actions seemed sufficient for this POC.  Overall it worked fine for this simple case, though I didn't like
the UI.

### Architecture todos / future add-ons
- I originally intended to create some Cypress tests to check the UI and full end-to-end behavior, but I didn't get to it.
- Now that I have an option to filter the feedback based on sentiment, it would be better to have a secondary index in
  the feedback table for that. 
- As discussed above, the feedback and stats should have a synch up.  It would probably be good to do this (I can't think
of the term ) by making a snapshot of the stats - perhaps daily or hourly - and making an immutable record of the count
up to that point.  Then the synch can count from there to "now".  This will guarentee eventual consistency if the DB
quieces.
- A Beta stage would be nice at some point

## Coding
- Because my typescript is limited/rusty, I knew it would be easier to edit a basic implementation rather than start 
from scratch.
- My previous way to do this was to ask a GenAI to do a first draft, and then edit.  So I asked Claude Code for a first
draft.
- This time, Claude did so well at this that I continued to use it extensively for writing and editing code.
- I did not like some of the choices in postFeedback function in the feedback handler.  In refactoring, I rewrote most 
of this function.  The error blocks, asynch stats update, stats reversal, createResponse utility are all mine.  I do think some
further cleanup would be better, but decided it was time to stop.
- For practice and more samples, I wrote the DDB getFilteredFeedback function from scratch.  

