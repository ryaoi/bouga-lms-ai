import axios, { AxiosRequestConfig, AxiosResponse } from "axios"
import { ExtensionMessage } from "../../shared/ExtensionMessage"
import * as vscode from "vscode"

export class BougaLMSApiService {
	private readonly baseUrl = "https://lms.bouga.jp/api"
	private postMessageToWebview: (message: ExtensionMessage) => Promise<void>
	private getBougaLMSApiKey: () => Promise<string | undefined>

	constructor(
		postMessageToWebview: (message: ExtensionMessage) => Promise<void>,
		getBougaLMSApiKey: () => Promise<string | undefined>,
	) {
		this.postMessageToWebview = postMessageToWebview
		this.getBougaLMSApiKey = getBougaLMSApiKey
	}

	/**
	 * Helper function to make authenticated requests to the Bouga LMS API
	 * @param endpoint The API endpoint to call (without the base URL)
	 * @param method HTTP method (GET, POST, etc.)
	 * @param data Request data (for POST, PUT, etc.)
	 * @param config Additional axios request configuration
	 * @returns The API response data
	 * @throws Error if the API key is not found or the request fails
	 */
	private async authenticatedRequest<T>(
		endpoint: string,
		method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
		data?: any,
		config: AxiosRequestConfig = {},
	): Promise<T> {
		const apiKey = await this.getBougaLMSApiKey()

		if (!apiKey) {
			throw new Error("Bouga LMS API key not found")
		}

		const url = `${this.baseUrl}${endpoint}`
		const requestConfig: AxiosRequestConfig = {
			...config,
			method,
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
				...config.headers,
			},
		}

		try {
			let response: AxiosResponse<T>

			if (method === "GET") {
				response = await axios.get(url, requestConfig)
			} else {
				response = await axios.request({
					...requestConfig,
					url,
					data,
				})
			}

			if (!response.data) {
				throw new Error(`Invalid response from ${endpoint} API`)
			}

			return response.data
		} catch (error) {
			console.error(`API request to ${endpoint} failed:`, error)
			throw error
		}
	}

	/**
	 * Validates a learning completion task
	 * @param nodeId The node ID to validate
	 * @returns True if validation is successful
	 */
	async validateLearningCompletion(nodeId: string): Promise<boolean> {
		try {
			await this.authenticatedRequest("/learningnode/completion", "POST", { node_id: nodeId })

			vscode.window.showInformationMessage("学習タスクが完了になりました。")
			return true
		} catch (error) {
			console.error("Failed to validate learning completion:", error)
			vscode.window.showErrorMessage("学習タスクの完了に失敗しました。", error.message)
			return false
		}
	}
}
