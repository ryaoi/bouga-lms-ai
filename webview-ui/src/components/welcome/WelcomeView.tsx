import { VSCodeButton, VSCodeDivider, VSCodeLink, VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { useCallback, useEffect, useState } from "react"
import { useEvent } from "react-use"
import { ExtensionMessage } from "../../../../src/shared/ExtensionMessage"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { validateApiConfiguration } from "../../utils/validate"
import { vscode } from "../../utils/vscode"
import ApiOptions from "../settings/ApiOptions"

const WelcomeView = () => {
	const { apiConfiguration } = useExtensionState()
	const [apiErrorMessage, setApiErrorMessage] = useState<string | undefined>(undefined)
	const [showApiOptions, setShowApiOptions] = useState(false)

	const disableLetsGoButton = apiErrorMessage != null

	const handleLogin = () => {
		vscode.postMessage({ type: "accountLoginClicked" })
	}

	const handleSubmit = () => {
		vscode.postMessage({ type: "apiConfiguration", apiConfiguration })
	}

	useEffect(() => {
		setApiErrorMessage(validateApiConfiguration(apiConfiguration))
	}, [apiConfiguration])

	return (
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				padding: "0 0px",
				display: "flex",
				flexDirection: "column",
			}}>
			<div
				style={{
					height: "100%",
					padding: "0 20px",
					overflow: "auto",
				}}>
				<h2>忘我LMS AI</h2>
				<div style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}>
					<ClineLogo />
				</div>
				<p>
					<VSCodeLink href="https://www.anthropic.com/claude/sonnet" style={{ display: "inline" }}>
						Claude 3.7 Sonnet
					</VSCodeLink>
					のエージェント機能の革新と、ファイルの作成・編集、複雑なプロジェクトの探索、ブラウザの使用、ターミナルコマンドの実行（
					<i>もちろん、あなたの許可を得た上で</i>
					）を可能にするツールへのアクセスにより、あなたの学習をサポートする忘我LMSAIです。MCPを使用して新しいツールを作成し、自身の機能を拡張することも可能です。
				</p>

				<p style={{ color: "var(--vscode-descriptionForeground)" }}>
					始めるにはアカウントにサインアップするか、ログインしてください。
				</p>

				<VSCodeButton appearance="primary" onClick={handleLogin} style={{ width: "100%", marginTop: 4 }}>
					無料で始める
				</VSCodeButton>

				{!showApiOptions && (
					<VSCodeButton
						appearance="secondary"
						onClick={() => setShowApiOptions(!showApiOptions)}
						style={{ marginTop: 10, width: "100%" }}>
						自分のAPIキーを使用する
					</VSCodeButton>
				)}

				<div style={{ marginTop: "18px" }}>
					{showApiOptions && (
						<div>
							<ApiOptions showModelOptions={false} />
							<VSCodeButton onClick={handleSubmit} disabled={disableLetsGoButton} style={{ marginTop: "3px" }}>
								始めましょう！
							</VSCodeButton>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

const ClineLogo: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
	// (can't use svgs in vsc extensions)
	const logoBase64 =
		"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iNTAwIiB6b29tQW5kUGFuPSJtYWduaWZ5IiB2aWV3Qm94PSIwIDAgMzc1IDM3NC45OTk5OTEiIGhlaWdodD0iNTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBtZWV0IiB2ZXJzaW9uPSIxLjAiPjxyZWN0IHg9Ii0zNy41IiB3aWR0aD0iNDUwIiBmaWxsPSIjZmZmZmZmIiB5PSItMzcuNDk5OTk5IiBoZWlnaHQ9IjQ0OS45OTk5ODkiIGZpbGwtb3BhY2l0eT0iMSIvPjxyZWN0IHg9Ii0zNy41IiB3aWR0aD0iNDUwIiBmaWxsPSIjMDAwMDAwIiB5PSItMzcuNDk5OTk5IiBoZWlnaHQ9IjQ0OS45OTk5ODkiIGZpbGwtb3BhY2l0eT0iMSIvPjxwYXRoIGZpbGw9IiNmZmZmZmYiIGQ9Ik0gMTc1LjQ4ODI4MSAzMzAuMzUxNTYyIEMgMTg1LjE0ODQzOCAzMjAuNjg3NSAxODUuMTQ4NDM4IDMwNS4wMjM0MzggMTc1LjQ4ODI4MSAyOTUuMzU5Mzc1IEMgMTY1LjgyNDIxOSAyODUuNjk1MzEyIDE1MC4xNTYyNSAyODUuNjk1MzEyIDE0MC40OTYwOTQgMjk1LjM1OTM3NSBDIDEzMC44MzIwMzEgMzA1LjAyMzQzOCAxMzAuODMyMDMxIDMyMC42ODc1IDE0MC40OTYwOTQgMzMwLjM1MTU2MiBDIDE1MC4xNTYyNSAzNDAuMDE1NjI1IDE2NS44MjQyMTkgMzQwLjAxNTYyNSAxNzUuNDg4MjgxIDMzMC4zNTE1NjIgIiBmaWxsLW9wYWNpdHk9IjEiIGZpbGwtcnVsZT0ibm9uemVybyIvPjxwYXRoIGZpbGw9IiNmZmZmZmYiIGQ9Ik0gMTg3LjUgLTAuMDE1NjI1IEMgODMuOTM3NSAtMC4wMTU2MjUgLTAuMDE1NjI1IDgzLjkzNzUgLTAuMDE1NjI1IDE4Ny41IEMgLTAuMDE1NjI1IDE5Mi4wNTQ2ODggMC4xNjAxNTYgMTk2LjU3MDMxMiAwLjQ3NjU2MiAyMDEuMDM5MDYyIEMgNDYuMjMwNDY5IDE1Ny4wOTc2NTYgMTE3LjMyNDIxOSAxNTQuOTk2MDk0IDE2NS40ODA0NjkgMTk0Ljc4MTI1IEwgMjIyLjAxMTcxOSAxMzguMjQ2MDk0IEMgMjEzLjgyNDIxOSAxMjQuMzc4OTA2IDIxNS42ODc1IDEwNi4yMjI2NTYgMjI3LjU5NzY1NiA5NC4zMDQ2ODggQyAyNDEuNzIyNjU2IDgwLjE4NzUgMjY0LjYxMzI4MSA4MC4xODc1IDI3OC43MzQzNzUgOTQuMzA0Njg4IEMgMjkyLjg1OTM3NSAxMDguNDI5Njg4IDI5Mi44NTkzNzUgMTMxLjMyNDIxOSAyNzguNzM0Mzc1IDE0NS40NDUzMTIgQyAyNjYuODI0MjE5IDE1Ny4zNTkzNzUgMjQ4LjY2MDE1NiAxNTkuMjIyNjU2IDIzNC43OTY4NzUgMTUxLjAzMTI1IEwgMTc4LjU1ODU5NCAyMDcuMjY5NTMxIEMgMjIxLjYzMjgxMiAyNTQuNzY5NTMxIDIyMS4zODI4MTIgMzI3LjU0Mjk2OSAxNzcuODQ3NjU2IDM3NC43Njk1MzEgQyAxODEuMDQyOTY5IDM3NC45MzM1OTQgMTg0LjI2MTcxOSAzNzUuMDE1NjI1IDE4Ny41IDM3NS4wMTU2MjUgQyAyOTEuMDYyNSAzNzUuMDE1NjI1IDM3NS4wMTU2MjUgMjkxLjA2MjUgMzc1LjAxNTYyNSAxODcuNSBDIDM3NS4wMTU2MjUgODMuOTM3NSAyOTEuMDYyNSAtMC4wMTU2MjUgMTg3LjUgLTAuMDE1NjI1ICIgZmlsbC1vcGFjaXR5PSIxIiBmaWxsLXJ1bGU9Im5vbnplcm8iLz48cGF0aCBmaWxsPSIjZmZmZmZmIiBkPSJNIDQ2Ljc1NzgxMiAyMDEuNjI1IEMgMzcuMDkzNzUgMjExLjI4OTA2MiAzNy4wOTM3NSAyMjYuOTU3MDMxIDQ2Ljc1NzgxMiAyMzYuNjE3MTg4IEMgNTYuNDIxODc1IDI0Ni4yODEyNSA3Mi4wODU5MzggMjQ2LjI4MTI1IDgxLjc1IDIzNi42MTcxODggQyA5MS40MTQwNjIgMjI2Ljk1NzAzMSA5MS40MTQwNjIgMjExLjI4OTA2MiA4MS43NSAyMDEuNjI1IEMgNzIuMDg1OTM4IDE5MS45NjQ4NDQgNTYuNDIxODc1IDE5MS45NjQ4NDQgNDYuNzU3ODEyIDIwMS42MjUgIiBmaWxsLW9wYWNpdHk9IjEiIGZpbGwtcnVsZT0ibm9uemVybyIvPjwvc3ZnPg=="

	return (
		<img
			src={logoBase64}
			style={{
				width: "57px",
				height: "60px",
				...style,
			}}
			alt="忘我LMS AI Logo"
		/>
	)
}

export default WelcomeView
