use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("SettleNowVault1111111111111111111111111111");

// 1.5% advance fee, in basis points.
pub const FEE_BPS: u64 = 150;
pub const BPS_DENOM: u64 = 10_000;
// $500 pilot cap, micro-USDC (6 decimals).
pub const PILOT_CAP_MICRO: u64 = 500_000_000;
// Max invoice id length (bytes).
pub const MAX_INVOICE_ID_LEN: usize = 32;

#[program]
pub mod settlenow {
    use super::*;

    /// Fund a new vault PDA for an invoice. Transfers `amount` mock-USDC
    /// from funder into the vault token account. Enforces $500 pilot cap.
    pub fn fund(ctx: Context<Fund>, invoice_id: String, amount: u64) -> Result<()> {
        require!(
            !invoice_id.is_empty() && invoice_id.len() <= MAX_INVOICE_ID_LEN,
            SettleError::BadInvoiceId
        );
        require!(amount > 0, SettleError::BadAmount);
        require!(amount <= PILOT_CAP_MICRO, SettleError::OverPilotCap);

        let fee = amount
            .checked_mul(FEE_BPS)
            .and_then(|v| v.checked_div(BPS_DENOM))
            .ok_or(SettleError::MathOverflow)?;

        // Move USDC funder -> vault (mock USDC mint on devnet).
        let cpi = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.funder_ata.to_account_info(),
                to: ctx.accounts.vault_ata.to_account_info(),
                authority: ctx.accounts.funder.to_account_info(),
            },
        );
        token::transfer(cpi, amount)?;

        let vault = &mut ctx.accounts.vault;
        vault.invoice_id = invoice_id;
        vault.funder = ctx.accounts.funder.key();
        vault.supplier = ctx.accounts.supplier.key();
        vault.payer = ctx.accounts.payer.key();
        vault.mint = ctx.accounts.mint.key();
        vault.amount = amount;
        vault.fee = fee;
        vault.bump = ctx.bumps.vault;
        vault.status = VaultStatus::Funded;
        vault.payer_confirmed = false;
        emit!(Funded {
            invoice_id: vault.invoice_id.clone(),
            amount,
            fee,
        });
        Ok(())
    }

    /// Lock the vault once the off-chain invoice is verified.
    /// Only the funder can lock. Funded -> Locked.
    pub fn lock(ctx: Context<Lock>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(vault.status == VaultStatus::Funded, SettleError::BadStatus);
        require!(
            ctx.accounts.funder.key() == vault.funder,
            SettleError::Unauthorized
        );
        vault.status = VaultStatus::Locked;
        emit!(Locked {
            invoice_id: vault.invoice_id.clone()
        });
        Ok(())
    }

    /// Release advance to the supplier. Requires payer confirmation
    /// (payer-confirm flow): `payer_confirmed=true`, vault Locked,
    /// signed by the payer. Pays supplier amount-fee, fee to treasury.
    pub fn release(ctx: Context<Release>, payer_confirmed: bool) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(vault.status == VaultStatus::Locked, SettleError::BadStatus);
        require!(payer_confirmed, SettleError::NeedPayerConfirm);
        require!(
            ctx.accounts.payer.key() == vault.payer,
            SettleError::Unauthorized
        );
        let net = vault
            .amount
            .checked_sub(vault.fee)
            .ok_or(SettleError::MathOverflow)?;

        let seeds: &[&[u8]] = &[b"vault", vault.invoice_id.as_bytes(), &[vault.bump]];
        let signer = &[seeds];

        // net -> supplier
        let cpi_net = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_ata.to_account_info(),
                to: ctx.accounts.supplier_ata.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            signer,
        );
        token::transfer(cpi_net, net)?;

        // fee -> treasury
        if vault.fee > 0 {
            let cpi_fee = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_ata.to_account_info(),
                    to: ctx.accounts.treasury_ata.to_account_info(),
                    authority: ctx.accounts.vault.to_account_info(),
                },
                signer,
            );
            token::transfer(cpi_fee, vault.fee)?;
        }

        vault.status = VaultStatus::Released;
        vault.payer_confirmed = true;
        emit!(Released {
            invoice_id: vault.invoice_id.clone(),
            net,
            fee: vault.fee,
        });
        Ok(())
    }

    /// Repay: payer settles the invoice; vault closes and any residual
    /// goes back to the funder. Locked/Released -> Repaid.
    pub fn repay(ctx: Context<Repay>) -> Result<()> {
        let vault = &ctx.accounts.vault;
        require!(
            vault.status == VaultStatus::Locked || vault.status == VaultStatus::Released,
            SettleError::BadStatus
        );
        require!(
            ctx.accounts.payer.key() == vault.payer,
            SettleError::Unauthorized
        );
        // Close: remaining vault balance back to funder is handled by
        // the `close = funder` constraint on vault_ata draining lamports;
        // token residual transfer (if any) goes first.
        let remaining = ctx.accounts.vault_ata.amount;
        if remaining > 0 {
            let seeds: &[&[u8]] =
                &[b"vault", vault.invoice_id.as_bytes(), &[vault.bump]];
            let cpi = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_ata.to_account_info(),
                    to: ctx.accounts.funder_ata.to_account_info(),
                    authority: ctx.accounts.vault.to_account_info(),
                },
                &[seeds],
            );
            token::transfer(cpi, remaining)?;
        }
        emit!(Repaid {
            invoice_id: vault.invoice_id.clone(),
            residual: remaining,
        });
        Ok(())
    }
}

