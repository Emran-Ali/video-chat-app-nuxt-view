# Nuxt Real-time Video Chat App

A premium, full-featured real-time communication platform built with **Nuxt 3**, powered by **Stream Video & Chat SDK**.

## 🚀 Why this project?

While **GetStream** offers exceptional documentation and pre-built components for React and other frameworks, there is currently a lack of first-class UI component support for **Vue.js** or **Nuxt**.

This project was created to bridge that gap—providing a robust, custom-built implementation of Stream's powerful SDKs within a Nuxt 3 ecosystem. It is open-source and intended to serve as a high-quality foundation for anyone looking to build real-time video and chat features in the Vue/Nuxt world.

---

## ✨ Key Features

### 💬 Real-time Messaging

- **One-on-one & Group Chats**: Seamless messaging experience.
- **Typing Indicators**: Real-time feedback when users are typing.
- **Read Receipts**: Know exactly when your messages are seen.
- **Rich Media**: Support for image and file attachments.

### 📹 Professional Video Calling

- **Messenger/WhatsApp Style Layout**: Immersive full-screen background video with a movable, floating self-video popup.
- **Draggable UI**: The self-video popup is fully draggable (works on mouse and touch).
- **Screen Sharing**: High-quality screen share with a floating overlay of all participants' cameras.
- **Noise Cancellation**: Integrated AI-powered noise suppression.
- **Call Recording**: Easily record sessions with cloud storage integration.
- **Pre-join Room**: Device selection (camera/mic/speaker) and preview before entering a call.

### 🛡️ Core Infrastructure

- **Authentication**: Secure login and sign-up with **Prisma**, **PostgreSQL (Neon)**, and **JWT**.
- **State Management**: Optimized with **Pinia** for fluid UI transitions.
- **UI Design**: Modern aesthetics using **Tailwind CSS**, **PrimeVue**, and **PrimeIcons**.

---

## 🛠️ Technology Stack

- **Framework**: [Nuxt 3](https://nuxt.com/)
- **SDK**: [Stream Video](https://getstream.io/video/) & [Stream Chat](https://getstream.io/chat/)
- **Database**: [Neon DB](https://neon.tech/) (Serverless PostgreSQL)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [PrimeVue](https://primevue.org/)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🚦 Application Routes

- `/` : **Dashboard** - Access all your conversations and start new ones.
- `/login` : **Authentication** - Secure access to your account.
- `/sign-up` : **Registration** - Create a new user profile.
- `/video/[callId]` : **Active Call** - The primary calling interface with floating video controls.

---

## ⚙️ Development & Setup

### 1. Prerequisites

- Node.js (v18+)
- A Stream account (get your [API Key here](https://getstream.io/))
- A Neon PostgreSQL instance

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="your_neon_db_url"
JWT_SECRET="your_secret_key"
STREAM_API_KEY="your_stream_api_key"
STREAM_API_SECRET="your_stream_api_secret"
NUXT_PUBLIC_STREAM_API_KEY="your_stream_api_key"
```

### 3. Installation

```bash
# Install dependencies
npm install

# Apply database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

---

## 🌍 Deployment

This project is optimized for **Vercel**.

**Note on Prisma**: The `package.json` includes a `postinstall` script (`prisma generate`) to ensure the Prisma Client is correctly compiled on Vercel's build servers.

---

## 🤝 Open Source

This project is open-source. Feel free to use, modify, and contribute to help the Vue/Nuxt community leverage the best of real-time communication technologies!

---

Developed with ❤️ by MD Emran Ali.

## [LinkedIn](https://www.linkedin.com/in/itsemran/)

## [Visit the app](https://video-chat-app-nuxt-view.vercel.app/)
