import React, { createContext, useContext, useState } from "react"
import { vscode } from "../utils/vscode"
import { UserInfo } from "../../../src/shared/UserInfo"

interface SupabaseAuthContextType {
	user: UserInfo | null
	isInitialized: boolean
	handleSignOut: () => Promise<void>
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined)

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<UserInfo | null>(null)
	const [isInitialized, setIsInitialized] = useState(false)

	// Listen for auth callback from extension
	React.useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const message = event.data
			if (message.type === "authStateChanged" && "user" in message) {
				setUser(message.user)
				setIsInitialized(true)
			}
		}

		window.addEventListener("message", handleMessage)
		return () => window.removeEventListener("message", handleMessage)
	}, [])

	const handleSignOut = async () => {
		try {
			vscode.postMessage({ type: "accountLogoutClicked" })
			setUser(null)
		} catch (error) {
			console.error("Error signing out:", error)
			throw error
		}
	}

	return <SupabaseAuthContext.Provider value={{ user, isInitialized, handleSignOut }}>{children}</SupabaseAuthContext.Provider>
}

export const useSupabaseAuth = () => {
	const context = useContext(SupabaseAuthContext)
	if (context === undefined) {
		throw new Error("useSupabaseAuth must be used within a SupabaseAuthProvider")
	}
	return context
}