// ---------------- Accounts ----------------

#[derive(Accounts)]
#[instruction(invoice_id: String)]
pub struct Fund<'info> {
    #[account(mut)]
    pub funder: Signer<'info>,
    /// CHECK: supplier receives advance on release.
    pub supplier: UncheckedAccount<'info>,
    /// CHECK: payer confirms / repays.
    pub payer: UncheckedAccount<'info>,
    /// CHECK: mock USDC mint on devnet.
    pub mint: UncheckedAccount<'info>,
    #[account(
        init,
        payer = funder,
        space = 8 + InvoiceVault::SIZE,
        seeds = [b"vault", invoice_id.as_bytes()],
        bump,
    )]
    pub vault: Account<'info, InvoiceVault>,
    #[account(mut)]
    pub funder_ata: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = funder,
        token::mint = mint,
        token::authority = vault,
    )]
    pub vault_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Lock<'info> {
    pub funder: Signer<'info>,
    #[account(mut, has_one = funder)]
    pub vault: Account<'info, InvoiceVault>,
}

#[derive(Accounts)]
pub struct Release<'info> {
    pub payer: Signer<'info>,
    #[account(mut)]
    pub vault: Account<'info, InvoiceVault>,
    #[account(mut)]
    pub vault_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub supplier_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub treasury_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Repay<'info> {
    pub payer: Signer<'info>,
    #[account(mut, close = funder)]
    pub vault: Account<'info, InvoiceVault>,
    /// CHECK: receives closed vault lamports.
    #[account(mut)]
    pub funder: UncheckedAccount<'info>,
    #[account(mut)]
    pub vault_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub funder_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct InvoiceVault {
    pub invoice_id: String, // max 32 chars
    pub funder: Pubkey,
    pub supplier: Pubkey,
    pub payer: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub fee: u64,
    pub bump: u8,
    pub status: VaultStatus,
    pub payer_confirmed: bool,
}

impl InvoiceVault {
    // 4 (str prefix) + 32 + 32*4 (pubkeys) + 8 + 8 + 1 + 1 (enum) + 1 (bool)
    pub const SIZE: usize = 4 + 32 + 128 + 8 + 8 + 1 + 1 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum VaultStatus {
    Funded,
    Locked,
    Released,
    Repaid,
}

#[event]
pub struct Funded {
    pub invoice_id: String,
    pub amount: u64,
    pub fee: u64,
}

#[event]
pub struct Locked {
    pub invoice_id: String,
}

#[event]
pub struct Released {
    pub invoice_id: String,
    pub net: u64,
    pub fee: u64,
}

#[event]
pub struct Repaid {
    pub invoice_id: String,
    pub residual: u64,
}

#[error_code]
pub enum SettleError {
    #[msg("invoice id must be 1-32 chars")]
    BadInvoiceId,
    #[msg("amount must be > 0")]
    BadAmount,
    #[msg("amount exceeds $500 pilot cap")]
    OverPilotCap,
    #[msg("wrong vault status for this instruction")]
    BadStatus,
    #[msg("payer confirmation required (payer_confirmed=true, payer signer)")]
    NeedPayerConfirm,
    #[msg("unauthorized signer for this vault")]
    Unauthorized,
    #[msg("math overflow")]
    MathOverflow,
}
