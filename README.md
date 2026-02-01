This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## iOS App Release

このプロジェクトはCapacitorを使用してiOSアプリとしてリリースできます。

### 前提条件

- macOS
- Xcode (最新版推奨)
- Apple Developer Program メンバーシップ（有料アプリの場合は必須）
- Node.js

### ビルド手順

1. **Webアセットをビルド**

```bash
npm run build
```

2. **Capacitorと同期**

```bash
npx cap sync ios
```

3. **Xcodeでプロジェクトを開く**

```bash
npx cap open ios
```

### App Store リリース手順

1. **Xcodeでの設定**
   - Signing & Capabilities で Team を選択
   - Bundle Identifier が `com.engskillmap.app` になっていることを確認
   - Version と Build 番号を設定

2. **アーカイブの作成**
   - Xcode メニュー: Product → Destination → Any iOS Device (arm64)
   - Product → Archive
   - アーカイブが完了するとOrganizerが開く

3. **App Store Connect へアップロード**
   - Organizer で作成したアーカイブを選択
   - "Distribute App" をクリック
   - "App Store Connect" を選択
   - "Upload" を選択して指示に従う

4. **App Store Connect での設定**
   - [App Store Connect](https://appstoreconnect.apple.com/) にログイン
   - 新しいアプリを作成（または既存のアプリを選択）
   - アプリ情報を入力:
     - アプリ名
     - 説明文
     - キーワード
     - スクリーンショット（6.7インチ、6.5インチ、5.5インチ）
     - アプリアイコン
     - プライバシーポリシーURL
   - 価格と配信地域を設定
   - 審査に提出

### アプリアイコンの設定

`ios/App/App/Assets.xcassets/AppIcon.appiconset/` にアイコン画像を配置:
- 1024x1024px（App Store用）
- その他各サイズ（Xcodeが自動生成する場合もある）

### 更新時の手順

```bash
# コードを変更後
npm run build
npx cap sync ios
npx cap open ios
# → Xcode で Version/Build を更新してアーカイブ
```
