// ============================================================
// /frontend/src/context/AuthContext.tsx
// Auth state — login, logout, token persistence, protected routes
// ============================================================
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

interface AuthUser {
    id: string;
    username: string;
    roleId: string;
    operatorName: string;
    scopes: string[];
}

interface AuthContextValue {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'acob_auth';

interface StoredAuth {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
}

function getStoredAuth(): StoredAuth | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function storeAuth(auth: StoredAuth) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

function clearAuth() {
    localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize from localStorage
    useEffect(() => {
        const stored = getStoredAuth();
        if (stored) {
            setUser(stored.user);
            // Set default auth header
            axios.defaults.headers.common['Authorization'] = `Bearer ${stored.accessToken}`;
        }
        setIsLoading(false);
    }, []);

    const login = async (username: string, password: string) => {
        const res = await axios.post(`${BASE_URL}/auth/login`, { username, password });
        const { accessToken, refreshToken, user: authUser } = res.data.data;

        storeAuth({ accessToken, refreshToken, user: authUser });
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        setUser(authUser);
    };

    const logout = () => {
        const stored = getStoredAuth();
        if (stored?.refreshToken) {
            axios.post(`${BASE_URL}/auth/logout`, { refreshToken: stored.refreshToken }).catch(() => { });
        }
        clearAuth();
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

// Protected route wrapper
export function ProtectedRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-odyssey-surface">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-odyssey-accent border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground text-sm font-mono">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login, preserving intended destination
        window.location.href = `/login?redirect=${encodeURIComponent(location.pathname)}`;
        return null;
    }

    return <>{children}</>;
}
