import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SignIn from './SignIn';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';

// Mock AuthContext
const mockLogin = vi.fn();
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        login: mockLogin
    }),
    AuthProvider: ({ children }: any) => <div>{children}</div>
}));

// Mock Axios
vi.mock('axios', () => ({
    default: {
        post: vi.fn(() => Promise.resolve({ data: { user: { id: 1 }, token: 'abc' } }))
    }
}));

// Mock Image
vi.mock('../../images/logo/AGT.jpg', () => ({ default: 'logo.jpg' }));

describe('SignIn Component', () => {
    it('renders login form correctly', () => {
        render(
            <BrowserRouter>
                <SignIn />
            </BrowserRouter>
        );

        // Check for static text (Use Regex for partial match across lines)
        expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
        expect(screen.getByText(/Manufacturing System/i)).toBeInTheDocument();

        // Check for Inputs
        expect(screen.getByPlaceholderText('Enter your ID')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();

        // Check for Button
        expect(screen.getByRole('button', { name: /Log In/i })).toBeInTheDocument();
    });

    it('updates input fields on typing', () => {
        render(
            <BrowserRouter>
                <SignIn />
            </BrowserRouter>
        );

        const userIdInput = screen.getByPlaceholderText('Enter your ID') as HTMLInputElement;
        const passwordInput = screen.getByPlaceholderText('Enter password') as HTMLInputElement;

        fireEvent.change(userIdInput, { target: { value: 'user123' } });
        fireEvent.change(passwordInput, { target: { value: 'pass123' } });

        expect(userIdInput.value).toBe('user123');
        expect(passwordInput.value).toBe('pass123');
    });
});
