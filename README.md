# Skill Atlas Workbench

Skill Atlas is a standalone, serverless workbench designed to visualize, validate, and safely edit AI agent instruction graphs. It provides a visual graph representation of your AI skills, ensuring they comply with structural guidelines and allowing you to safely push changes back to GitHub.

## Features
- **Visual Node Graph:** Built with React Flow, it instantly maps out your entire skill repository and its dependencies.
- **Real-time Diagnostics:** Validates skills against strict rules (e.g., no cycles, orphans, missing frontmatter) and flags them with contextual explanations.
- **Integrated IDE:** A split-pane Monaco Editor allows you to directly edit Markdown and Code files within the browser.
- **GitHub Integration:** Fetches skills directly from remote GitHub repositories and pushes modifications securely back as Pull Requests using GitHub OAuth.

## Local Development

### 1. Configure Environment Variables
You must configure GitHub OAuth to allow the application to push Pull Requests on your behalf.
Create a `.env.local` file in the root of the project:

```env
GITHUB_ID="your_local_oauth_client_id"
GITHUB_SECRET="your_local_oauth_client_secret"
NEXTAUTH_SECRET="a_random_secure_string_for_encryption"
NEXTAUTH_URL="http://localhost:3000"
```

To get your `GITHUB_ID` and `GITHUB_SECRET`:
1. Go to GitHub **Settings** > **Developer Settings** > **OAuth Apps** > **New OAuth App**.
2. Set **Homepage URL** to `http://localhost:3000`
3. Set **Authorization callback URL** to `http://localhost:3000/api/auth/callback/github`
4. Register the app and copy the credentials into your `.env.local`.

### 2. Run the App
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deploy to Vercel

Deploying Skill Atlas to Vercel is seamless since it is a Next.js application.

### 1. Push to GitHub
Ensure this codebase is pushed to your own GitHub repository.

### 2. Create a Production GitHub OAuth App
Because OAuth is tied strictly to URLs for security, you must create a new OAuth app specifically for your Vercel deployment:
1. Go to GitHub **Settings** > **Developer Settings** > **OAuth Apps** > **New OAuth App**.
2. Set **Application Name** to `Skill Atlas (Production)`
3. Set **Homepage URL** to your target Vercel domain (e.g., `https://my-skill-atlas.vercel.app`).
4. Set **Authorization callback URL** to `https://my-skill-atlas.vercel.app/api/auth/callback/github`.
5. Save and copy the **Client ID** and **Client Secret**.

### 3. Import and Deploy
1. Log into [Vercel](https://vercel.com) and click **Add New** > **Project**.
2. Import your GitHub repository.
3. In the **Environment Variables** section before deploying, add:
   - `GITHUB_ID` = *(Your Production Client ID)*
   - `GITHUB_SECRET` = *(Your Production Client Secret)*
   - `NEXTAUTH_SECRET` = *(A long, random, secure password string)*
   *(Note: You do not need to set `NEXTAUTH_URL` on Vercel).*
4. Click **Deploy**.

Once deployed, your app is completely serverless and will securely handle GitHub authentication without managing any passwords itself.
