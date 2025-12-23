# Stayer Protocol

CDP-style Collateralized Stablecoin Protocol on Casper Network

Stayer Protocol là một hệ thống stablecoin được thế chấp (CDP - Collateralized Debt Position) được xây dựng trên Casper Network sử dụng Odra Framework v2.4.

## Tổng quan

Stayer Protocol cho phép người dùng:

- **Gửi sCSPR** (Staked CSPR) làm tài sản thế chấp
- **Nhận ySCSPR** (Yield Staked CSPR) token đại diện cho collateral
- **Vay cUSD** (Casper USD) stablecoin dựa trên giá trị thế chấp
- **Quản lý rủi ro** thông qua hệ thống thanh lý tự động

## Kiến trúc hệ thống

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

### 1. **StayerVault** - Main CDP Vault

**Location:** `stayer/src/stayer.rs`

Core contract quản lý toàn bộ logic CDP:

**Các chức năng chính:**

- `deposit()` - Gửi sCSPR, nhận ySCSPR (không vay)
- `borrow(cusd_amount)` - Vay cUSD dựa trên collateral
- `repay(cusd_amount)` - Trả nợ cUSD
- `withdraw(yscspr_amount)` - Rút collateral (đốt ySCSPR)
- `liquidate(user, debt_to_cover)` - Thanh lý vị thế yếu

**Cross-contract Interfaces:**

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

**Tham số mặc định:**

- LTV (Loan-to-Value): 50% (5000 bps)
- Liquidation Threshold: 110% (11000 bps)
- Liquidation Penalty: 10% (1000 bps)
- Stability Fee: 2% APR (200 bps)
- Min Collateral: 100 CSPR

### 2. **PriceOracle** - Price Feed Oracle

**Location:** `oracle/src/oracle.rs`

Oracle hợp đồng tích hợp với Styks để lấy giá CSPR/USD.

**Các chức năng:**

- `get_price()` - Lấy giá CSPR hiện tại (với fallback + staleness check)
- `fetch_from_styks(feed_id)` - Pull giá từ Styks Oracle
- `update_price(new_price)` - Push giá thủ công (keeper only)
- `set_fallback_price(price)` - Thiết lập giá dự phòng
- `set_use_fallback(enabled)` - Bật/tắt chế độ fallback

**Styks Integration:**

```rust
#[odra::external_contract]
pub trait StyksPriceFeedContract {
    fn get_twap_price(&self, id: String) -> Option<u64>;
}
```

**Bảo vệ:**

- Circuit Breaker: Tự động chuyển sang fallback nếu giá cũ quá 2h
- Sanity Checks: Giá phải nằm trong khoảng [MIN, MAX]
- Admin Controls: Chỉ owner có thể config

### 3. **cUSD** - Casper USD Stablecoin

**Location:** `cusd/src/cusd.rs`

CEP-18 compliant stablecoin sử dụng `odra_modules::cep18_token::Cep18`.

**Đặc điểm:**

- Name: "Casper USD"
- Symbol: "cUSD"
- Decimals: 9
- Initial Supply: 0 (chỉ mint khi có collateral)

**Quyền:**

- Chỉ Vault contract được phép `mint/burn`
- Owner có thể thay đổi Vault address

### 4. **ySCSPR** - Yield Staked CSPR Token

**Location:** `yscspr/src/yscspr.rs`

CEP-18 compliant token đại diện cho collateral trong vault.

**Đặc điểm:**

- Name: "Yield Staked CSPR"
- Symbol: "ySCSPR"
- Decimals: 9
- Mint ratio: 1:1 với sCSPR gửi vào

**Lưu ý:**

- User cần giữ ySCSPR để rút collateral
- Có thể transfer ySCSPR → Chuyển quyền sở hữu collateral

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

**Tính toán:**

- Collateral Value: 1000 CSPR × $4.00 = $4,000
- Max Borrowable (50% LTV): $4,000 × 50% = $2,000 cUSD
- User vay: $500 cUSD (an toàn, chỉ 12.5% collateral value)
- Health Factor: ($4,000 × 110%) / $500 = 880% (rất khỏe)

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

