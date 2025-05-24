# Changelog

## 0.24.0

### Minor Changes

-   Updated default model from Claude 3.7 Sonnet to Claude Sonnet 4 and added support for new Claude 4 models (Sonnet 4 and Opus 4) with updated pricing and configuration.

## 0.23.0

### Minor Changes

-   Updated Claude 3.7 Sonnet references to Claude 4 Sonnet with Japanese translations and fixed syntax errors in ApiOptions.tsx

## 0.22.3

### Patch Changes

-   Added thinking tag usage instruction to the prompt and clarified directions for better learning experience

## 0.22.2

### Patch Changes

-   Clarified wording of image tag restriction in Markdown files in system prompt.

## 0.22.1

### Patch Changes

-   Fix task URL handling to properly decode special characters like ampersands.

## 0.22.0

### Minor Changes

-   Removed MCP button from sidebar and disabled MCP marketplace by default

## 0.21.0

### Minor Changes

-   Removed AutoApproveMenu component from ChatView to simplify the interface

## 0.20.3

### Patch Changes

-   Updated error messages to replace 'Cline' with '忘我LMS AI' in Japanese for better brand alignment

## 0.20.2

### Patch Changes

-   chore: remove debug console.log statements

## 0.20.1

### Patch Changes

-   Added a rule to prohibit using image tags with URLs when creating or editing markdown files

## 0.20.0

### Minor Changes

-   Automatically sets Claude 3.7 Sonnet as the exclusive model for subscribed users while disabling model selection in the UI.

## 0.19.0

### Minor Changes

-   Add subscription status badge to display user subscription information from auth callback

## 0.18.0

### Minor Changes

-   Added support for displaying '無制限' (unlimited) balance values in the account view

## 0.17.18

### Patch Changes

-   improve system prompt to enforce the pragmatic exercises

## 0.17.17

### Patch Changes

-   Set fixed thinking budget tokens to 1024 and ensure configuration updates are properly persisted.

## 0.17.16

### Patch Changes

-   Updated terminal and browser UI text from 'Cline' to '忘我LMS AI' and translated several UI elements to Japanese.

## 0.17.15

### Patch Changes

-   Localized system notifications to Japanese and rebranded as '忘我LMS AI'

## 0.17.14

### Patch Changes

-   Translated error messages from English to Japanese to improve user experience for Japanese-speaking users

## 0.17.13

### Patch Changes

-   Fixed the bouga-lms:no-model display issue by replacing the hardcoded no-model string with the proper default model ID when a user first opens the extension.

## 0.17.12

### Patch Changes

-   Updated product descriptions in ChatView and WelcomeView to focus on Bouga LMS AI's personalized learning features and add integration with the Bouga LMS website

## 0.17.11

### Patch Changes

-   Enhanced learning methodology to maximize student code writing opportunities and implemented a minimum of 2 attempt tries before providing solutions.

## 0.17.10

### Patch Changes

-   fix package.json description to japanese

## 0.17.9

### Patch Changes

-   change readme.md to japanese and clear explanation of tool

## 0.17.8

### Patch Changes

-   Improved clarity of instructions for learning materials creation by referencing learning process and evaluation methods.

## 0.17.7

### Patch Changes

-   system.tsのattempt_completionツールでnode_IDの提供形式を明確化し、対象ユーザーを中高生から高校生に修正

## 0.17.6

### Patch Changes

-   attempt_completionツールでユーザータスクからnode_idを検索して提供するよう指示を更新

## 0.17.5

### Patch Changes

-   Updated system prompt to specify creating directories in English and streamlined assessment instructions.

## 0.17.4

### Patch Changes

-   improve system prompt for ai

## 0.17.3

### Patch Changes

-   fix url for bouga-lms

## 0.17.2

### Patch Changes

-   fix api url

## 0.17.1

### Patch Changes

-   fix exteniblethinking error which cause model error

## 0.17.0

### Minor Changes

-   use bouga LMS API fetchBalance

## 0.16.1

### Patch Changes

-   Translated ContextMenu and TaskHeader UI elements from English to Japanes

## 0.16.0

### Minor Changes

-   Japanese localization for AutoApproveMenu component and removal of Plan/Act toggle from ChatTextArea

