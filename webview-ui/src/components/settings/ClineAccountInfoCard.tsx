import { VSCodeButton, VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { useSupabaseAuth } from "../../context/SupabaseAuthContext"
import { vscode } from "../../utils/vscode"
import { useState } from "react"
import { useExtensionState } from "../../context/ExtensionStateContext"

export const ClineAccountInfoCard = () => {
	const { user, handleSignOut } = useSupabaseAuth()
	const { apiConfiguration } = useExtensionState()
	const [showApiKey, setShowApiKey] = useState(false)

	const apiKey = apiConfiguration?.bougaLmsApiKey || ""
	const isLoggedIn = !!user || !!apiKey

	const handleLogin = () => {
		vscode.postMessage({ type: "accountLoginClicked" })
	}

	const handleLogout = () => {
		// First notify extension to clear API keys and state
		vscode.postMessage({ type: "accountLogoutClicked" })
		// Then sign out of Firebase
		handleSignOut()
	}

	const handleShowAccount = () => {
		vscode.postMessage({ type: "showAccountViewClicked" })
	}

	const toggleApiKeyVisibility = () => {
		setShowApiKey(!showApiKey)
	}

	return (
		<div className="max-w-[600px]">
			{isLoggedIn ? (
				<div className="flex flex-col gap-4">
					<VSCodeButton appearance="secondary" onClick={handleShowAccount}>
						View Billing & Usage
					</VSCodeButton>

					{apiKey && (
						<div className="flex flex-col gap-2">
							<div className="flex flex-row gap-2 items-center">
								<span className="font-medium">API Key:</span>
								<VSCodeButton
									appearance="icon"
									onClick={toggleApiKeyVisibility}
									title={showApiKey ? "Hide API Key" : "Show API Key"}>
									<span className={`codicon codicon-${showApiKey ? "eye-closed" : "eye"}`}></span>
								</VSCodeButton>
							</div>
							{showApiKey ? (
								<VSCodeTextField readOnly value={apiKey} style={{ width: "100%" }} />
							) : (
								<VSCodeTextField readOnly value={"•".repeat(20)} style={{ width: "100%" }} />
							)}
							<p className="text-[12px] text-[var(--vscode-descriptionForeground)] mt-1 mb-0">
								This API key is used for making requests to the Bouga LMS API.
							</p>
						</div>
					)}

					<VSCodeButton appearance="secondary" onClick={handleLogout} className="mt-2">
						Log out
					</VSCodeButton>
				</div>
			) : (
				// <div className="p-2 rounded-[2px] bg-[var(--vscode-dropdown-background)]">
				// 	<div className="flex items-center gap-3">
				// 		{user.photoURL ? (
				// 			<img src={user.photoURL} alt="Profile" className="w-[38px] h-[38px] rounded-full flex-shrink-0" />
				// 		) : (
				// 			<div className="w-[38px] h-[38px] rounded-full bg-[var(--vscode-button-background)] flex items-center justify-center text-xl text-[var(--vscode-button-foreground)] flex-shrink-0">
				// 				{user.displayName?.[0] || user.email?.[0] || "?"}
				// 			</div>
				// 		)}
				// 		<div className="flex flex-col gap-1 flex-1 overflow-hidden">
				// 			{user.displayName && (
				// 				<div className="text-[13px] font-bold text-[var(--vscode-foreground)] break-words">
				// 					{user.displayName}
				// 				</div>
				// 			)}
				// 			{user.email && (
				// 				<div className="text-[13px] text-[var(--vscode-descriptionForeground)] break-words overflow-hidden text-ellipsis">
				// 					{user.email}
				// 				</div>
				// 			)}
				// 			<div className="flex gap-2 flex-wrap mt-1">

				// 				<VSCodeButton
				// 					appearance="secondary"
				// 					onClick={handleLogout}
				// 					className="scale-[0.85] origin-left w-fit mt-0.5 mb-0 -mr-3">
				// 					Log out
				// 				</VSCodeButton>
				// 			</div>
				// 		</div>
				// 	</div>
				// </div>
				<div>
					<VSCodeButton onClick={handleLogin} className="mt-0">
						Sign Up with Cline
					</VSCodeButton>
				</div>
			)}
		</div>
	)
}
