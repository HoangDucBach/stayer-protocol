# Stayer Protocol

A dual-layer DeFi protocol on Casper Network combining performance-based liquid staking with CDP stablecoin lending.

Stayer Protocol is built on Casper Network using Odra Framework v2.4. Users stake CSPR to receive ySCSPR with performance-adjusted multipliers, then use ySCSPR as collateral to mint cUSD—unlocking liquidity while earning staking rewards.

## Overview

Stayer Protocol allows users to:

- Deposit sCSPR (Staked CSPR) as collateral
- Receive ySCSPR (Yield Staked CSPR) tokens representing collateral
- Borrow cUSD (Casper USD) stablecoin based on collateral value
- Manage risk through automated liquidation system

## System Architecture

```txt
┌─────────────────────────────────────────────────────────────┐
│                     Stayer Protocol                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Oracle     │───▶│ StayerVault  │◀──▶│    cUSD      │ │
│  │ (PriceOracle)│    │   (Main CDP) │    │ (Stablecoin) │ │
│  └──────────────┘    └──────┬───────┘    └──────────────┘ │
│         ▲                   │                              │
│         │                   ▼                              │
│    ┌────┴─────┐      ┌──────────────┐                     │
│    │  Styks   │      │   ySCSPR     │                     │
│    │ (Oracle) │      │ (Yield Token)│                     │
│    └──────────┘      └──────────────┘                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Smart Contracts

### 1. StayerVault - Main CDP Vault

Location: `stayer/src/stayer.rs`

Core contract managing all CDP logic:

Main Functions:

- `deposit()` - Deposit sCSPR, receive ySCSPR (without borrowing)
- `borrow(cusd_amount)` - Borrow cUSD based on collateral
- `repay(cusd_amount)` - Repay cUSD debt
- `withdraw(yscspr_amount)` - Withdraw collateral (burns ySCSPR)
- `liquidate(user, debt_to_cover)` - Liquidate undercollateralized positions

Cross-contract Interfaces:

```rust
#[odra::external_contract]
pub trait PriceOracleContract {
    fn get_price(&self) -> U256;
}

#[odra::external_contract]
pub trait CUSDContract {
    fn mint(&mut self, to: Address, amount: U256);
    fn burn(&mut self, from: Address, amount: U256);
}

#[odra::external_contract]
pub trait YSCSPRContract {
    fn mint(&mut self, to: Address, amount: U256);
    fn burn(&mut self, from: Address, amount: U256);
}
```

Default Parameters:

- LTV (Loan-to-Value): 50% (5000 bps)
- Liquidation Threshold: 110% (11000 bps)
- Liquidation Penalty: 10% (1000 bps)
- Stability Fee: 2% APR (200 bps)
- Min Collateral: 100 CSPR

### 2. PriceOracle - Price Feed Oracle

Location: `oracle/src/oracle.rs`

Oracle contract integrated with Styks to fetch CSPR/USD price.

Functions:

- `get_price()` - Get current CSPR price (with fallback + staleness check)
- `fetch_from_styks(feed_id)` - Pull price from Styks Oracle
- `update_price(new_price)` - Push price manually (keeper only)
- `set_fallback_price(price)` - Set fallback price
- `set_use_fallback(enabled)` - Enable/disable fallback mode

Styks Integration:

```rust
#[odra::external_contract]
pub trait StyksPriceFeedContract {
    fn get_twap_price(&self, id: String) -> Option<u64>;
}
```

Safety Features:

- Circuit Breaker: Automatically switches to fallback if price is older than 2 hours
- Sanity Checks: Price must be within [MIN, MAX] range
- Admin Controls: Only owner can configure settings

### 3. cUSD - Casper USD Stablecoin

Location: `cusd/src/cusd.rs`

CEP-18 compliant stablecoin using `odra_modules::cep18_token::Cep18`.

Specifications:

- Name: "Casper USD"
- Symbol: "cUSD"
- Decimals: 9
- Initial Supply: 0 (only minted when collateral exists)

Permissions:

- Only Vault contract can `mint/burn`
- Owner can change Vault address

### 4. ySCSPR - Yield Staked CSPR Token

Location: `yscspr/src/yscspr.rs`

CEP-18 compliant token representing collateral in the vault.

Specifications:

- Name: "Yield Staked CSPR"
- Symbol: "ySCSPR"
- Decimals: 9
- Mint ratio: 1:1 with deposited sCSPR

Notes:

- Users must hold ySCSPR to withdraw collateral
- ySCSPR is transferable, enabling collateral ownership transfer

## User Flows

### Flow 1: Deposit & Borrow

```txt
User                    StayerVault              Oracle        cUSD        ySCSPR
 │                           │                      │            │            │
 │──deposit(1000 CSPR)──────▶│                      │            │            │
 │                           │──get_price()────────▶│            │            │
 │                           │◀──400 cents──────────│            │            │
 │                           │──────────────────────────────mint─▶│
 │                           │           (1000 ySCSPR)            │
 │◀────1000 ySCSPR───────────│                                    │
 │                           │                                    │
 │──borrow(500 cUSD)────────▶│                                    │
 │                           │──get_price()────────▶│            │
 │                           │◀──400 cents──────────│            │
 │                           │────mint(500)─────────────────────▶│
 │◀────500 cUSD──────────────│                                    │
