import { VSCodeBadge, VSCodeProgressRing, VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import deepEqual from "fast-deep-equal"
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useEvent, useSize } from "react-use"
import styled from "styled-components"
import {
	ClineApiReqInfo,
	ClineAskQuestion,
	ClineAskUseMcpServer,
	ClineMessage,
	ClinePlanModeResponse,
	ClineSayTool,
	COMPLETION_RESULT_CHANGES_FLAG,
	ExtensionMessage,
} from "../../../../src/shared/ExtensionMessage"
import { COMMAND_OUTPUT_STRING, COMMAND_REQ_APP_STRING } from "../../../../src/shared/combineCommandSequences"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { findMatchingResourceOrTemplate, getMcpServerDisplayName } from "../../utils/mcp"
import { vscode } from "../../utils/vscode"
import { CheckmarkControl } from "../common/CheckmarkControl"
import { CheckpointControls, CheckpointOverlay } from "../common/CheckpointControls"
import CodeAccordian, { cleanPathPrefix } from "../common/CodeAccordian"
import CodeBlock, { CODE_BLOCK_BG_COLOR } from "../common/CodeBlock"
import MarkdownBlock from "../common/MarkdownBlock"
import SuccessButton from "../common/SuccessButton"
import Thumbnails from "../common/Thumbnails"
import McpResourceRow from "../mcp/McpResourceRow"
import McpToolRow from "../mcp/McpToolRow"
import CreditLimitError from "./CreditLimitError"
import { OptionsButtons } from "./OptionsButtons"
import { highlightMentions } from "./TaskHeader"

const ChatRowContainer = styled.div<{ isToolMessage?: boolean; isCommandMessage?: boolean; isImportantMessage?: boolean }>`
	padding: 10px 6px 10px 15px;
	position: relative;
	opacity: ${(props) => (props.isToolMessage || props.isCommandMessage || props.isImportantMessage ? 1 : 0.7)};
	transition:
		opacity 0.2s ease,
		transform 0.2s ease; /* Smooth transition */

	&:hover {
		opacity: 1; /* Full visibility on hover */
	}

	&:hover ${CheckpointControls} {
		opacity: 1;
	}
`

const MessageContent = styled.div<{ isImportant?: boolean }>`
	font-size: ${(props) => (props.isImportant ? "1em" : "0.95em")};
	line-height: ${(props) => (props.isImportant ? "1.5" : "1.4")};
	transition: all 0.2s ease;

	${ChatRowContainer}:hover & {
		font-size: 1em;
		line-height: 1.5;
	}
`

interface ChatRowProps {
	message: ClineMessage
	isExpanded: boolean
	onToggleExpand: () => void
	lastModifiedMessage?: ClineMessage
	isLast: boolean
	onHeightChange: (isTaller: boolean) => void
}

interface ChatRowContentProps extends Omit<ChatRowProps, "onHeightChange"> {}

export const ProgressIndicator = () => (
	<div
		style={{
			width: "16px",
			height: "16px",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
		}}>
		<div style={{ transform: "scale(0.55)", transformOrigin: "center" }}>
			<VSCodeProgressRing />
		</div>
	</div>
)

const Markdown = memo(({ markdown }: { markdown?: string }) => {
	return (
		<div
			style={{
				wordBreak: "break-word",
				overflowWrap: "anywhere",
				marginBottom: -15,
				marginTop: -15,
			}}>
			<MarkdownBlock markdown={markdown} />
		</div>
	)
})

const ChatRow = memo(
	(props: ChatRowProps) => {
		const { isLast, onHeightChange, message, lastModifiedMessage } = props
		// Store the previous height to compare with the current height
		// This allows us to detect changes without causing re-renders
		const prevHeightRef = useRef(0)

		// NOTE: for tools that are interrupted and not responded to (approved or rejected) there won't be a checkpoint hash
		let shouldShowCheckpoints =
			message.lastCheckpointHash != null &&
			(message.say === "tool" ||
				message.ask === "tool" ||
				message.say === "command" ||
				message.ask === "command" ||
				// message.say === "completion_result" ||
				// message.ask === "completion_result" ||
				message.say === "use_mcp_server" ||
				message.ask === "use_mcp_server")

		if (shouldShowCheckpoints && isLast) {
			shouldShowCheckpoints =
				lastModifiedMessage?.ask === "resume_completed_task" || lastModifiedMessage?.ask === "resume_task"
		}

		// Determine if message is a tool message that should always be fully visible
		const isToolMessage = message.say === "tool" || message.ask === "tool"
		const isCommandMessage = message.say === "command" || message.ask === "command"
		const isImportantMessage =
			message.say === "completion_result" ||
			message.ask === "completion_result" ||
			message.say === "error" ||
			message.ask === "followup" ||
			message.say === "use_mcp_server" ||
			message.ask === "use_mcp_server"

		const [chatrow, { height }] = useSize(
			<ChatRowContainer
				isToolMessage={isToolMessage}
				isCommandMessage={isCommandMessage}
				isImportantMessage={isImportantMessage}>
				<ChatRowContent {...props} />
				{shouldShowCheckpoints && <CheckpointOverlay messageTs={message.ts} />}
			</ChatRowContainer>,
		)

		useEffect(() => {
			// used for partials command output etc.
			// NOTE: it's important we don't distinguish between partial or complete here since our scroll effects in chatview need to handle height change during partial -> complete
			const isInitialRender = prevHeightRef.current === 0 // prevents scrolling when new element is added since we already scroll for that
			// height starts off at Infinity
			if (isLast && height !== 0 && height !== Infinity && height !== prevHeightRef.current) {
				if (!isInitialRender) {
					onHeightChange(height > prevHeightRef.current)
				}
				prevHeightRef.current = height
			}
		}, [height, isLast, onHeightChange, message])

		// we cannot return null as virtuoso does not support it so we use a separate visibleMessages array to filter out messages that should not be rendered
		return chatrow
	},
	// memo does shallow comparison of props, so we need to do deep comparison of arrays/objects whose properties might change
	deepEqual,
)

