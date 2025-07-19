import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '@/layouts/AppLayout'
import HomePage from '@/pages/home'
import ChatPage from '@/pages/chat'
import ASRPage from '@/pages/asr'
import LLMPage from '@/pages/llm'
import TTSPage from '@/pages/tts'
import AgentPage from '@/pages/agent'
import SettingsPage from '@/pages/settings'
import AboutPage from '@/pages/about'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'home',
        element: <HomePage />,
      },
      {
        path: 'chat',
        element: <ChatPage />,
      },
      {
        path: 'asr',
        element: <ASRPage />,
      },
      {
        path: 'llm',
        element: <LLMPage />,
      },
      {
        path: 'tts',
        element: <TTSPage />,
      },
      {
        path: 'agent',
        element: <AgentPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'about',
        element: <AboutPage />,
      },
    ],
  },
]) 