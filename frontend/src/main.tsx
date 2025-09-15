// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App'; // <--- Import App.tsx 
import './css/style.css'; 
import './css/satoshi.css';
import 'jsvectormap/dist/css/jsvectormap.css';
import 'flatpickr/dist/flatpickr.min.css';
import { AuthProvider } from './context/AuthContext'; // <--- Import เข้ามา

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render( // <--- นำไปเเสดงที่ไหน Root 
 
    <Router>
      <AuthProvider> {/* <--- นำมาครอบ App */}
        <App />
      </AuthProvider>
    </Router>,
);