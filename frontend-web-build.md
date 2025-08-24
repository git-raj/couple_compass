# Couple Compass - Frontend Web Application Build Guide

## Overview

This document provides comprehensive guidance for building the Couple Compass frontend web application using Next.js 14. The frontend is designed as a modern, responsive Progressive Web App (PWA) with real-time features, optimized performance, and exceptional user experience.

## Technology Stack

### Core Technologies
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS 3+ with custom design system
- **State Management**: Zustand with persistence
- **API Integration**: Apollo Client (GraphQL) + React Query (REST)
- **Authentication**: NextAuth.js v5
- **Forms**: React Hook Form + Zod validation
- **Real-time**: Socket.io client + GraphQL subscriptions

### UI/UX Libraries
- **Component Library**: Headless UI + Radix UI primitives
- **Icons**: Lucide React + Heroicons
- **Animations**: Framer Motion
- **Charts**: Recharts + Chart.js
- **Date/Time**: date-fns
- **File Upload**: react-dropzone

### Development Tools
- **Build Tool**: Next.js built-in bundler (Turbopack in dev)
- **Linting**: ESLint + Prettier
- **Testing**: Jest + React Testing Library + Playwright
- **Type Safety**: TypeScript strict mode
- **Code Quality**: Husky + lint-staged

## Project Structure

```
frontend/
├── public/                          # Static assets
│   ├── images/
│   ├── icons/
│   ├── manifest.json               # PWA manifest
│   └── sw.js                       # Service worker
├── src/
│   ├── app/                        # Next.js 14 App Router
│   │   ├── (auth)/                 # Route groups
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/            # Protected routes
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx
│   │   │   │   └── loading.tsx
│   │   │   ├── quizzes/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx
│   │   │   ├── journal/
│   │   │   │   └── page.tsx
│   │   │   ├── mood/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   ├── api/                    # API routes
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts
│   │   │   └── webhooks/
│   │   ├── globals.css             # Global styles
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Home page
│   │   ├── loading.tsx             # Global loading
│   │   ├── error.tsx               # Global error
│   │   └── not-found.tsx           # 404 page
│   ├── components/                 # Reusable components
│   │   ├── ui/                     # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── toast.tsx
│   │   │   └── index.ts
│   │   ├── forms/                  # Form components
│   │   │   ├── login-form.tsx
│   │   │   ├── signup-form.tsx
│   │   │   ├── quiz-form.tsx
│   │   │   └── mood-checkin-form.tsx
│   │   ├── layout/                 # Layout components
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── navigation.tsx
│   │   │   └── footer.tsx
│   │   ├── dashboard/              # Dashboard components
│   │   │   ├── mood-chart.tsx
│   │   │   ├── streak-counter.tsx
│   │   │   ├── tips-carousel.tsx
│   │   │   └── activity-feed.tsx
│   │   └── shared/                 # Shared components
│   │       ├── loading-spinner.tsx
│   │       ├── error-boundary.tsx
│   │       └── protected-route.tsx
│   ├── lib/                        # Utility libraries
│   │   ├── apollo-client.ts        # GraphQL client setup
│   │   ├── auth.ts                 # NextAuth configuration
│   │   ├── utils.ts                # Utility functions
│   │   ├── constants.ts            # App constants
│   │   ├── validations.ts          # Zod schemas
│   │   └── socket.ts               # Socket.io setup
│   ├── store/                      # State management
│   │   ├── auth-store.ts           # Authentication state
│   │   ├── dashboard-store.ts      # Dashboard state
│   │   ├── quiz-store.ts           # Quiz state
│   │   └── ui-store.ts             # UI state
│   ├── hooks/                      # Custom React hooks
│   │   ├── use-auth.ts
│   │   ├── use-socket.ts
│   │   ├── use-dashboard.ts
│   │   └── use-local-storage.ts
│   ├── styles/                     # Styling files
│   │   ├── globals.css
│   │   ├── components.css
│   │   └── utilities.css
│   └── types/                      # TypeScript definitions
│       ├── auth.ts
│       ├── api.ts
│       ├── dashboard.ts
│       └── index.ts
├── __tests__/                      # Test files
│   ├── components/
│   ├── pages/
│   ├── utils/
│   └── setup.ts
├── docs/                          # Documentation
├── .env.local                     # Environment variables
├── .env.example                   # Environment template
├── next.config.js                 # Next.js configuration
├── tailwind.config.js             # Tailwind configuration
├── tsconfig.json                  # TypeScript configuration
├── jest.config.js                 # Jest configuration
├── playwright.config.ts           # Playwright configuration
├── package.json
└── README.md
```

