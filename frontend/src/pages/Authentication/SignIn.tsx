import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import LogoDark from '../../images/logo/logo-dark.svg';
import Logo from '../../images/logo/logo.svg';
import axios from 'axios';
import { fireToast } from '../../hooks/fireToast';

const SignIn: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. ยิง API ไปยัง Backend (ส่วนนี้ถูกต้องแล้ว)
      const response = await axios.post('/genmatsu/api/auth/login', {
        userId: userId,
        password: password,
      });

      // --- 👇 จุดตรวจสอบและแก้ไข ---
      // 2. แสดงข้อมูลทั้งหมดที่ได้รับจาก Backend ใน Console เพื่อตรวจสอบโครงสร้าง
      console.log('Backend response:', response.data);

      // 3. ตรวจสอบให้แน่ใจว่า Backend ส่ง `response.data.user` กลับมาจริงๆ
      if (response.data && response.data.user) {
        // 4. ถ้ามีข้อมูล user, เรียกใช้ฟังก์ชัน login และนำทางไปยังหน้าหลัก
        login(response.data.user);
        fireToast('success', `Welcome back, ${response.data.user.username}!`);
        navigate('/'); // ไปยังหน้าหลักหลัง login สำเร็จ
      } else {
        // 5. ถ้าโครงสร้างข้อมูลไม่ถูกต้อง, แสดง Error
        console.error("Login successful, but backend response is missing 'user' object.", response.data);
        fireToast('error', 'Login successful, but failed to retrieve user data.');
      }
      // --- 👆 ---

    } catch (error: any) {
      console.error('Login failed:', error);
      const errorMessage = error.response?.data?.message || 'Failed to connect to the server.';
      fireToast('error', errorMessage);
    }
  };

  // (ส่วน JSX ด้านล่างเหมือนเดิมทุกประการ)
  return (
    <>
      <Breadcrumb pageName="Sign In" />
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex flex-wrap items-center">
          <div className="hidden w-full xl:block xl:w-1/2">
            <div className="py-17.5 px-26 text-center">
              <Link className="mb-5.5 inline-block" to="/">
                <img className="hidden dark:block" src={Logo} alt="Logo" />
                <img className="dark:hidden" src={LogoDark} alt="Logo" />
              </Link>
              <p className="2xl:px-20">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit suspendisse.
              </p>
              <span className="mt-15 inline-block">
                {/* SVG Image */}
              </span>
            </div>
          </div>
          <div className="w-full border-stroke dark:border-strokedark xl:w-1/2 xl:border-l-2">
            <div className="w-full p-4 sm:p-12.5 xl:p-17.5">
              <h2 className="mb-9 text-2xl font-bold text-black dark:text-white sm:text-title-xl2">
                Sign In to Genmatsu
              </h2>
              <form onSubmit={handleSignIn}>
                <div className="mb-4">
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    User ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter your User ID"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                    {/* SVG Icon */}
                  </div>
                </div>
                <div className="mb-6">
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                    {/* SVG Icon */}
                  </div>
                </div>
                <div className="mb-5">
                  <input
                    type="submit"
                    value="Sign In"
                    className="w-full cursor-pointer rounded-lg border border-primary bg-primary p-4 text-white transition hover:bg-opacity-90"
                  />
                </div>
                <div className="mt-6 text-center">
                  <p>
                    Don’t have any account?{' '}
                    <Link to="/auth/signup" className="text-primary">
                      Sign Up
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignIn;