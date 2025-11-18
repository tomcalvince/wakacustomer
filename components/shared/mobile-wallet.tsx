/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import * as React from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import WalletActionDrawer from "@/components/shared/wallet-action-drawer"
import { cn } from "@/lib/utils"
import { useWallet, useWalletTransactions } from "@/lib/hooks/use-wallet"
import { Transaction } from "@/types/wallet"
import { ChevronRightIcon, CalendarDaysIcon, EyeSlashIcon } from "@heroicons/react/24/outline"
import { ArrowDownIcon, EyeIcon, PlusCircleIcon } from "@heroicons/react/24/solid"
import { BanknoteArrowUp } from "lucide-react"

type Txn = {
  id: string
  date: string // ISO
  title: string
  subtitle?: string
  amount: number // positive for credit, negative for debit
  type: "commission" | "payout" | "repayment" | "adjustment"
  currency?: string
}

const currency = (value: number, code = "UGX") =>
  new Intl.NumberFormat("en-UG", { style: "currency", currency: code, maximumFractionDigits: 2 }).format(value)

function groupByDate(transactions: Txn[]) {
  const groups: Record<string, Txn[]> = {}
  for (const t of transactions) {
    const d = new Date(t.date)
    const key = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
    groups[key] = groups[key] || []
    groups[key].push(t)
  }
  return groups
}

/**
 * Maps API transaction category to UI transaction type
 */
function mapTransactionType(category: string, transactionType: "credit" | "debit"): Txn["type"] {
  // Top-ups - map to adjustment
  if (
    category === "topup_admin" ||
    category === "topup_mobile_money" ||
    category === "topup_bank_transfer" ||
    category === "topup_mpesa" ||
    category === "topup_airtel_money" ||
    category === "topup_momo" ||
    category === "topup_cash"
  ) {
    return "adjustment"
  }

  // Commission and earnings - map to commission
  if (category === "commission" || category === "rider_earning") {
    return "commission"
  }

  // Withdrawals - map to payout
  if (
    category === "withdrawal_bank" ||
    category === "withdrawal_mpesa" ||
    category === "withdrawal_airtel_money" ||
    category === "withdrawal_momo" ||
    category === "withdrawal_cash"
  ) {
    return "payout"
  }

  // Expenses and deductions - map to repayment (debit transactions)
  if (category === "cash_collection" || category === "order_payment") {
    return "repayment"
  }

  // Refund - could be credit or debit, map based on transaction type
  if (category === "refund") {
    return transactionType === "credit" ? "adjustment" : "repayment"
  }

  // Default based on transaction type
  return transactionType === "credit" ? "adjustment" : "repayment"
}

/**
 * Converts API Transaction to UI Txn format
 */
function mapTransactionToTxn(transaction: Transaction, currency: string): Txn {
  const amount = parseFloat(transaction.amount)
  // Use transaction_type_display if available, otherwise fall back to transaction_type
  const isCredit =
    transaction.transaction_type_display === "Credit" ||
    transaction.transaction_type === "credit"
  const mappedAmount = isCredit ? amount : -amount

  // Determine title and subtitle from description and category
  // Prefer category_display over category, and description over category_display for title
  const title = transaction.description || transaction.category_display || transaction.category || "Transaction"
  const subtitle = transaction.category_display || transaction.category || transaction.reference || undefined

  return {
    id: transaction.id,
    date: transaction.created_at,
    title,
    subtitle,
    amount: mappedAmount,
    type: mapTransactionType(transaction.category, transaction.transaction_type),
    currency: transaction.wallet ? undefined : currency, // Use wallet currency if available
  }
}

