// src/App.tsx
import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Loader from './common/Loader';
import PageTitle from './components/PageTitle';
import SignIn from './pages/Authentication/SignIn';
import SignUp from './pages/Authentication/SignUp';
import Calendar from './pages/Calendar';
import Chart from './pages/Chart';
import Dashbord_App from './pages/Dashboard/Dashbord_App';
import Dashbord_Master from './pages/Dashboard/Dashbord_Master';
import FormElementsB from './pages/Form/FormElements-gen-b';
import FormElementsA from './pages/Form/FormElements-gen-a';
import FormMasterEditor from './components/formGen/pages/Master/FormMasterEditor';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Tables from './pages/Tables';
import Alerts from './pages/UiElements/Alerts';
import Buttons from './pages/UiElements/Buttons';
import DefaultLayout from './layout/DefaultLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import UserMaster from './components/formGen/pages/Master/UserMaster';
import NaClMaster from './components/formGen/pages/Master/NaClMaster';
import { Toaster } from 'react-hot-toast';
import ReportHistory_GEN_B from './pages/Reports/ReportHistory_GEN_B';
import ReportHistory_GEN_A from './pages/Reports/ReportHistory_GEN_A';
import ReportDetailDispatcher from './pages/Reports/ReportDetailDispatcher';
import BZ_Form from './components/formGen/pages/GEN_B/BZ_Form/BZ_index';
import BZ3_Form from './components/formGen/pages/GEN_B/BZ3_Form/BZ3_index';
import BS3_Form from './components/formGen/pages/GEN_B/BS3_Form/BS3_index';
import AS2_Form from './components/formGen/pages/GEN_A/AS2_Form/AS2_index';
import BZ5_C_Form from './components/formGen/pages/GEN_B/BZ5-C_Form/BZ5-C_index.tsx';
import BS5_C_Form from './components/formGen/pages/GEN_B/BS5-C_Form/BS5-C_index.tsx';

import ReportEditDispatcher from './pages/Reports/ReportEditDispatcher';

function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return loading ? (
    <Loader />
  ) : (
    <>
      <Toaster // 👈 2. เพิ่ม Component นี้เข้ามา
        position="top-right"
        reverseOrder={false}
        containerClassName="overflow-auto"
      />
      <Routes>
        {/* --- หน้า Public ที่ไม่ต้อง Login --- */}
        <Route
          path="/auth/signin"
          element={
            <>
              <PageTitle title="Signin | TailAdmin" />
              <SignIn />
            </>
          }
        />
        <Route
          path="/auth/signup"
          element={
            <>
              <PageTitle title="Signup | TailAdmin" />
              <SignUp />
            </>
          }
        />

        {/* --- Route หลักที่ต้อง Login ถึงจะเข้าได้ --- */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <DefaultLayout>
                <Routes>
                  {/* หน้า Dashboard หลัก */}
                  <Route
                    index
                    element={
                      <>
                        <PageTitle title="Dashbord_App Dashboard" />
                        <Dashbord_App />
                      </>
                    }
                  />
                  <Route
                    index
                    path="/master/Dashbord_Master"
                    element={
                      <>
                        <PageTitle title="Dashbord_Master" />
                        <Dashbord_Master />
                      </>
                    }
                  />
                  <Route
                    path="calendar"
                    element={
                      <>
                        <PageTitle title="Calendar" />
                        <Calendar />
                      </>
                    }
                  />
                  <Route
                    path="profile"
                    element={
                      <>
                        <PageTitle title="Profile" />
                        <Profile />
                      </>
                    }
                  />
                  <Route
                    path="forms/form-elements-gen-b"
                    element={
                      <>
                        <PageTitle title="Form Elements" />
                        <FormElementsB />
                      </>
                    }
                  />
                  <Route
                    path="forms/form-elements-gen-a"
                    element={
                      <>
                        <PageTitle title="Form Elements" />
                        <FormElementsA />
                      </>
                    }
                  />
                  <Route
                    path="/master/form-editor"
                    element={
                      <>
                        <PageTitle title="Form Master Editor | Genmatsu" />
                        <FormMasterEditor />
                      </>
                    }
                  />
                  <Route
                    path="/master/nacl-master" // เพิ่ม Route block นี้
                    element={
                      <ProtectedRoute>
                        <NaClMaster />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/master/user-master"
                    element={
                      <>
                        <PageTitle title="User Master | Genmatsu" />
                        <UserMaster />
                      </>
                    }
                  />

                  <Route
                    path="/reports/history/gen-b"
                    element={
                      <ProtectedRoute>
                        <>
                          <PageTitle title="Report History | Genmatsu" />
                          <ReportHistory_GEN_B />
                        </>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/reports/history/gen-a"
                    element={
                      <ProtectedRoute>
                        <>
                          <PageTitle title="Report History (Genmatsu A) | Genmatsu" />
                          <ReportHistory_GEN_A />
                        </>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/forms/as2-form"
                    element={<><PageTitle title="AS2 Form" /><AS2_Form /></>}
                  />

                  <Route
                    path="/reports/edit/:id"
                    element={
                      <ProtectedRoute>
                        <ReportEditDispatcher />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reports/view/:id"
                    element={<ReportDetailDispatcher />}
                  />
                  <Route
                    path="/forms/bz-form"
                    element={<><PageTitle title="BZ Form" /><BZ_Form /></>}
                  />
                  <Route
                    path="/forms/bz3-form"
                    element={<><PageTitle title="BZ3 Form" /><BZ3_Form /></>}
                  />
                  <Route
                    path="/forms/bs3-form"
                    element={<><PageTitle title="BS3 Form" /><BS3_Form /></>}
                  />
                  <Route
                    path="/forms/bz5-c-form"
                    element={<><PageTitle title="BZ5-C Form" /><BZ5_C_Form /></>}
                  />
                  <Route
                    path="/forms/bs5-c-form"
                    element={<><PageTitle title="BS5-C Form" /><BS5_C_Form /></>}
                  />
                  <Route
                    path="tables"
                    element={
                      <>
                        <PageTitle title="Tables" />
                        <Tables />
                      </>
                    }
                  />
                  <Route
                    path="settings"
                    element={
                      <>
                        <PageTitle title="Settings" />
                        <Settings />
                      </>
                    }
                  />
                  <Route
                    path="chart"
                    element={
                      <>
                        <PageTitle title="Chart" />
                        <Chart />
                      </>
                    }
                  />
                  <Route
                    path="ui/alerts"
                    element={
                      <>
                        <PageTitle title="Alerts" />
                        <Alerts />
                      </>
                    }
                  />
                  <Route
                    path="ui/buttons"
                    element={
                      <>
                        <PageTitle title="Buttons" />
                        <Buttons />
                      </>
                    }
                  />
                </Routes>
              </DefaultLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

// บรรทัดนี้สำคัญที่สุด!
export default App;