```

Calculation:

- Collateral Value: 1000 CSPR × $4.00 = $4,000
- Max Borrowable (50% LTV): $4,000 × 50% = $2,000 cUSD
- User borrows: $500 cUSD (safe, only 12.5% of collateral value)
- Health Factor: ($4,000 × 110%) / $500 = 880% (very healthy)

### Flow 2: Repay & Withdraw

```txt
User                    StayerVault              cUSD        ySCSPR
 │                           │                      │            │
 │──repay(500 cUSD)─────────▶│                      │            │
 │                           │────burn(500)────────▶│            │
 │◀────OK────────────────────│                                   │
 │                           │                                   │
 │──withdraw(1000 ySCSPR)───▶│                                   │
 │                           │────burn(1000)───────────────────▶│
 │◀────1000 CSPR─────────────│                                   │
```

### Flow 3: Liquidation (when CSPR price drops)

```
Liquidator              StayerVault              cUSD        Oracle
 │                           │                      │            │
 │──liquidate(user, 500)────▶│                      │            │
 │                           │──get_price()────────────────────▶│
 │                           │◀──200 cents (dropped from $4→$2)─│
 │                           │                                   │
 │                           │  Health Factor Check:            │
 │                           │  (1000×$2×110%)/$500 = 44% < 100%│
 │                           │  → Undercollateralized!          │
 │                           │                                   │
 │                           │────burn(500 from liquidator)────▶│
 │◀────275 CSPR──────────────│                                   │
 │  (500/2 × 1.1 = 275 CSPR) │                                   │
```

Liquidator Profit:

- Pays 500 cUSD (= $500)
- Receives 275 CSPR × $2 = $550
- Profit: $50 (10% liquidation bonus)

## Safety Mechanisms

### 1. Health Factor

```txt
Health Factor = (Collateral Value × Liquidation Threshold) / Debt Value
```

- Greater than 100%: Position is safe
- Less than 100%: Position can be liquidated

### 2. Circuit Breaker (Oracle)

- If price is not updated for more than 2 hours, automatically uses fallback price
- Owner can manually enable fallback mode

### 3. Access Control

- Vault: Only owner can change parameters, oracle, or pause
- cUSD/ySCSPR: Only vault can mint/burn
- Oracle: Only owner can configure, only updaters can push prices

## Deployed Addresses

| Contract | Address |
| --- | --- |
| PriceOracle | `hash-3afd2f0f52a2b8de66c44b6ba97e6f056b5d9862fbb8736e647555ca242e74f9` |
| ValidatorRegistry | `hash-976b6dc755f25fc6d2052e9a00d95c0a84516185a9ebad52a9df38482c09dee3` |
| cUSD | `hash-eb59671387ed97325728ac586477899db2f43c1cffd963b7937e696f2389a3a1` |
| ySCSPR | `hash-c381d0f5faff2d59badd6606fd696691c3fcccc0700ce897336461171eec92e6` |
| LiquidStaking | `hash-4470231de5e030712f19811893339988fcc51f1bd8a3a10c6732dd5481c0fef5` |
| StayerVault | `hash-ccfa385e56c514710643f171154eab09512a4650de5ee52c90af09d3ef40dddb` |

## License

MIT License
