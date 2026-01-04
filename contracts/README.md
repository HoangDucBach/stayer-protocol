# Stayer Protocol

A dual-layer DeFi protocol on Casper Network: **Performance-based Liquid Staking** + **CDP Stablecoin**.

## Protocol Overview

```
CSPR → [Liquid Staking] → ySCSPR → [CDP Vault] → cUSD
         (stake)         (collateral)  (borrow)
```

Users stake CSPR to validators, receive **ySCSPR** with performance multipliers, then use ySCSPR as collateral to mint **cUSD** stablecoin.

---

## Layer 1: Liquid Staking

### Mechanism

1. User stakes CSPR → selects validator
2. Protocol calculates **performance multiplier** based on validator p_score
3. User receives ySCSPR with multiplier applied
4. Keeper delegates CSPR to validators via auction contract

### Performance Multiplier Formula

```
multiplier = (validator_p_score / network_p_avg) × 10000

Capped: MIN = 0.5x (5000), MAX = 1.5x (15000)
```

**Example:**
- Validator p_score = 120, Network avg = 100
- Multiplier = 120/100 = 1.2x
- Stake 1000 CSPR → Receive 1200 ySCSPR

### Exchange Rate

```
exchange_rate = total_staked_cspr / total_yscspr_supply
```

As staking rewards accumulate, exchange rate increases → ySCSPR appreciates.

### Delegation Flow

```
User stake() → Contract holds CSPR + mints ySCSPR
                        ↓
Keeper (hourly) → withdraw_for_delegation()
                        ↓
Keeper → auction.delegate(validator, amount)
                        ↓
Keeper → confirm_delegation()
```

### Unbonding

- Request unstake → 7 era waiting period (~14 hours)
- After unbonding → claim CSPR

---

## Layer 2: CDP Vault (Stayer)

### Mechanism

Users deposit ySCSPR as collateral to borrow cUSD stablecoin.

### Core Parameters

| Parameter             | Value    | Description           |
| --------------------- | -------- | --------------------- |
| LTV                   | 50%      | Max borrow ratio      |
| Liquidation Threshold | 110%     | Min collateral ratio  |
| Liquidation Penalty   | 10%      | Bonus for liquidators |
| Stability Fee         | 2% APR   | Interest on debt      |
| Min Collateral        | 100 CSPR | Minimum deposit       |

### Health Factor

```
health_factor = (collateral_value × liq_threshold) / debt_value

health_factor > 100% → Safe
health_factor < 100% → Liquidatable
```

### Borrow Calculation

```
max_borrow = collateral_value × LTV / price

Example:
- Collateral: 1000 ySCSPR @ $4/CSPR = $4000
- Max borrow: $4000 × 50% = $2000 cUSD
```

### Liquidation

When health factor < 100%, anyone can liquidate:

```
collateral_seized = (debt_to_cover × (1 + penalty)) / price

Example:
- Cover 500 cUSD debt
- Price = $2/CSPR
- Seized: 500 × 1.1 / 2 = 275 CSPR
- Liquidator profit: 10%
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Stayer Protocol                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐     ┌──────────────┐              │
│  │ LiquidStaking│────▶│   ySCSPR     │              │
│  └──────┬───────┘     └──────┬───────┘              │
│         │                    │                       │
│         ▼                    ▼                       │
│  ┌──────────────┐     ┌──────────────┐              │
│  │  Validators  │     │ StayerVault  │──▶ cUSD     │
│  │ (via Keeper) │     │    (CDP)     │              │
│  └──────────────┘     └──────┬───────┘              │
│                              │                       │
│                       ┌──────▼───────┐              │
│                       │   Oracle     │              │
│                       │   (Styks)    │              │
│                       └──────────────┘              │
└─────────────────────────────────────────────────────┘
```

### Contracts

| Contract              | Function                                    |
| --------------------- | ------------------------------------------- |
| **LiquidStaking**     | Stake CSPR, mint ySCSPR, manage delegations |
| **ValidatorRegistry** | Track validator performance scores          |
| **StayerVault**       | CDP logic, borrow/repay cUSD                |
| **ySCSPR**            | Yield-bearing staked CSPR token (CEP-18)    |
| **cUSD**              | Stablecoin (CEP-18)                         |
| **PriceOracle**       | CSPR/USD price feed (Styks integration)     |

---

## Keeper Service

Off-chain service that manages:

| Task             | Interval | Function                    |
| ---------------- | -------- | --------------------------- |
| Validator Update | 1 hour   | Sync p_scores from network  |
| Delegation       | 1 hour   | Process pending delegations |
| Harvest Rewards  | 2 hours  | Update exchange rate        |
| Withdrawals      | 30 min   | Process matured unstakes    |

---

## Risk Parameters

### Oracle Safety

- Staleness check: 2 hour max
- Fallback price mechanism
- Price bounds validation

### Protocol Safety

- Min collateral requirements
- Max withdrawal per tx (10% of pool)
- Pause functionality

---

## License

MIT