export function MobileWallet() {
  const router = useRouter()
  const { wallet, isLoading: isLoadingWallet, isError: walletError, mutate: mutateWallet } = useWallet()
  // Allow transactions to fetch even if wallet fails (will try without walletId)
  const { transactions, isLoading: isLoadingTransactions, isError: transactionsError, mutate: mutateTransactions } = useWalletTransactions(wallet?.id || null)
  const [isBalanceVisible, setIsBalanceVisible] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [action, setAction] = React.useState<"topup" | "withdraw" | "paydebt">("topup")

  const isLoading = isLoadingWallet || isLoadingTransactions

  // Map transactions to UI format - use default currency if wallet not available
  const txns = React.useMemo(() => {
    if (!Array.isArray(transactions)) return []
    const currency = wallet?.currency || "UGX"
    return transactions.map((t) => mapTransactionToTxn(t, currency))
  }, [wallet, transactions])

  // Handle errors (token refresh failures)
  React.useEffect(() => {
    if (walletError || transactionsError) {
      const error = walletError || transactionsError
      if (error instanceof Error && error.message.includes("Token refresh failed")) {
        signOut({ redirect: false }).then(() => {
          router.push("/login")
          router.refresh()
        })
      }
    }
  }, [walletError, transactionsError, router])

  const grouped = groupByDate(txns)

  return (
    <div className="md:hidden w-full h-full flex flex-col">
      {/* Header gradient balance */}
      <div className="overflow-hidden p-3">
        <div className="relative px-4 pt-4 pb-6 bg-linear-to-b from-green-500 via-yellow-600 to-yellow-700 text-white rounded-3xl ">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1 bg-white/15 text-white rounded-full px-2 py-1 text-xs">
              WALLET BALANCE
              <ChevronRightIcon className="h-3.5 w-3.5 opacity-80" />
            </span>
            <div className="flex items-center gap-2">
              <Button
                className="h-8 w-8 rounded-full bg-white/10"
                onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                title={isBalanceVisible ? "Hide balance" : "Show balance"}
              >
                {isBalanceVisible ? (
                  <EyeIcon className="h-4 w-4 text-white" />
                ) : (
                  <EyeSlashIcon className="h-4 w-4 text-white" />
                )}
              </Button>
            </div>
          </div>

          <div className="text-4xl font-semibold tracking-tight">
            {isLoadingWallet ? (
              <span className="text-2xl">...</span>
            ) : walletError ? (
              <span className="text-lg opacity-80">Unable to load balance</span>
            ) : isBalanceVisible ? (
              currency(parseFloat(wallet?.balance ?? "0"), wallet?.currency || "UGX")
            ) : (
              <span className="blur-sm select-none">{wallet?.currency || "UGX"} ••••••</span>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Card className="bg-white/10 border-white/10 text-white rounded-2xl p-4">
              <p className="text-xs opacity-80">Earned (1–4 Jun)</p>
              <p className="text-lg font-semibold mt-1">{currency(0)}</p>
            </Card>
            <Card className="bg-white/10 border-white/10 text-white rounded-2xl p-4">
              <p className="text-xs opacity-80">Debts</p>
              <p className="text-lg font-semibold mt-1">{currency(0)}</p>
            </Card>
          </div>
        </div>
      </div>
      {/* Wallet Actions */}
       <div className="grid grid-cols-3 items-center gap-3 p-3">
         <Button className="w-full h-12" onClick={() => { setAction("topup"); setOpen(true) }}>
          <PlusCircleIcon className="h-5 w-5" />
          <span className="text-sm font-medium">Top Up</span>
        </Button>
         <Button className="w-full h-12" onClick={() => { setAction("withdraw"); setOpen(true) }}>
          <ArrowDownIcon className="h-5 w-5" />
          <span className="text-sm font-medium">Withdraw</span>
        </Button>
         <Button className="w-full h-12" onClick={() => { setAction("paydebt"); setOpen(true) }}>
          <BanknoteArrowUp className="h-5 w-5" />
          <span className="text-sm font-medium">Pay Order</span>
        </Button>
      </div>

      {/* Transactions */}
       <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Transactions</h3>
          <Button variant={"ghost"} className="flex items-center gap-1 text-sm">
            <CalendarDaysIcon className="h-4 w-4" /> 
          </Button>
        </div>

        <div className="space-y-4">
          {isLoadingTransactions ? (
            <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
          ) : transactionsError ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">Unable to load transactions</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => mutateTransactions()}
              >
                Retry
              </Button>
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No transactions found</div>
          ) : (
            Object.entries(grouped).map(([label, items]) => (
              <div key={label} className="space-y-2">
                <div className="flex flex-row items-center justify-between text-xs text-muted-foreground">
                  <span>{label}</span>
                  <span>
                    {currency(
                      items.reduce((acc, t) => acc + t.amount, 0),
                      wallet?.currency || "UGX"
                    )}
                  </span>
                </div>
                {/* list */}
                <div className="space-y-2">
                  {items.map((t) => (
                    <Card key={t.id} className="rounded-2xl p-3 flex flex-row items-center gap-3">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center",
                          t.amount >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        )}
                      >
                        {t.type === "commission" || t.amount >= 0 ? (
                          <span className="text-sm font-semibold">TXN</span>
                        ) : (
                          <span className="text-sm font-semibold">DEBT</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{t.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{t.subtitle}</p>
                      </div>
                      <div className={cn("text-sm font-semibold", t.amount >= 0 ? "text-emerald-600" : "text-rose-600")}>{
                        (t.amount >= 0 ? "+" : "") + currency(t.amount, t.currency || wallet?.currency || "UGX")
                      }</div>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <WalletActionDrawer
        open={open}
        onOpenChange={setOpen}
        action={action}
        balance={parseFloat(wallet?.balance ?? "0")}
        currency={wallet?.currency || "UGX"}
        onConfirm={(amt) => {
          // no-op submission placeholder; wire to API later
          setOpen(false)
        }}
      />
    </div>
  )
}

export default MobileWallet


