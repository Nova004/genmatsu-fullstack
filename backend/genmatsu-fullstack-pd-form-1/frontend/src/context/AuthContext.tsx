// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

// สร้าง interface สำหรับข้อมูล user ที่เราจะเก็บ
interface User {
  id: number; // หรือ number ถ้า ID เป็นตัวเลข
  name: string;
  email: string;
}


// สร้าง interface สำหรับ Context
interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

// สร้าง Context พร้อมค่าเริ่มต้นเป็น null
const AuthContext = createContext<AuthContextType | null>(null); //ข้อมมูล User ที่ login แล้ว

// สร้าง Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // ฟังก์ชันสำหรับ Login
  const login = (userData: User) => {
    setUser(userData);
    // ในสถานการณ์จริง เราอาจจะเก็บ token ไว้ใน localStorage ด้วย
  };

  // ฟังก์ชันสำหรับ Logout
  const logout = () => {
    setUser(null);
    // และลบ token ออกจาก localStorage
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// สร้าง Custom Hook เพื่อให้เรียกใช้ง่ายๆ
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};