## Design System and Styling

### Tailwind Configuration
```javascript
// tailwind.config.js
import { type Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          950: '#500724',
        },
        // Secondary colors
        secondary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // Mood colors
        mood: {
          1: '#ef4444', // red-500 (sad)
          2: '#f97316', // orange-500 (stressed)
          3: '#eab308', // yellow-500 (neutral)
          4: '#22c55e', // green-500 (happy)
          5: '#8b5cf6', // violet-500 (amazing)
        },
        // Semantic colors
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};

export default config;
```

### Global Styles
```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground font-sans;
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  html {
    scroll-behavior: smooth;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-secondary {
    @apply bg-white hover:bg-gray-50 text-gray-900 font-medium py-2 px-4 rounded-lg border border-gray-300 transition-colors duration-200;
  }

  .card {
    @apply bg-white rounded-xl shadow-sm border border-gray-200 p-6;
  }

  .input-field {
    @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200;
  }

  .mood-indicator {
    @apply w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm;
  }

  .streak-counter {
    @apply bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full px-4 py-2 font-semibold;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  .glass-effect {
    backdrop-filter: blur(16px) saturate(180%);
    background-color: rgba(255, 255, 255, 0.75);
    border: 1px solid rgba(209, 213, 219, 0.3);
  }
}
```

## Authentication Setup

### NextAuth Configuration
```typescript
// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || 'Login failed');
          }

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          };
        } catch (error) {
          throw new Error('Authentication failed');
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpires: Date.now() + 15 * 60 * 1000, // 15 minutes
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token has expired, try to refresh it
      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    signUp: '/signup',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

async function refreshAccessToken(token: any) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.accessToken,
      accessTokenExpires: Date.now() + 15 * 60 * 1000,
      refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
    };
  } catch (error) {
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}
```

### Authentication Hook
```typescript
// src/hooks/use-auth.ts
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export const useAuth = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const login = useCallback(async (email: string, password: string) => {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      throw new Error(result.error);
    }

    router.push('/dashboard');
    return result;
  }, [router]);

  const logout = useCallback(async () => {
    await signOut({ redirect: false });
    router.push('/');
  }, [router]);

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';

  return {
    user: session?.user,
    accessToken: session?.accessToken,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
};
```

## State Management with Zustand

### Auth Store
```typescript
// src/store/auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
  setUser: (user: User | null) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      onboardingCompleted: false,
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),
      setOnboardingCompleted: (completed) => set({ 
        onboardingCompleted: completed 
      }),
      clearAuth: () => set({ 
        user: null, 
        isAuthenticated: false, 
        onboardingCompleted: false 
      }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        onboardingCompleted: state.onboardingCompleted 
      }),
    }
  )
);
```

### Dashboard Store
```typescript
// src/store/dashboard-store.ts
import { create } from 'zustand';

interface MoodCheckin {
  id: string;
  moodLevel: number;
  notes?: string;
  createdAt: string;
}

interface Tip {
  id: string;
  title: string;
  content: string;
  category: string;
  status: 'suggested' | 'viewed' | 'dismissed' | 'helpful';
}

interface StreakInfo {
  current: number;
  longest: number;
  type: string;
  lastActivity?: string;
}

interface DashboardState {
  recentMoods: MoodCheckin[];
  suggestedTips: Tip[];
  streakInfo: StreakInfo;
  isLoading: boolean;
  error: string | null;
  setRecentMoods: (moods: MoodCheckin[]) => void;
  setSuggestedTips: (tips: Tip[]) => void;
  setStreakInfo: (streak: StreakInfo) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addMoodCheckin: (mood: MoodCheckin) => void;
  updateTipStatus: (tipId: string, status: Tip['status']) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  recentMoods: [],
  suggestedTips: [],
  streakInfo: { current: 0, longest: 0, type: 'mood_checkin' },
  isLoading: false,
  error: null,
  setRecentMoods: (moods) => set({ recentMoods: moods }),
  setSuggestedTips: (tips) => set({ suggestedTips: tips }),
  setStreakInfo: (streak) => set({ streakInfo: streak }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  addMoodCheckin: (mood) => set((state) => ({
    recentMoods: [mood, ...state.recentMoods.slice(0, 6)]
  })),
  updateTipStatus: (tipId, status) => set((state) => ({
    suggestedTips: state.suggestedTips.map(tip =>
      tip.id === tipId ? { ...tip, status } : tip
    )
  })),
}));
```