### Flow 3: Liquidation (khi giá CSPR giảm)

```
Liquidator              StayerVault              cUSD        Oracle
 │                           │                      │            │
 │──liquidate(user, 500)────▶│                      │            │
 │                           │──get_price()────────────────────▶│
 │                           │◀──200 cents (giảm từ $4→$2)─────│
 │                           │                                   │
 │                           │  Health Factor Check:            │
 │                           │  (1000×$2×110%)/$500 = 44% < 100%│
 │                           │  → Undercollateralized!          │
 │                           │                                   │
 │                           │────burn(500 from liquidator)────▶│
 │◀────275 CSPR──────────────│                                   │
 │  (500/2 × 1.1 = 275 CSPR) │                                   │
```

**Lợi nhuận Liquidator:**

- Trả 500 cUSD (= $500)
- Nhận 275 CSPR × $2 = $550
- Profit: $50 (10% liquidation bonus)

## Cơ chế bảo vệ

### 1. Health Factor

```txt
Health Factor = (Collateral Value × Liquidation Threshold) / Debt Value
```

- **> 100%**: Vị thế an toàn
- **< 100%**: Có thể bị thanh lý

### 2. Circuit Breaker (Oracle)

- Nếu giá > 2h không update → Tự động dùng fallback price
- Owner có thể manually enable fallback mode

### 3. Access Control

- **Vault**: Chỉ owner thay đổi params, oracle, pause
- **cUSD/ySCSPR**: Chỉ vault mint/burn
- **Oracle**: Chỉ owner config, chỉ updaters push giá

## Testing

### Run all tests

```bash
cargo test --workspace --lib
```

### Test individual contracts

```bash
cargo test -p stayer --lib
cargo test -p cusd --lib
cargo test -p yscspr --lib
cargo test -p oracle --lib
```

### Build all contracts

```bash
cargo build --workspace
```

## Deployment Flow

1. **Deploy Tokens:**

   ```rust
   // Deploy cUSD with placeholder vault address
   let cusd = CUSD::deploy(env, placeholder_address);

   // Deploy ySCSPR with placeholder vault address
   let yscspr = YSCSPR::deploy(env, placeholder_address);
   ```

2. **Deploy Oracle:**

   ```rust
   // Deploy PriceOracle with initial price and Styks address
   let oracle = PriceOracle::deploy(env, (
       U256::from(400), // $4.00 initial price
       styks_address
   ));
   ```

3. **Deploy Vault:**

   ```rust
   let vault = StayerVault::deploy(env, (
       oracle.address(),
       cusd.address(),
       yscspr.address()
   ));
   ```

4. **Configure Tokens:**

   ```rust
   // Set vault as authorized minter/burner
   cusd.set_vault(vault.address());
   yscspr.set_vault(vault.address());
   ```

5. **Configure Oracle:**

   ```rust
   oracle.fetch_from_styks("CSPRUSD".to_string());
   ```

## Critical Notes

⚠️ **QUAN TRỌNG:**

1. **Oracle Dependency**: Toàn bộ hệ thống phụ thuộc vào Oracle. Nếu Oracle sai giá → Thanh lý oan hoặc bad debt.

2. **Vault as Single Point**: Vault contract được quyền mint unlimited cUSD. Nếu vault bị hack → Collapse.

3. **Parameter nam**: Các tham số (LTV, Liquidation Threshold) cần được chọn cẩn thận:
   - LTV quá cao → Dễ liquidation
   - Liquidation Threshold quá thấp → Bad debt risk

4. **Testing Required**: Cần test kỹ với:
   - Price volatility scenarios
   - Liquidation cascades
   - Oracle failures
   - Cross-contract call failures

## License

MIT License

## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Contact

Project Link: [https://github.com/yourusername/stayer-protocol](https://github.com/yourusername/stayer-protocol)
