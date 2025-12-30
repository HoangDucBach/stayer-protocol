export type ValidatorData = {
  fee: number;
  is_active: boolean;
  decay_factor: number;
  p_score: number;
  updated_era: number;
};

export type LiquidStakingStats = {
  total_staked: string;
  total_pending_withdrawal: string;
  cumulative_rewards: string;
  exchange_rate: string;
};

export type UserStake = {
  amount: string;
};

export type WithdrawalRequest = {
  user: string;
  amount: string;
  unlock_era: number;
  status: "Pending" | "Claimed";
};

export type StakePayload = {
  validatorPublicKey: string;
  amount: string;
  currentEra: number;
  waitForConfirmation?: boolean;
};

export type UnstakePayload = {
  validatorPublicKey: string;
  yscspr_amount: string;
  currentEra: number;
  waitForConfirmation?: boolean;
};

export type ClaimPayload = {
  requestId: number;
  waitForConfirmation?: boolean;
};

export type Position = {
  owner: string;
  collateral: string;
  debt: string;
  entry_price: string;
  opened_at: number;
};

export type VaultParams = {
  ltv: number;
  liq_threshold: number;
  liq_penalty: number;
  stability_fee: number;
  min_collateral: string;
};

export type DepositPayload = {
  amount: string;
  waitForConfirmation?: boolean;
};

export type BorrowPayload = {
  cusdAmount: string;
  waitForConfirmation?: boolean;
};

export type RepayPayload = {
  cusdAmount: string;
  waitForConfirmation?: boolean;
};

export type WithdrawPayload = {
  collateralAmount: string;
  waitForConfirmation?: boolean;
};

export type LiquidatePayload = {
  userAddress: string;
  waitForConfirmation?: boolean;
};

export type TransferPayload = {
  recipient: string;
  amount: string;
  waitForConfirmation?: boolean;
};

export type ApprovePayload = {
  spender: string;
  amount: string;
  waitForConfirmation?: boolean;
};

export type TokenInfo = {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
};

export type DeployResult = {
  deployHash: string;
  executionResult: {
    success: boolean;
    errorMessage?: string;
    cost?: string;
  };
  blockHash?: string;
};

export type TransactionResult = {
  transactionHash: string;
  executionResult: {
    success: boolean;
    errorMessage?: string;
    cost?: string;
  };
  blockHash?: string;
};
