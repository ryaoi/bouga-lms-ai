import { VSCodeButton, VSCodeDivider, VSCodeLink, VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { memo, useEffect, useState } from "react"
import { vscode } from "../../utils/vscode"
import VSCodeButtonLink from "../common/VSCodeButtonLink"
import { useExtensionState } from "../../context/ExtensionStateContext"

type AccountViewProps = {
	onDone: () => void
}

const AccountView = ({ onDone }: AccountViewProps) => {
	return (
		<div className="fixed inset-0 flex flex-col overflow-hidden pt-[10px] pl-[20px]">
			<div className="flex justify-between items-center mb-[17px] pr-[17px]">
				<h3 className="text-[var(--vscode-foreground)] m-0">アカウント</h3>
				<VSCodeButton onClick={onDone}>閉じる</VSCodeButton>
			</div>
			<div className="flex-grow overflow-hidden pr-[8px] flex flex-col">
				<div className="h-full mb-[5px]">
					<ClineAccountView />
				</div>
			</div>
		</div>
	)
}

export const ClineAccountView = () => {
	const { apiConfiguration, userInfo } = useExtensionState()
	const [balance, setBalance] = useState<number | string | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [fetchError, setFetchError] = useState<string | null>(null)

	const apiKey = apiConfiguration?.bougaLmsApiKey || ""
	// Listen for balance and transaction data updates from the extension
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const message = event.data

			if (message.type === "userCreditsBalance" && message.userCreditsBalance) {
				setBalance(message.userCreditsBalance.currentBalance || 0)
			}
			// Always set loading to false when we get a response
			setIsLoading(false)
		}

		window.addEventListener("message", handleMessage)

		// Only fetch data if we're in loading state to prevent duplicate fetches
		if (isLoading && apiKey) {
			vscode.postMessage({ type: "fetchUserCreditsData" })

			return () => {
				window.removeEventListener("message", handleMessage)
			}
		}

		return () => {
			window.removeEventListener("message", handleMessage)
		}
	}, [apiKey, isLoading])

	// Initialize data loading when component mounts or when authentication changes
	useEffect(() => {
		if (apiKey && !isLoading) {
			setIsLoading(true)
			setFetchError(null)
		}
	}, [apiKey])

	const handleLogin = () => {
		vscode.postMessage({ type: "accountLoginClicked" })
	}

	const handleLogout = () => {
		// Notify extension to clear API keys and state
		vscode.postMessage({ type: "accountLogoutClicked" })
	}

	const refreshBalance = async () => {
		vscode.postMessage({ type: "fetchUserCreditsData" })
	}

	return (
		<div className="h-full flex flex-col">
			{userInfo || apiKey ? (
				<div className="flex flex-col pr-3 h-full">
					<div className="flex flex-col w-full">
						<div className="flex items-center mb-6 flex-wrap gap-y-4">
							{userInfo?.photoURL ? (
								<img src={userInfo.photoURL} alt="Profile" className="size-16 rounded-full mr-4" />
							) : (
								<div className="size-16 rounded-full bg-[var(--vscode-button-background)] flex items-center justify-center text-2xl text-[var(--vscode-button-foreground)] mr-4">
									{userInfo?.displayName?.[0] || userInfo?.email?.[0] || "?"}
								</div>
							)}

							<div className="flex flex-col">
								{userInfo?.displayName && (
									<h2 className="text-[var(--vscode-foreground)] m-0 mb-1 text-lg font-medium">
										{userInfo.displayName}
									</h2>
								)}

								{userInfo?.email && (
									<div className="text-sm text-[var(--vscode-descriptionForeground)]">{userInfo.email}</div>
								)}

								{userInfo?.isSubscribed !== undefined && userInfo.isSubscribed && (
									<div className="text-sm mt-1">
										<span className={`px-2 py-0.5 rounded-full text-white bg-green-600`}>
											サブスクリプション中
										</span>
									</div>
								)}
							</div>
						</div>
					</div>

					<div className="w-full flex gap-2 flex-col min-[225px]:flex-row">
						<div className="w-full min-[225px]:w-1/2">
							<VSCodeButtonLink href="https://lms.bouga.jp/learn" appearance="primary" className="w-full">
								学習ページ
							</VSCodeButtonLink>
						</div>
						<VSCodeButton appearance="secondary" onClick={handleLogout} className="w-full min-[225px]:w-1/2">
							ログアウト
						</VSCodeButton>
					</div>

					<VSCodeDivider className="w-full my-6" />

					<div className="w-full flex flex-col items-center">
						<div className="text-sm text-[var(--vscode-descriptionForeground)] mb-3">現在の残高</div>

						<div className="text-4xl font-bold text-[var(--vscode-foreground)] mb-6 flex items-center gap-2">
							{isLoading ? (
								<div className="text-[var(--vscode-descriptionForeground)]">読み込み中...</div>
							) : fetchError ? (
								<div className="flex flex-col items-center">
									<div className="text-base text-[var(--vscode-errorForeground)]">{fetchError}</div>
									<div className="text-xl mt-1">$0.00</div>
									<VSCodeButton appearance="secondary" className="mt-3" onClick={refreshBalance}>
										<span className="codicon codicon-refresh mr-1"></span>
										残高を更新
									</VSCodeButton>
								</div>
							) : (
								<>
									{balance === "無制限" ? (
										<span className="text-4xl">無制限</span>
									) : (
										<>
											<span>$</span>
											{balance === null ? (
												"ロード中..."
											) : typeof balance === "number" && balance > 0 ? (
												<>{parseFloat(balance.toString()).toFixed(2)}</>
											) : (
												"0.00"
											)}
										</>
									)}
									<VSCodeButton appearance="icon" className="mt-1" onClick={refreshBalance}>
										<span className="codicon codicon-refresh"></span>
									</VSCodeButton>
								</>
							)}
						</div>

						<div className="w-full">
							<VSCodeButtonLink href="https://lms.bouga.jp/payment" className="w-full">
								クレジットを追加
							</VSCodeButtonLink>
						</div>
					</div>
				</div>
			) : (
				<div className="flex flex-col items-center pr-3">
					<p style={{}}>
						Bouga
						LMSにサインアップして、最新のモデル、使用状況とクレジットを表示する請求ダッシュボード、およびその他の今後の機能にアクセスしてください。
					</p>

					<VSCodeButton onClick={handleLogin} className="w-full mb-4">
						ログイン / サインアップ
					</VSCodeButton>
				</div>
			)}
		</div>
	)
}

export default memo(AccountView)