## GraphQL Integration

### Apollo Client Setup
```typescript
// src/lib/apollo-client.ts
import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { getSession } from 'next-auth/react';

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
});

const authLink = setContext(async (_, { headers }) => {
  const session = await getSession();
  const token = session?.accessToken;

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }

  if (networkError) {
    console.error(`Network error: ${networkError}`);
    
    // Handle token expiry
    if (networkError.statusCode === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
  }
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          recentMoods: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
          suggestedTips: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});
```

### GraphQL Queries and Mutations
```typescript
// src/lib/graphql/queries.ts
import { gql } from '@apollo/client';

export const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    dashboard {
      user {
        id
        email
        profile {
          name
          avatarUrl
          onboardingCompleted
        }
      }
      couple {
        id
        status
        members {
          user {
            id
            profile {
              name
              avatarUrl
            }
          }
        }
        stats {
          currentStreak
          longestStreak
          averageMood
          totalMoodCheckins
        }
      }
      recentMoods(limit: 7) {
        id
        moodLevel
        notes
        createdAt
      }
      suggestedTips {
        id
        tip {
          title
          content
          category
        }
        status
        createdAt
      }
      streakInfo {
        current
        longest
        type
        lastActivity
      }
      weeklyStats {
        averageMood
        journalEntries
        communicationScore
        goalsCompleted
      }
    }
  }
`;

export const GET_QUIZZES = gql`
  query GetQuizzes {
    quizzes {
      id
      slug
      title
      description
      type
      estimatedMinutes
      userResult {
        id
        scores
        completedAt
      }
    }
  }
`;

export const GET_QUIZ_BY_SLUG = gql`
  query GetQuizBySlug($slug: String!) {
    quiz(slug: $slug) {
      id
      slug
      title
      description
      type
      items {
        id
        prompt
        type
        options
        orderIndex
      }
      userResult {
        id
        scores
        responses
        completedAt
      }
    }
  }
`;

// src/lib/graphql/mutations.ts
export const CREATE_MOOD_CHECKIN = gql`
  mutation CreateMoodCheckin($input: CreateMoodCheckinInput!) {
    createMoodCheckin(input: $input) {
      id
      moodLevel
      notes
      contextTags
      createdAt
    }
  }
`;

export const SUBMIT_QUIZ_RESULT = gql`
  mutation SubmitQuizResult($input: SubmitQuizResultInput!) {
    submitQuizResult(input: $input) {
      id
      scores
      completedAt
      quiz {
        id
        title
        type
      }
    }
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      name
      avatarUrl
      pronouns
      timezone
      onboardingCompleted
    }
  }
`;

export const MARK_TIP_AS_VIEWED = gql`
  mutation MarkTipAsViewed($tipId: ID!) {
    markTipAsViewed(tipId: $tipId) {
      id
      status
      viewedAt
    }
  }
`;

// src/lib/graphql/subscriptions.ts
export const COUPLE_ACTIVITY_SUBSCRIPTION = gql`
  subscription OnCoupleActivityUpdated($coupleId: ID!) {
    coupleActivityUpdated(coupleId: $coupleId) {
      id
      type
      userId
      data
      createdAt
      user {
        profile {
          name
        }
      }
    }
  }
`;

export const NEW_TIP_SUBSCRIPTION = gql`
  subscription OnNewTipSuggested($userId: ID!) {
    newTipSuggested(userId: $userId) {
      id
      tip {
        title
        content
        category
      }
      context
      createdAt
    }
  }
`;
```

## Component Examples

### Dashboard Page
```typescript
// src/app/(dashboard)/dashboard/page.tsx
'use client';

