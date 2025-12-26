# Stayer Protocol Keeper

NestJS-based keeper service for Stayer Protocol on Casper Network.

## Features

- **Validator Registry Updates**: Fetches validator data from Casper Network and updates ValidatorRegistry contract
- **Reward Harvesting**: Periodically harvests staking rewards for LiquidStaking contract
- **Withdrawal Processing**: Processes matured withdrawal requests
- **Scheduled Tasks**: Automated execution via cron jobs
- **Manual Triggers**: REST API endpoints for manual execution

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- `KEEPER_PRIVATE_KEY_PATH`: Path to your keeper account private key PEM file
- `VALIDATOR_REGISTRY_CONTRACT_PACKAGE_HASH`: ValidatorRegistry contract hash
- `LIQUID_STAKING_CONTRACT_PACKAGE_HASH`: LiquidStaking contract hash
- `CSPR_CLOUD_API_KEY` (optional): API key for CSPR.cloud validator performance data
- `CSPR_CLOUD_API_URL` (optional): CSPR.cloud API endpoint (default: https://api.cspr.cloud)

3. Start the service:
```bash
npm run start
```

For development:
```bash
npm run start:dev
```

## API Endpoints

- `GET /` - Service status
- `POST /update-validators` - Manually trigger validator update
- `POST /harvest-rewards` - Manually trigger reward harvest
- `POST /process-withdrawals` - Manually trigger withdrawal processing

## Scheduled Tasks

- Validator updates: Every hour
- Reward harvesting: Every 2 hours
- Withdrawal processing: Every 30 minutes

## Architecture

```
src/
├── casper/              # Casper SDK integration
├── config/              # Configuration
├── validator-registry/  # Validator update logic
├── liquid-staking/      # Reward & withdrawal logic
├── scheduler/           # Cron job scheduling
└── app.module.ts        # Main app module
```
