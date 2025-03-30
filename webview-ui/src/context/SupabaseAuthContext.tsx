import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { createClient, SupabaseClient, User } from "@supabase/supabase-js"
import { vscode } from "../utils/vscode"
import { UserInfo } from "../../../src/shared/UserInfo"

// Supabase configuration
const supabaseUrl = "https://bvznrrmtexccdeobwcxe.supabase.co"
const supabaseAnonKey =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2em5ycm10ZXhjY2Rlb2J3Y3hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNzU3NDEsImV4cCI6MjA1MTc1MTc0MX0.xhj9e_u31Mie6aGj6mM6N1wPLnbz-QU_1-TxwCw_fWY"

interface SupabaseAuthContextType {
	user: UserInfo | null
	isInitialized: boolean
	handleSignOut: () => Promise<void>
	supabase: SupabaseClient
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined)

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<UserInfo | null>(null)
	const [isInitialized, setIsInitialized] = useState(false)

	// Initialize Supabase client - this is similar to Firebase's getAuth()
	const supabase = createClient(supabaseUrl, supabaseAnonKey)

	// Handle auth state changes
	useEffect(() => {
		// Subscribe to auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			const currentUser = session?.user || null

			if (currentUser) {
				const userInfo: UserInfo = {
					displayName: currentUser.user_metadata?.full_name || null,
					email: currentUser.email || null,
					photoURL: currentUser.user_metadata?.avatar_url || null,
				}
				setUser(userInfo)
			} else {
				setUser(null)
			}

			setIsInitialized(true)

			// Sync auth state with extension
			vscode.postMessage({
				type: "authStateChanged",
				user: user,
			})
		})

		// Check for existing session
		const initializeAuth = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession()
			if (session?.user) {
				const currentUser = session.user
				const userInfo: UserInfo = {
					displayName: currentUser.user_metadata?.full_name || null,
					email: currentUser.email || null,
					photoURL: currentUser.user_metadata?.avatar_url || null,
				}
				setUser(userInfo)
			}
			setIsInitialized(true)
		}

		initializeAuth()

		return () => {
			subscription.unsubscribe()
		}
	}, [supabase])

	// Listen for auth callback from extension
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const message = event.data
			console.log("handleMessage", message)

			if (message.type === "authCallback" && message.token) {
				// Handle Supabase session token
				try {
					// Set user if available in the authCallback message
					if (message.user) {
						console.log("authCallback user", message.user)
						setUser(message.user)
					}
					setIsInitialized(true)
				} catch (error) {
					console.error("Error handling auth callback:", error)
				}
			} else if (message.type === "authStateChanged" && "user" in message) {
				console.log("authStateChanged", message.user)
				setUser(message.user)
				setIsInitialized(true)
			}
		}

		window.addEventListener("message", handleMessage)

		return () => window.removeEventListener("message", handleMessage)
	}, [supabase])

	const handleSignOut = useCallback(async () => {
		try {
			const { error } = await supabase.auth.signOut()
			if (error) throw error

			vscode.postMessage({ type: "accountLogoutClicked" })
			setUser(null)
			console.log("Successfully signed out of Supabase")
		} catch (error) {
			console.error("Error signing out:", error)
			throw error
		}
	}, [supabase])

	return (
		<SupabaseAuthContext.Provider value={{ user, isInitialized, handleSignOut, supabase }}>
			{children}
		</SupabaseAuthContext.Provider>
	)
}

export const useSupabaseAuth = () => {
	const context = useContext(SupabaseAuthContext)
	if (context === undefined) {
		throw new Error("useSupabaseAuth must be used within a SupabaseAuthProvider")
	}
	return context
}
