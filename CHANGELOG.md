# Changelog

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