## 0.15.1

### Patch Changes

-   Translated UI elements to Japanese for better localization support

## 0.15.0

### Minor Changes

-   Update Bouga LMS API endpoints and add Japanese task ID pattern recognition

## 0.14.1

### Patch Changes

-   improve system prompt for better exercise creation

## 0.14.0

### Minor Changes

-   Added Japanese language support and improved UI/UX with better node_id extraction, error message display, and chat interface enhancements.

## 0.13.0

### Minor Changes

-   Added learning completion validation feature with a UI button and backend API integration to validate learning tasks.

## 0.12.2

### Patch Changes

-   Removed useless console logs from the codebase

## 0.12.1

### Patch Changes

-   Fixed userInfo undefined issue in AccountView by improving authentication state handling and explicitly managing user profile data during login/logout flows.

## 0.12.0

### Minor Changes

-   Added Account button in sidebar with Japanese UI

## 0.11.0

### Minor Changes

-   Enhance the attempt_beginning tool to display learning guides as a cohesive unit with proper formatting for objectives, plans, and evaluation methods in Japanese."

## 0.10.0

### Minor Changes

-   UI改善: チャットメッセージの可視性を調整し、重要なメッセージを強調表示。技術的な用語を高校生向けにわかりやすく翻訳。AI関連の通知と指示をより理解しやすく日本語化。

## 0.9.1

### Patch Changes

-   Remove 'use your own API key' button from welcome screen for simplified UX

## 0.9.0

### Minor Changes

-   Update API models: Add Amazon models to Bedrock, new Gemini model, update OpenAI models, and add SambaNova models

## 0.8.0

### Minor Changes

-   Implemented account management system with Supabase authentication, credit tracking, billing history, and usage analytics for OpenRouter.ai integration.

## 0.7.7

### Patch Changes

-   Fix vscode extention id from bougaLmsAi to bouga-lms-ai

## 0.7.6

### Patch Changes

-   Changed the webview panel title from "Cline" to "Bouga LMS AI"

## 0.7.5

### Patch Changes

-   Translate Models description from english to japanese

## 0.7.4

### Patch Changes

-   Japanese translation of AI model descriptions (Claude 3.7, Grok, VSCode LM)

## 0.7.3

### Patch Changes

-   UI要素の日本語化: モデル選択画面、拡張思考設定、説明文の翻訳を実施。OpenRouterModelPicker、ThinkingBudgetSlider、モデル情報の表示テキストを日本語に変更。

## 0.7.2

### Patch Changes

-   fix: Store both bougaLmsApiKey and openRouterApiKey in handleAuthCallback to ensure proper model validation while using Bouga LMS provider

## 0.7.0

### Minor Changes

-   refactor: change API provider from Cline to OpenRouter"

## 0.6.1

### Patch Changes

-   Improved system prompt to better support Japanese middle school students learning programming. Added clear learning objectives, step-by-step assessment, and Japanese language support.

## 0.6.0

### Minor Changes

-   Added signup functionality to enable new users to create accounts directly from the extension

## 0.5.4

### Patch Changes

-   Improved UI layout by moving logout button to main view and fixing task deletion accessibility

## 0.5.3

### Patch Changes

-   b5930eb: Refactor task URI handling by adding `handleTaskCallback` method to handle task URI callbacks consistently with other URI handlers. This improves code organization and maintainability.

## 0.5.1

### Patch Changes

-   fix: Improve URI handler with better error handling and debug logs

## 0.5.0

### Minor Changes

-   Add extention to execute task from web

## 0.4.2

### Minor Changes

-   Add logout button to chat view UI

## 0.4.0

### Minor Changes

-   6f22938: Update URL params for oauth

## 0.3.1

### Patch Changes

-   fade1ee: Fix changset for supabase

## 0.3.0

### Minor Changes

-   Implement Supabase authentication
-   Replace Firebase authentication with Supabase
-   Add new SupabaseAuthContext for managing auth state
-   Update user profile handling with Supabase data structure

## 0.2.0

### Minor Changes

-   4618c66: docs: update README files

## 0.1.0

### Minor Changes

-   Change app name to Bouga LMS AI
