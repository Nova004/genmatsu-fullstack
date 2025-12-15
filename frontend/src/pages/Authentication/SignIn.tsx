import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LogoDark from '../../images/logo/AGT.jpg';
import Logo from '../../images/logo/AGT.jpg';
import axios from 'axios';
import { fireToast } from '../../hooks/fireToast';

const SignIn: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId.trim() || !password.trim()) {
      fireToast('error', 'กรุณาระบุรหัสพนักงานและรหัสผ่าน');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('/genmatsu/api/auth/login', {
        userId: userId,
        password: password,
      });

      if (response.data && response.data.user) {
        localStorage.setItem('token', response.data.token);
        login(response.data.user);
        fireToast('success', 'เข้าสู่ระบบสำเร็จ');
        navigate('/');
      } else {
        fireToast('error', 'ไม่พบข้อมูลผู้ใช้งานในระบบ');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง';
      fireToast('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Background: สีเทาอ่อนมากๆ ให้ดูสะอาดตา (Light Corporate Gray)
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F8FAFC] p-4 text-slate-700">

      {/* Main Card: ขาวสะอาด มีเงาบางๆ (Subtle Shadow) */}
      <div className="flex w-full max-w-[1000px] overflow-hidden rounded-xl bg-white shadow-xl border border-slate-100">

        {/* 🏢 LEFT SIDE: Branding (โทนสว่าง - Professional Light) */}
        {/* ใช้สีพื้นหลังเป็น Slate-50 (เทาเกือบขาว) เพื่อแยกสัดส่วนกับฟอร์ม */}
        <div className="hidden w-5/12 flex-col justify-between bg-slate-50 p-12 lg:flex border-r border-slate-100 relative">

          {/* Decorative Line (Accent) */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-primary"></div>

          <div>
            {/* Logo: ใช้ LogoDark เพราะพื้นหลังสว่าง */}
            <img src={LogoDark} alt="AGT Gen Logo" className="h-20 w-auto mb-9" />

            <h1 className="text-2xl font-bold text-slate-800 leading-snug mb-3">
              AGT GEN <br />
              Manufacturing System
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Platform for production tracking, quality assurance, and operational excellence.
            </p>
          </div>

          <div className="pt-8 border-t border-slate-200">
            <p className="text-xs text-slate-400 font-medium">
              &copy; 2025 AGT Genmatsu.
            </p>
          </div>
        </div>

        {/* 📝 RIGHT SIDE: Login Form (ขาวล้วน สะอาดตา) */}
        <div className="w-full flex flex-col justify-center p-8 sm:p-12 lg:w-7/12 bg-white">

          <div className="mb-8">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-6">
              <img src={Logo} alt="Logo" className="h-8 w-auto" />
            </div>

            <h2 className="text-2xl font-bold text-slate-800">Sign In</h2>
            <p className="text-sm text-slate-500 mt-1">
              Welcome back! Please enter your details.
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-5">

            {/* User ID */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Employee ID
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-3 text-slate-400 group-focus-within:text-primary transition-colors">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </span>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter your ID"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-3 text-slate-400 group-focus-within:text-primary transition-colors">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter password"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 px-4 text-sm font-bold text-white shadow-md transition-all hover:bg-opacity-90 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 flex justify-center border-t border-slate-100 pt-6">
            <a
              href="http://192.168.1.72:81/agt_member/member_forgot.php"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary transition-colors"
            >
              <svg className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Forgot your password?
            </a>
          </div>

        </div>
      </div>

      {/* Small Footer Text */}
      <div className="absolute bottom-4 text-xs text-slate-400">
        Authorized Access Only
      </div>
    </div>
  );
};

export default SignIn;