import { useQuery, useSubscription } from '@apollo/client';
import { useSession } from 'next-auth/react';
import { Suspense } from 'react';
import { GET_DASHBOARD_DATA, COUPLE_ACTIVITY_SUBSCRIPTION } from '@/lib/graphql/queries';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MoodChart } from '@/components/dashboard/mood-chart';
import { StreakCounter } from '@/components/dashboard/streak-counter';
import { TipsCarousel } from '@/components/dashboard/tips-carousel';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorBoundary } from '@/components/shared/error-boundary';

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data, loading, error, refetch } = useQuery(GET_DASHBOARD_DATA, {
    pollInterval: 5 * 60 * 1000, // Poll every 5 minutes
    errorPolicy: 'all',
  });

  // Subscribe to real-time couple activity updates
  useSubscription(COUPLE_ACTIVITY_SUBSCRIPTION, {
    variables: { coupleId: data?.dashboard?.couple?.id },
    skip: !data?.dashboard?.couple?.id,
    onData: ({ data: subscriptionData }) => {
      // Refetch dashboard data when new activity occurs
      refetch();
    },
  });

  if (loading) return <LoadingSpinner />;
  if (error && !data) return <div>Error loading dashboard</div>;

  const { user, couple, recentMoods, suggestedTips, streakInfo, weeklyStats } = data?.dashboard || {};

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader user={user} couple={couple} />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Actions */}
          <section className="mb-8">
            <QuickActions />
          </section>

          {/* Stats Overview */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StreakCounter streak={streakInfo} />
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Average Mood</h3>
              <div className="flex items-center">
                <span className="text-3xl font-bold text-gray-900">
                  {weeklyStats?.averageMood?.toFixed(1) || '0.0'}
                </span>
                <span className="ml-2 text-sm text-gray-500">/5.0</span>
              </div>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Journal Entries</h3>
              <span className="text-3xl font-bold text-gray-900">
                {weeklyStats?.journalEntries || 0}
              </span>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Communication Score</h3>
              <div className="flex items-center">
                <span className="text-3xl font-bold text-gray-900">
                  {weeklyStats?.communicationScore || 0}
                </span>
                <span className="ml-2 text-sm text-gray-500">%</span>
              </div>
            </div>
          </section>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Mood Chart */}
              <Suspense fallback={<div className="card h-64 animate-pulse bg-gray-200" />}>
                <MoodChart moods={recentMoods} />
              </Suspense>

              {/* Tips Carousel */}
              <Suspense fallback={<div className="card h-48 animate-pulse bg-gray-200" />}>
                <TipsCarousel tips={suggestedTips} />
              </Suspense>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Activity Feed */}
              <Suspense fallback={<div className="card h-96 animate-pulse bg-gray-200" />}>
                <ActivityFeed coupleId={couple?.id} />
              </Suspense>
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}
```

### Mood Check-in Form
```typescript
// src/components/forms/mood-checkin-form.tsx
'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { CREATE_MOOD_CHECKIN } from '@/lib/graphql/mutations';
import { GET_DASHBOARD_DATA } from '@/lib/graphql/queries';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';

const moodCheckinSchema = z.object({
  moodLevel: z.number().min(1).max(5),
  notes: z.string().optional(),
  contextTags: z.array(z.string()).optional(),
});

type MoodCheckinData = z.infer<typeof moodCheckinSchema>;

const moodOptions = [
  { level: 1, emoji: '😢', label: 'Terrible', color: 'bg-red-500' },
  { level: 2, emoji: '😕', label: 'Not Great', color: 'bg-orange-500' },
  { level: 3, emoji: '😐', label: 'Okay', color: 'bg-yellow-500' },
  { level: 4, emoji: '😊', label: 'Good', color: 'bg-green-500' },
  { level: 5, emoji: '🤩', label: 'Amazing', color: 'bg-purple-500' },
];

const contextOptions = [
  'work', 'relationship', 'family', 'health', 'finances', 'social', 'personal'
];

