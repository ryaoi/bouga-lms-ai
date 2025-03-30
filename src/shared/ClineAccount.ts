export interface BalanceResponse {
	data: {
		label: string
		usage: number // Number of credits used
		limit: number | null // Credit limit for the key, or null if unlimited
		is_free_tier: boolean // Whether the user has paid for credits before
		rate_limit: {
			requests: number // Number of requests allowed...
			interval: string // in this interval, e.g. "10s"
		}
	}
}

export interface UsageTransaction {
	spentAt: string
	credits: string
	modelProvider: string
	model: string
	promptTokens: string
	completionTokens: string
}

export interface PaymentTransaction {
	paidAt: string
	amountCents: string
	credits: string
}