export default ChatRow

export const ChatRowContent = ({ message, isExpanded, onToggleExpand, lastModifiedMessage, isLast }: ChatRowContentProps) => {
	const { mcpServers, mcpMarketplaceCatalog } = useExtensionState()
	const [seeNewChangesDisabled, setSeeNewChangesDisabled] = useState(false)

	const [cost, apiReqCancelReason, apiReqStreamingFailedMessage] = useMemo(() => {
		if (message.text != null && message.say === "api_req_started") {
			const info: ClineApiReqInfo = JSON.parse(message.text)
			return [info.cost, info.cancelReason, info.streamingFailedMessage]
		}
		return [undefined, undefined, undefined]
	}, [message.text, message.say])

	// when resuming task last won't be api_req_failed but a resume_task message so api_req_started will show loading spinner. that's why we just remove the last api_req_started that failed without streaming anything
	const apiRequestFailedMessage =
		isLast && lastModifiedMessage?.ask === "api_req_failed" // if request is retried then the latest message is a api_req_retried
			? lastModifiedMessage?.text
			: undefined

	const isCommandExecuting =
		isLast &&
		(lastModifiedMessage?.ask === "command" || lastModifiedMessage?.say === "command") &&
		lastModifiedMessage?.text?.includes(COMMAND_OUTPUT_STRING)

	const isMcpServerResponding = isLast && lastModifiedMessage?.say === "mcp_server_request_started"

	const type = message.type === "ask" ? message.ask : message.say

	const normalColor = "var(--vscode-foreground)"
	const errorColor = "var(--vscode-errorForeground)"
	const successColor = "var(--vscode-charts-green)"
	const cancelledColor = "var(--vscode-descriptionForeground)"

	const handleMessage = useCallback((event: MessageEvent) => {
		const message: ExtensionMessage = event.data
		switch (message.type) {
			case "relinquishControl": {
				setSeeNewChangesDisabled(false)
				break
			}
		}
	}, [])

	useEvent("message", handleMessage)

	const [icon, title] = useMemo(() => {
		switch (type) {
			case "error":
				return [
					<span
						className="codicon codicon-error"
						style={{
							color: errorColor,
							marginBottom: "-1.5px",
						}}></span>,
					<span style={{ color: errorColor, fontWeight: "bold" }}>エラー</span>,
				]
			case "mistake_limit_reached":
				return [
					<span
						className="codicon codicon-error"
						style={{
							color: errorColor,
							marginBottom: "-1.5px",
						}}></span>,
					<span style={{ color: errorColor, fontWeight: "bold" }}>AIがエラーが発生しました。</span>,
				]
			case "auto_approval_max_req_reached":
				return [
					<span
						className="codicon codicon-warning"
						style={{
							color: errorColor,
							marginBottom: "-1.5px",
						}}></span>,
					<span style={{ color: errorColor, fontWeight: "bold" }}>最大リクエスト数に達しました</span>,
				]
			case "command":
				return [
					isCommandExecuting ? (
						<ProgressIndicator />
					) : (
						<span
							className="codicon codicon-terminal"
							style={{
								color: normalColor,
								marginBottom: "-1.5px",
							}}></span>
					),
					<span style={{ color: normalColor, fontWeight: "bold" }}>AIが以下のコマンドを実行します。</span>,
				]
			case "use_mcp_server":
				const mcpServerUse = JSON.parse(message.text || "{}") as ClineAskUseMcpServer
				return [
					isMcpServerResponding ? (
						<ProgressIndicator />
					) : (
						<span
							className="codicon codicon-server"
							style={{
								color: normalColor,
								marginBottom: "-1.5px",
							}}></span>
					),
					<span style={{ color: normalColor, fontWeight: "bold", wordBreak: "break-word" }}>
						AIが {mcpServerUse.type === "use_mcp_tool" ? "ツールを使用" : "リソースにアクセス"} しようとしています：{" "}
						<code style={{ wordBreak: "break-all" }}>
							{getMcpServerDisplayName(mcpServerUse.serverName, mcpMarketplaceCatalog)}
						</code>{" "}
						MCPサーバー
					</span>,
				]
			case "completion_result":
				return [
					<span
						className="codicon codicon-check"
						style={{
							color: successColor,
							marginBottom: "-1.5px",
						}}></span>,
					<span style={{ color: successColor, fontWeight: "bold" }}>学習が完了しました。</span>,
				]
			case "api_req_started":
				const getIconSpan = (iconName: string, color: string) => (
					<div
						style={{
							width: 16,
							height: 16,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}>
						<span
							className={`codicon codicon-${iconName}`}
							style={{
								color,
								fontSize: 16,
								marginBottom: "-1.5px",
							}}></span>
					</div>
				)
				return [
					apiReqCancelReason != null ? (
						apiReqCancelReason === "user_cancelled" ? (
							getIconSpan("error", cancelledColor)
						) : (
							getIconSpan("error", errorColor)
						)
					) : cost != null ? (
						getIconSpan("check", successColor)
					) : apiRequestFailedMessage ? (
						getIconSpan("error", errorColor)
					) : (
						<ProgressIndicator />
					),
					(() => {
						if (apiReqCancelReason != null) {
							return apiReqCancelReason === "user_cancelled" ? (
								<span style={{ color: normalColor, fontWeight: "bold" }}>処理が中止されました</span>
							) : (
								<span style={{ color: errorColor, fontWeight: "bold" }}>ストリーミング処理に失敗しました</span>
							)
						}

						if (cost != null) {
							return <span style={{ color: normalColor, fontWeight: "bold" }}>思考が完了しました</span>
						}

						if (apiRequestFailedMessage) {
							return <span style={{ color: errorColor, fontWeight: "bold" }}>処理に失敗しました</span>
						}

						return <span style={{ color: normalColor, fontWeight: "bold" }}>思考中...</span>
					})(),
				]
			case "followup":
				return [
					<span
						className="codicon codicon-question"
						style={{
							color: normalColor,
							marginBottom: "-1.5px",
						}}></span>,
					<span style={{ color: normalColor, fontWeight: "bold" }}>AIから質問があります。</span>,
				]
			default:
				return [null, null]
		}
	}, [type, cost, apiRequestFailedMessage, isCommandExecuting, apiReqCancelReason, isMcpServerResponding, message.text])

	const headerStyle: React.CSSProperties = {
		display: "flex",
		alignItems: "center",
		gap: "10px",
		marginBottom: "12px",
	}

	const pStyle: React.CSSProperties = {
		margin: 0,
		whiteSpace: "pre-wrap",
		wordBreak: "break-word",
		overflowWrap: "anywhere",
	}

	const tool = useMemo(() => {
		if (message.ask === "tool" || message.say === "tool") {
			return JSON.parse(message.text || "{}") as ClineSayTool
		}
		return null
	}, [message.ask, message.say, message.text])

	if (tool) {
		const toolIcon = (name: string) => (
			<span
				className={`codicon codicon-${name}`}
				style={{
					color: "var(--vscode-foreground)",
					marginBottom: "-1.5px",
				}}></span>
		)

		switch (tool.tool) {
			case "editedExistingFile":
				return (
					<>
						<div style={headerStyle}>
							{toolIcon("edit")}
							<span style={{ fontWeight: "bold" }}>AIが以下のファイルを編集します。</span>
						</div>
						<CodeAccordian
							// isLoading={message.partial}
							code={tool.content}
							path={tool.path!}
							isExpanded={isExpanded}
							onToggleExpand={onToggleExpand}
						/>
					</>
				)
			case "newFileCreated":
				return (
					<>
						<div style={headerStyle}>
							{toolIcon("new-file")}
							<span style={{ fontWeight: "bold" }}>AIが以下のファイルを作成します。</span>
						</div>
						<CodeAccordian
							isLoading={message.partial}
							code={tool.content!}
							path={tool.path!}
							isExpanded={isExpanded}
							onToggleExpand={onToggleExpand}
						/>
					</>
				)
			case "readFile":
				return (
					<>
						<div style={headerStyle}>
							{toolIcon("file-code")}
							<span style={{ fontWeight: "bold" }}>
								{/* {message.type === "ask" ? "" : "Cline read this file:"} */}
								AIが以下のファイルを読み込みます。
							</span>
						</div>
						<div
							style={{
								borderRadius: 3,
								backgroundColor: CODE_BLOCK_BG_COLOR,
								overflow: "hidden",
								border: "1px solid var(--vscode-editorGroup-border)",
							}}>
							<div
								style={{
									color: "var(--vscode-descriptionForeground)",
									display: "flex",
									alignItems: "center",
									padding: "9px 10px",
									cursor: "pointer",
									userSelect: "none",
									WebkitUserSelect: "none",
									MozUserSelect: "none",
									msUserSelect: "none",
								}}
								onClick={() => {
									vscode.postMessage({
										type: "openFile",
										text: tool.content,
									})
								}}>
								{tool.path?.startsWith(".") && <span>.</span>}
								<span
									style={{
										whiteSpace: "nowrap",
										overflow: "hidden",
										textOverflow: "ellipsis",
										marginRight: "8px",
										direction: "rtl",
										textAlign: "left",
									}}>
									{cleanPathPrefix(tool.path ?? "") + "\u200E"}
								</span>
								<div style={{ flexGrow: 1 }}></div>
								<span
									className={`codicon codicon-link-external`}
									style={{
										fontSize: 13.5,
										margin: "1px 0",
									}}></span>
							</div>
						</div>
					</>
				)
			case "listFilesTopLevel":
				return (
					<>
						<div style={headerStyle}>
							{toolIcon("folder-opened")}
							<span style={{ fontWeight: "bold" }}>
								{message.type === "ask"
									? "AIが以下のディレクトリのトップレベルファイルを表示します。"
									: "AIが以下のディレクトリのトップレベルファイルを表示しました。"}
							</span>
						</div>
						<CodeAccordian
							code={tool.content!}
							path={tool.path!}
							language="shell-session"
							isExpanded={isExpanded}
							onToggleExpand={onToggleExpand}
						/>
					</>
				)
			case "listFilesRecursive":
				return (
					<>
						<div style={headerStyle}>
							{toolIcon("folder-opened")}
							<span style={{ fontWeight: "bold" }}>
								{message.type === "ask"
									? "AIが以下のディレクトリの再帰的なファイルを表示します。"
									: "AIが以下のディレクトリの再帰的なファイルを表示しました。"}
							</span>
						</div>
						<CodeAccordian
							code={tool.content!}
							path={tool.path!}
							language="shell-session"
							isExpanded={isExpanded}
							onToggleExpand={onToggleExpand}
						/>
					</>
				)
			case "listCodeDefinitionNames":
				return (
					<>
						<div style={headerStyle}>
							{toolIcon("file-code")}
							<span style={{ fontWeight: "bold" }}>
								{message.type === "ask"
									? "AIがこのディレクトリのソースコード定義名を表示します。"
									: "AIがこのディレクトリのソースコード定義名を表示しました。"}
							</span>
						</div>
						<CodeAccordian
							code={tool.content!}
							path={tool.path!}
							isExpanded={isExpanded}
							onToggleExpand={onToggleExpand}
						/>
					</>
				)
			case "searchFiles":
				return (
					<>
						<div style={headerStyle}>
							{toolIcon("search")}
							<span style={{ fontWeight: "bold" }}>
								AIがこのディレクトリで <code>{tool.regex}</code> を検索します。
							</span>
						</div>
						<CodeAccordian
							code={tool.content!}
							path={tool.path! + (tool.filePattern ? `/(${tool.filePattern})` : "")}
							language="plaintext"
							isExpanded={isExpanded}
							onToggleExpand={onToggleExpand}
						/>
					</>
				)
			default:
				return null
		}
	}

	if (message.ask === "command" || message.say === "command") {
		const splitMessage = (text: string) => {
			const outputIndex = text.indexOf(COMMAND_OUTPUT_STRING)
			if (outputIndex === -1) {
				return { command: text, output: "" }
			}
			return {
				command: text.slice(0, outputIndex).trim(),
				output: text
					.slice(outputIndex + COMMAND_OUTPUT_STRING.length)
					.trim()
					.split("")
					.map((char) => {
						switch (char) {
							case "\t":
								return "→   "
							case "\b":
								return "⌫"
							case "\f":
								return "⏏"
							case "\v":
								return "⇳"
							default:
								return char
						}
					})
					.join(""),
			}
		}

		const { command: rawCommand, output } = splitMessage(message.text || "")

		const requestsApproval = rawCommand.endsWith(COMMAND_REQ_APP_STRING)
		const command = requestsApproval ? rawCommand.slice(0, -COMMAND_REQ_APP_STRING.length) : rawCommand

		return (
			<>
				<div style={headerStyle}>
					{icon}
					{title}
				</div>
				<div
					style={{
						borderRadius: 3,
						border: "1px solid var(--vscode-editorGroup-border)",
						overflow: "hidden",
						backgroundColor: CODE_BLOCK_BG_COLOR,
					}}>
					<CodeBlock source={`${"```"}shell\n${command}\n${"```"}`} forceWrap={true} />
					{output.length > 0 && (
						<div style={{ width: "100%" }}>
							<div
								onClick={onToggleExpand}
								style={{
									display: "flex",
									alignItems: "center",
									gap: "4px",
									width: "100%",
									justifyContent: "flex-start",
									cursor: "pointer",
									padding: `2px 8px ${isExpanded ? 0 : 8}px 8px`,
								}}>
								<span className={`codicon codicon-chevron-${isExpanded ? "down" : "right"}`}></span>
								<span style={{ fontSize: "0.8em" }}>コマンドの出力</span>
							</div>
							{isExpanded && <CodeBlock source={`${"```"}shell\n${output}\n${"```"}`} />}
						</div>
					)}
				</div>
				{requestsApproval && (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 10,
							padding: 8,
							fontSize: "12px",
							color: "var(--vscode-editorWarning-foreground)",
						}}>
						<i className="codicon codicon-warning"></i>
						<span>このコマンドは明示的な承認が必要です。</span>
					</div>
				)}
			</>
		)
	}

	if (message.ask === "use_mcp_server" || message.say === "use_mcp_server") {
		const useMcpServer = JSON.parse(message.text || "{}") as ClineAskUseMcpServer
		const server = mcpServers.find((server) => server.name === useMcpServer.serverName)
		return (
			<>
				<div style={headerStyle}>
					{icon}
					{title}
				</div>

				<div
					style={{
						background: "var(--vscode-textCodeBlock-background)",
						borderRadius: "3px",
						padding: "8px 10px",
						marginTop: "8px",
					}}>
					{useMcpServer.type === "access_mcp_resource" && (
						<McpResourceRow
							item={{
								...(findMatchingResourceOrTemplate(
									useMcpServer.uri || "",
									server?.resources,
									server?.resourceTemplates,
								) || {
									name: "",
									mimeType: "",
									description: "",
								}),
								uri: useMcpServer.uri || "",
							}}
						/>
					)}

					{useMcpServer.type === "use_mcp_tool" && (
						<>
							<div onClick={(e) => e.stopPropagation()}>
								<McpToolRow
									tool={{
										name: useMcpServer.toolName || "",
										description:
											server?.tools?.find((tool) => tool.name === useMcpServer.toolName)?.description || "",
										autoApprove:
											server?.tools?.find((tool) => tool.name === useMcpServer.toolName)?.autoApprove ||
											false,
									}}
									serverName={useMcpServer.serverName}
								/>
							</div>
							{useMcpServer.arguments && useMcpServer.arguments !== "{}" && (
								<div style={{ marginTop: "8px" }}>
									<div
										style={{
											marginBottom: "4px",
											opacity: 0.8,
											fontSize: "12px",
											textTransform: "uppercase",
										}}>
										引数
									</div>
									<CodeAccordian
										code={useMcpServer.arguments}
										language="json"
										isExpanded={true}
										onToggleExpand={onToggleExpand}
									/>
								</div>
							)}
						</>
					)}
				</div>
			</>
		)
	}

	switch (message.type) {
		case "say":
			switch (message.say) {
				case "api_req_started":
					return (
						<>
							<div
								style={{
									...headerStyle,
									marginBottom:
										(cost == null && apiRequestFailedMessage) || apiReqStreamingFailedMessage ? 10 : 0,
									justifyContent: "space-between",
									cursor: "pointer",
									userSelect: "none",
									WebkitUserSelect: "none",
									MozUserSelect: "none",
									msUserSelect: "none",
								}}
								onClick={onToggleExpand}>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: "10px",
									}}>
									{icon}
									{title}
									{/* Need to render this every time since it affects height of row by 2px */}
									<VSCodeBadge
										style={{
											opacity: cost != null && cost > 0 ? 1 : 0,
										}}>
										${Number(cost || 0)?.toFixed(4)}
									</VSCodeBadge>
								</div>
								<span className={`codicon codicon-chevron-${isExpanded ? "up" : "down"}`}></span>
							</div>
							{((cost == null && apiRequestFailedMessage) || apiReqStreamingFailedMessage) && (
								<MessageContent isImportant>
									{(() => {
										// Try to parse the error message as JSON for credit limit error
										const errorData = parseErrorText(apiRequestFailedMessage)
										if (errorData) {
											if (
												errorData.code === "insufficient_credits" &&
												typeof errorData.current_balance === "number" &&
												typeof errorData.total_spent === "number" &&
												typeof errorData.total_promotions === "number" &&
												typeof errorData.message === "string"
											) {
												return (
													<CreditLimitError
														currentBalance={errorData.current_balance}
														totalSpent={errorData.total_spent}
														totalPromotions={errorData.total_promotions}
														message={errorData.message}
													/>
												)
											}
										}

										// Default error display
										return (
											<p
												style={{
													...pStyle,
													color: "var(--vscode-errorForeground)",
												}}>
												{apiRequestFailedMessage || apiReqStreamingFailedMessage}
												{apiRequestFailedMessage?.toLowerCase().includes("powershell") && (
													<>
														<br />
														<br />
														WindowsのPowerShellに問題が発生しているようです。{" "}
														<a
															href="https://github.com/cline/cline/wiki/TroubleShooting-%E2%80%90-%22PowerShell-is-not-recognized-as-an-internal-or-external-command%22"
															style={{
																color: "inherit",
																textDecoration: "underline",
															}}>
															トラブルシューティングガイド
														</a>
														をご覧ください。
													</>
												)}
											</p>
										)
									})()}
								</MessageContent>
							)}

							{isExpanded && (
								<div style={{ marginTop: "10px" }}>
									<CodeAccordian
										code={JSON.parse(message.text || "{}").request}
										language="markdown"
										isExpanded={true}
										onToggleExpand={onToggleExpand}
									/>
								</div>
							)}
						</>
					)
				case "api_req_finished":
					return null // we should never see this message type
				// case "mcp_server_response":
				// 	return <McpResponseDisplay responseText={message.text || ""} />
				case "mcp_server_response":
					return (
						<>
							<div style={{ paddingTop: 0 }}>
								<div
									style={{
										marginBottom: "4px",
										opacity: 0.8,
										fontSize: "12px",
										textTransform: "uppercase",
									}}>
									応答
								</div>
								<CodeAccordian
									code={message.text}
									language="json"
									isExpanded={true}
									onToggleExpand={onToggleExpand}
								/>
							</div>
						</>
					)
				case "text":
					return (
						<div>
							<MessageContent isImportant={false}>
								<Markdown markdown={message.text} />
							</MessageContent>
						</div>
					)
				case "reasoning":
					return (
						<>
							{message.text && (
								<div
									onClick={onToggleExpand}
									style={{
										// marginBottom: 15,
										cursor: "pointer",
										color: "var(--vscode-descriptionForeground)",

										fontStyle: "italic",
										overflow: "hidden",
									}}>
									{isExpanded ? (
										<div style={{ marginTop: -3 }}>
											<span style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>
												思考中
												<span
													className="codicon codicon-chevron-down"
													style={{
														display: "inline-block",
														transform: "translateY(3px)",
														marginLeft: "1.5px",
													}}
												/>
											</span>
											{message.text}
										</div>
									) : (
										<div style={{ display: "flex", alignItems: "center" }}>
											<span style={{ fontWeight: "bold", marginRight: "4px" }}>思考中:</span>
											<span
												style={{
													whiteSpace: "nowrap",
													overflow: "hidden",
													textOverflow: "ellipsis",
													direction: "rtl",
													textAlign: "left",
													flex: 1,
												}}>
												{message.text + "\u200E"}
											</span>
											<span
												className="codicon codicon-chevron-right"
												style={{
													marginLeft: "4px",
													flexShrink: 0,
												}}
											/>
										</div>
									)}
								</div>
							)}
						</>
					)
				case "user_feedback":
					return (
						<div
							style={{
								backgroundColor: "var(--vscode-badge-background)",
								color: "var(--vscode-badge-foreground)",
								borderRadius: "3px",
								padding: "9px",
								whiteSpace: "pre-line",
								wordWrap: "break-word",
							}}>
							<span style={{ display: "block" }}>{highlightMentions(message.text)}</span>
							{message.images && message.images.length > 0 && (
								<Thumbnails images={message.images} style={{ marginTop: "8px" }} />
							)}
						</div>
					)
				case "user_feedback_diff":
					const tool = JSON.parse(message.text || "{}") as ClineSayTool
					return (
						<div
							style={{
								marginTop: -10,
								width: "100%",
							}}>
							<CodeAccordian
								diff={tool.diff!}
								isFeedback={true}
								isExpanded={isExpanded}
								onToggleExpand={onToggleExpand}
							/>
						</div>
					)
				case "error":
					return (
						<>
							{title && (
								<div style={headerStyle}>
									{icon}
									{title}
								</div>
							)}
							<p
								style={{
									...pStyle,
									color: "var(--vscode-errorForeground)",
								}}>
								{message.text}
							</p>
						</>
					)
				case "diff_error":
					return (
						<>
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									backgroundColor: "var(--vscode-textBlockQuote-background)",
									padding: 8,
									borderRadius: 3,
									fontSize: 12,
									color: "var(--vscode-foreground)",
									opacity: 0.8,
								}}>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										marginBottom: 4,
									}}>
									<i
										className="codicon codicon-warning"
										style={{
											marginRight: 8,
											fontSize: 14,
											color: "var(--vscode-descriptionForeground)",
										}}></i>
									<span style={{ fontWeight: 500 }}>差分の編集が一致しません</span>
								</div>
								<div>
									モデルはファイル内に一致するものが見つからない検索パターンを使用しました。再試行します...
								</div>
							</div>
						</>
					)
				case "clineignore_error":
					return (
						<>
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									backgroundColor: "rgba(255, 191, 0, 0.1)",
									padding: 8,
									borderRadius: 3,
									fontSize: 12,
								}}>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										marginBottom: 4,
									}}>
									<i
										className="codicon codicon-error"
										style={{
											marginRight: 8,
											fontSize: 18,
											color: "#FFA500",
										}}></i>
									<span
										style={{
											fontWeight: 500,
											color: "#FFA500",
										}}>
										アクセス拒否
									</span>
								</div>
								<div>
									AIが <code>{message.text}</code> へのアクセスが <code>.clineignore</code>{" "}
									ファイルによってブロックされました。
								</div>
							</div>
						</>
					)
				case "checkpoint_created":
					return (
						<>
							<CheckmarkControl messageTs={message.ts} isCheckpointCheckedOut={message.isCheckpointCheckedOut} />
						</>
					)
				case "completion_result":
					const hasChanges = message.text?.endsWith(COMPLETION_RESULT_CHANGES_FLAG) ?? false
					const text = hasChanges ? message.text?.slice(0, -COMPLETION_RESULT_CHANGES_FLAG.length) : message.text

					// Extract nodeId if present in the message
					const nodeIdMatch = text?.match(/node_id[:=]\s*["']?([^"',\s]+)["']?/i)
					const nodeId = nodeIdMatch ? nodeIdMatch[1] : null

					// Check if this is from an attempt_completion tool call
					const isAttemptCompletion = nodeId !== null

					return (
						<>
							<div
								style={{
									...headerStyle,
									marginBottom: "10px",
								}}>
								{icon}
								{title}
							</div>
							<div
								style={{
									color: "var(--vscode-charts-green)",
									paddingTop: 10,
								}}>
								<MessageContent isImportant>
									<Markdown markdown={text} />
								</MessageContent>
							</div>
							{message.partial !== true && (
								<div style={{ paddingTop: 17 }}>
									{isAttemptCompletion ? (
										<SuccessButton
											onClick={() => {
												vscode.postMessage({
													type: "validateTask",
													text: `${nodeId}`,
												})
											}}
											style={{
												width: "100%",
											}}>
											<i className="codicon codicon-check" style={{ marginRight: 6 }} />
											学習を完了にする
										</SuccessButton>
									) : (
										hasChanges && (
											<SuccessButton
												disabled={seeNewChangesDisabled}
												onClick={() => {
													setSeeNewChangesDisabled(true)
													vscode.postMessage({
														type: "taskCompletionViewChanges",
														number: message.ts,
													})
												}}
												style={{
													width: "100%",
													cursor: seeNewChangesDisabled ? "wait" : "pointer",
												}}>
												<i className="codicon codicon-new-file" style={{ marginRight: 6 }} />
												変更内容を確認する
											</SuccessButton>
										)
									)}
								</div>
							)}
						</>
					)
				case "shell_integration_warning":
					return (
						<>
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									backgroundColor: "rgba(255, 191, 0, 0.1)",
									padding: 8,
									borderRadius: 3,
									fontSize: 12,
								}}>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										marginBottom: 4,
									}}>
									<i
										className="codicon codicon-warning"
										style={{
											marginRight: 8,
											fontSize: 18,
											color: "#FFA500",
										}}></i>
									<span
										style={{
											fontWeight: 500,
											color: "#FFA500",
										}}>
										シェル連携が利用できません
									</span>
								</div>
								<div>
									コマンドの出力を表示できません。VSCodeを更新し（
									<code>CMD/CTRL + Shift + P</code> →
									"Update"）、サポートされているシェルを使用していることを確認してください：
									zsh、bash、fish、またはPowerShell（<code>CMD/CTRL + Shift + P</code> → "Terminal: Select
									Default Profile"）。{" "}
									<a
										href="https://github.com/cline/cline/wiki/Troubleshooting-%E2%80%90-Shell-Integration-Unavailable"
										style={{
											color: "inherit",
											textDecoration: "underline",
										}}>
										問題が解決しない場合
									</a>
								</div>
							</div>
						</>
					)
				default:
					return (
						<>
							{title && (
								<div style={headerStyle}>
									{icon}
									{title}
								</div>
							)}
							<div style={{ paddingTop: 10 }}>
								<MessageContent isImportant={false}>
									<Markdown markdown={message.text} />
								</MessageContent>
							</div>
						</>
					)
			}
		case "ask":
			switch (message.ask) {
				case "mistake_limit_reached":
					return (
						<>
							<div style={headerStyle}>
								{icon}
								{title}
							</div>
							<MessageContent isImportant>
								<p
									style={{
										...pStyle,
										color: "var(--vscode-errorForeground)",
									}}>
									{message.text}
								</p>
							</MessageContent>
						</>
					)
				case "auto_approval_max_req_reached":
					return (
						<>
							<div style={headerStyle}>
								{icon}
								{title}
							</div>
							<MessageContent isImportant>
								<p
									style={{
										...pStyle,
										color: "var(--vscode-errorForeground)",
									}}>
									{message.text}
								</p>
							</MessageContent>
						</>
					)
				case "completion_result":
					if (message.text) {
						const hasChanges = message.text.endsWith(COMPLETION_RESULT_CHANGES_FLAG) ?? false
						const text = hasChanges ? message.text.slice(0, -COMPLETION_RESULT_CHANGES_FLAG.length) : message.text

						// Extract nodeId if present in the message
						const nodeIdMatch = text?.match(/node_id[:=]\s*["']?([^"',\s]+)["']?/i)
						const nodeId = nodeIdMatch ? nodeIdMatch[1] : null

						// Check if this is from an attempt_completion tool call
						const isAttemptCompletion = nodeId !== null

						return (
							<div>
								<div
									style={{
										...headerStyle,
										marginBottom: "10px",
									}}>
									{icon}
									{title}
								</div>
								<div
									style={{
										color: "var(--vscode-charts-green)",
										paddingTop: 10,
									}}>
									<MessageContent isImportant>
										<Markdown markdown={text} />
									</MessageContent>
									{message.partial !== true && (
										<div style={{ marginTop: 15 }}>
											{isAttemptCompletion ? (
												<SuccessButton
													onClick={() => {
														vscode.postMessage({
															type: "validateTask",
															text: `${nodeId}`,
														})
													}}
													style={{
														width: "100%",
													}}>
													<i className="codicon codicon-check" style={{ marginRight: 6 }} />
													学習を完了にする
												</SuccessButton>
											) : (
												hasChanges && (
													<SuccessButton
														disabled={seeNewChangesDisabled}
														onClick={() => {
															setSeeNewChangesDisabled(true)
															vscode.postMessage({
																type: "taskCompletionViewChanges",
																number: message.ts,
															})
														}}
														style={{
															width: "100%",
															cursor: seeNewChangesDisabled ? "wait" : "pointer",
														}}>
														<i className="codicon codicon-new-file" style={{ marginRight: 6 }} />
														変更内容を確認する
													</SuccessButton>
												)
											)}
										</div>
									)}
								</div>
							</div>
						)
					} else {
						return null // Don't render anything when we get a completion_result ask without text
					}
				case "followup":
					let question: string | undefined
					let options: string[] | undefined
					let selected: string | undefined
					try {
						const parsedMessage = JSON.parse(message.text || "{}") as ClineAskQuestion
						question = parsedMessage.question
						options = parsedMessage.options
						selected = parsedMessage.selected
					} catch (e) {
						// legacy messages would pass question directly
						question = message.text
					}

					return (
						<>
							{title && (
								<div style={headerStyle}>
									{icon}
									{title}
								</div>
							)}
							<div style={{ paddingTop: 10 }}>
								<MessageContent isImportant>
									<Markdown markdown={question} />
								</MessageContent>
								<OptionsButtons
									options={options}
									selected={selected}
									isActive={isLast && lastModifiedMessage?.ask === "followup"}
								/>
							</div>
						</>
					)
				case "plan_mode_response": {
					let response: string | undefined
					let options: string[] | undefined
					let selected: string | undefined
					try {
						const parsedMessage = JSON.parse(message.text || "{}") as ClinePlanModeResponse
						response = parsedMessage.response
						options = parsedMessage.options
						selected = parsedMessage.selected
					} catch (e) {
						// legacy messages would pass response directly
						response = message.text
					}
					return (
						<div style={{}}>
							<MessageContent isImportant={false}>
								<Markdown markdown={response} />
							</MessageContent>
							<OptionsButtons
								options={options}
								selected={selected}
								isActive={isLast && lastModifiedMessage?.ask === "plan_mode_response"}
							/>
						</div>
					)
				}
				default:
					return null
			}
	}
}
function parseErrorText(text: string | undefined) {
	if (!text) {
		return undefined
	}
	try {
		const startIndex = text.indexOf("{")
		const endIndex = text.lastIndexOf("}")
		if (startIndex !== -1 && endIndex !== -1) {
			const jsonStr = text.substring(startIndex, endIndex + 1)
			const errorObject = JSON.parse(jsonStr)
			return errorObject
		}
	} catch (e) {
		// Not JSON or missing required fields
	}
}