interface MoodCheckinFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MoodCheckinForm({ onSuccess, onCancel }: MoodCheckinFormProps) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [createMoodCheckin, { loading }] = useMutation(CREATE_MOOD_CHECKIN, {
    refetchQueries: [{ query: GET_DASHBOARD_DATA }],
    onCompleted: () => {
      toast.success('Mood check-in recorded!');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to record mood check-in');
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<MoodCheckinData>({
    resolver: zodResolver(moodCheckinSchema),
  });

  const onSubmit = (data: MoodCheckinData) => {
    if (!selectedMood) {
      toast.error('Please select a mood level');
      return;
    }

    createMoodCheckin({
      variables: {
        input: {
          moodLevel: selectedMood,
          notes: data.notes,
          contextTags: selectedTags,
        },
      },
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Mood Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          How are you feeling right now?
        </label>
        <div className="flex justify-between space-x-2">
          {moodOptions.map((mood) => (
            <motion.button
              key={mood.level}
              type="button"
              onClick={() => setSelectedMood(mood.level)}
              className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedMood === mood.level
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`mood-indicator ${mood.color} text-2xl mb-2`}>
                {mood.emoji}
              </div>
              <span className="text-xs font-medium text-gray-700">
                {mood.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Context Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          What's influencing your mood? (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {contextOptions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                selectedTags.includes(tag)
                  ? 'bg-primary-100 text-primary-800 border border-primary-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Any additional notes? (optional)
        </label>
        <Textarea
          {...register('notes')}
          placeholder="Tell us more about how you're feeling..."
          rows={3}
          className="w-full"
        />
      </div>

      {/* Actions */}
      <div className="flex space-x-3 pt-4">
        <Button
          type="submit"
          disabled={!selectedMood || loading}
          className="btn-primary flex-1"
        >
          {loading ? 'Recording...' : 'Record Mood'}
        </Button>
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
```

### Mood Chart Component
```typescript
// src/components/dashboard/mood-chart.tsx
'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface MoodData {
  id: string;
  moodLevel: number;
  notes?: string;
  createdAt: string;
}

interface MoodChartProps {
  moods: MoodData[];
}

export function MoodChart({ moods }: MoodChartProps) {
  const chartData = useMemo(() => {
    return moods
      .slice()
      .reverse()
      .map((mood, index) => ({
        id: mood.id,
        day: format(parseISO(mood.createdAt), 'MMM dd'),
        mood: mood.moodLevel,
        notes: mood.notes,
        date: mood.createdAt,
      }));
  }, [moods]);

  const averageMood = useMemo(() => {
    if (moods.length === 0) return 0;
    return moods.reduce((sum, mood) => sum + mood.moodLevel, 0) / moods.length;
  }, [moods]);

  const getMoodColor = (mood: number) => {
    const colors = {
      1: '#ef4444', // red
      2: '#f97316', // orange
      3: '#eab308', // yellow
      4: '#22c55e', // green
      5: '#8b5cf6', // purple
    };
    return colors[Math.round(mood) as keyof typeof colors] || colors[3];
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Mood: <span className="font-medium">{data.mood}/5</span>
          </p>
          {data.notes && (
            <p className="text-sm text-gray-600 mt-1 max-w-48">
              "{data.notes}"
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Mood Trends</h2>
          <p className="text-sm text-gray-600">
            Average: <span className="font-medium">{averageMood.toFixed(1)}/5.0</span>
          </p>
        </div>
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
            Terrible
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
            Great
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-1"></div>
            Amazing
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <p className="text-lg font-medium">No mood data yet</p>
            <p className="text-sm">Start tracking your daily mood to see trends here</p>
          </div>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="day" 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                domain={[0.5, 5.5]}
                ticks={[1, 2, 3, 4, 5]}
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: '#8b5cf6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
```

## Real-time Features with Socket.io

### Socket Connection Hook
```typescript
// src/hooks/use-socket.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

export const useSocket = (namespace: string = '/couples') => {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    
    socketRef.current = io(`${socketUrl}${namespace}`, {
      auth: {
        token: session.accessToken,
      },
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
      console.log('Socket connected');
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      setConnectionError(error.message);
      console.error('Socket connection error:', error);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [session?.accessToken, namespace]);

  const emit = (event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  };

  const on = (event: string, handler: (data: any) => void) => {
    socketRef.current?.on(event, handler);
  };

  const off = (event: string, handler?: (data: any) => void) => {
    socketRef.current?.off(event, handler);
  };

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    emit,
    on,
    off,
  };
};
```

## Progressive Web App Configuration

### Next.js Configuration
```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-static',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\/_next\/image\?url=.+$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-image',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'couple-compass.com'],
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
```

### PWA Manifest
```json
// public/manifest.json
{
  "name": "Couple Compass",
  "short_name": "Couple Compass",
  "description": "Strengthen your relationship with personalized insights and tools",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ec4899",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "categories": ["lifestyle", "health"],
  "lang": "en",
  "dir": "ltr"
}
```

## Testing Strategy

### Component Testing
```typescript
// __tests__/components/mood-chart.test.tsx
import { render, screen } from '@testing-library/react';
import { MoodChart } from '@/components/dashboard/mood-chart';

const mockMoods = [
  {
    id: '1',
    moodLevel: 4,
    notes: 'Feeling good today',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    moodLevel: 3,
    notes: 'Average day',
    createdAt: '2024-01-14T10:00:00Z',
  },
];

describe('MoodChart', () => {
  it('renders mood chart with data', () => {
    render(<MoodChart moods={mockMoods} />);
    
    expect(screen.getByText('Mood Trends')).toBeInTheDocument();
    expect(screen.getByText(/Average: 3.5/)).toBeInTheDocument();
  });

  it('shows empty state when no mood data', () => {
    render(<MoodChart moods={[]} />);
    
    expect(screen.getByText('No mood data yet')).toBeInTheDocument();
    expect(screen.getByText('Start tracking your daily mood to see trends here')).toBeInTheDocument();
  });
});
```

### E2E Testing with Playwright
```typescript
// __tests__/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/login');
    await page.fill('[data-testid=email]', 'test@example.com');
    await page.fill('[data-testid=password]', 'password123');
    await page.click('[data-testid=login-button]');
    await page.waitForURL('/dashboard');
  });

  test('displays dashboard components', async ({ page }) => {
    await expect(page.locator('[data-testid=mood-chart]')).toBeVisible();
    await expect(page.locator('[data-testid=streak-counter]')).toBeVisible();
    await expect(page.locator('[data-testid=tips-carousel]')).toBeVisible();
  });

  test('allows mood check-in', async ({ page }) => {
    await page.click('[data-testid=quick-mood-checkin]');
    await page.click('[data-testid=mood-level-4]');
    await page.fill('[data-testid=mood-notes]', 'Feeling great today!');
    await page.click('[data-testid=submit-mood]');
    
    await expect(page.locator('.toast-success')).toBeVisible();
  });

  test('navigates to quiz from dashboard', async ({ page }) => {
    await page.click('[data-testid=take-quiz-button]');
    await expect(page).toHaveURL(/\/quizzes/);
  });
});
```

## Performance Optimization

### Image Optimization
```typescript
// src/components/shared/optimized-image.tsx
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height, 
  className, 
  priority = false,
  placeholder = 'empty',
  blurDataURL 
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      
      {hasError ? (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Failed to load</span>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          onLoadingComplete={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
        />
      )}
    </div>
  );
}
```

### Code Splitting and Lazy Loading
```typescript
// src/app/(dashboard)/dashboard/page.tsx
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load heavy components
const MoodChart = dynamic(() => import('@/components/dashboard/mood-chart'), {
  loading: () => <div className="card h-64 animate-pulse bg-gray-200" />,
  ssr: false, // Disable SSR for client-side only components
});

const TipsCarousel = dynamic(() => import('@/components/dashboard/tips-carousel'), {
  loading: () => <div className="card h-48 animate-pulse bg-gray-200" />,
});

// Component implementation...
```

## Deployment Configuration

### Environment Variables
```bash
# .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

APPLE_ID=your-apple-id
APPLE_SECRET=your-apple-secret

# Production
NEXT_PUBLIC_API_URL=https://api.couple-compass.com
NEXT_PUBLIC_GRAPHQL_URL=https://api.couple-compass.com/graphql
NEXT_PUBLIC_SOCKET_URL=https://api.couple-compass.com
```

### Dockerfile
```dockerfile
# Frontend Dockerfile
FROM node:18-alpine AS dependencies

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Build Script
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "clean": "rimraf .next out",
    "analyze": "cross-env ANALYZE=true next build"
  }
}
```

This comprehensive frontend build guide provides a solid foundation for creating a modern, performant, and user-friendly web application for Couple Compass. The architecture emphasizes type safety, performance optimization, real-time features, and excellent developer experience while maintaining scalability and maintainability.
