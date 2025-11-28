
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { User } from "../types";

// --- CONFIGURATION ---
// Replace with your real keys from Firebase Console -> Project Settings -> General
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Check if config is valid
const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY_HERE";

let auth: any = null;
let googleProvider: any = null;
let appleProvider: any = null;

if (isConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    appleProvider = new OAuthProvider('apple.com');
  } catch (err) {
    console.error("Firebase init failed:", err);
  }
}

// --- MOCK AUTH SERVICE (For when keys are missing) ---
const MOCK_USER_KEY = 'math_tutor_mock_user';

const mockLogin = async (provider: 'google' | 'apple'): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockUser: User = {
        id: 'mock-user-123',
        name: 'Demo Student',
        email: 'student@example.com',
        provider: provider,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`
      };
      localStorage.setItem(MOCK_USER_KEY, JSON.stringify(mockUser));
      resolve(mockUser);
    }, 1500); // Simulate network delay
  });
};

// --- UNIFIED AUTH API ---

export const AuthService = {
  isConfigured: () => isConfigured,

  login: async (providerName: 'google' | 'apple'): Promise<User> => {
    // 1. Try Real Firebase
    if (isConfigured && auth) {
      const provider = providerName === 'google' ? googleProvider : appleProvider;
      const result = await signInWithPopup(auth, provider);
      return mapFirebaseUser(result.user);
    } 
    // 2. Fallback to Mock
    else {
      console.warn("Firebase not configured. Using Mock Login.");
      return mockLogin(providerName);
    }
  },

  logout: async () => {
    if (isConfigured && auth) {
      await firebaseSignOut(auth);
    } else {
      localStorage.removeItem(MOCK_USER_KEY);
    }
  },

  subscribe: (callback: (user: User | null) => void) => {
    if (isConfigured && auth) {
      return onAuthStateChanged(auth, (u: FirebaseUser | null) => {
        callback(u ? mapFirebaseUser(u) : null);
      });
    } else {
      // Mock Persistence check
      const saved = localStorage.getItem(MOCK_USER_KEY);
      if (saved) {
        callback(JSON.parse(saved));
      } else {
        callback(null);
      }
      return () => {}; // Unsubscribe no-op
    }
  }
};

function mapFirebaseUser(u: FirebaseUser): User {
  return {
    id: u.uid,
    name: u.displayName || 'User',
    email: u.email || '',
    avatar: u.photoURL || undefined,
    provider: 'google' // Defaulting for display
  };
}
