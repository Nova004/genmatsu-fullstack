// src/routes/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// รับ children (คือ Component ที่เราต้องการจะป้องกัน)
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuth();

  if (!user) {
    // ถ้าไม่มี user (ยังไม่ login) ให้ redirect ไปที่หน้า signin
    return <Navigate to="/auth/signin" />;
  }

  // ถ้ามี user (login แล้ว) ก็ให้แสดง component นั้นๆ ได้เลย
  return children;
};

export default ProtectedRoute;