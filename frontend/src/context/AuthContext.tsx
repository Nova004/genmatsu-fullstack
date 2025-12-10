import React, { createContext, useContext, useState, ReactNode } from 'react';

// 1. สร้าง Type สำหรับ User และ Context เพื่อความปลอดภัยของโค้ด
interface User {
  username: string;
  nameEN: string;
  id: string;
  LV_Approvals : number ;
  email: string;
  position: string;
  section: string;
  shift: string;
  statusJob: string;
  Gen_Manu_mem_No: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

// 2. สร้าง Context ขึ้นมา
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. สร้าง Provider Component (หัวใจของการทำงาน)
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  
  // --- 👇👇👇 จุดแก้ไขสำคัญที่ 1: ตรวจสอบ localStorage ตอนเริ่มต้น ---
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('user');
      // ถ้ามีข้อมูลใน localStorage ให้แปลงกลับจาก JSON string แล้ว return เป็นค่าเริ่มต้น
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      return null;
    }
  });
  // --- 👆👆👆 ---


  // --- 👇👇👇 จุดแก้ไขสำคัญที่ 2: อัปเกรดฟังก์ชัน login ---
  const login = (userData: User) => {
    // 1. เก็บข้อมูล user ไว้ใน State (เหมือนเดิม)
    setUser(userData);
    // 2. คัดลอกข้อมูลไปเก็บใน localStorage (แปลงเป็น JSON string ก่อน)
    localStorage.setItem('user', JSON.stringify(userData));
  };
  // --- 👆👆👆 ---


  // --- 👇👇👇 จุดแก้ไขสำคัญที่ 3: อัปเกรดฟังก์ชัน logout ---
  const logout = () => {
    // 1. ลบข้อมูลออกจาก State
    setUser(null);
    // 2. ลบข้อมูลออกจาก localStorage
    localStorage.removeItem('user');
  };
  // --- 👆👆👆 ---


  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 4. สร้าง Custom Hook เพื่อให้เรียกใช้งานง่าย
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};