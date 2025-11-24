import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import Loader from './common/Loader';
import PageTitle from './components/PageTitle';
import DefaultLayout from './layout/DefaultLayout';
import ProtectedRoute from './routes/ProtectedRoute';

// Lazy Load Pages
const SignIn = lazy(() => import('./pages/Authentication/SignIn'));
const SignUp = lazy(() => import('./pages/Authentication/SignUp'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Chart = lazy(() => import('./pages/Chart'));
const Dashbord_App = lazy(() => import('./pages/Dashboard/Dashbord_App'));
const Dashbord_Master = lazy(() => import('./pages/Dashboard/Dashbord_Master'));
const FormElementsB = lazy(() => import('./pages/Form/FormElements-gen-b'));
const FormElementsA = lazy(() => import('./pages/Form/FormElements-gen-a'));
const FormMasterEditor = lazy(() => import('./components/formGen/pages/Master/FormMasterEditor'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Tables = lazy(() => import('./pages/Tables'));
const Alerts = lazy(() => import('./pages/UiElements/Alerts'));
const Buttons = lazy(() => import('./pages/UiElements/Buttons'));
const UserMaster = lazy(() => import('./components/formGen/pages/Master/UserMaster'));
const NaClMaster = lazy(() => import('./components/formGen/pages/Master/NaClMaster'));
const ReportHistory_GEN_B = lazy(() => import('./pages/Reports/ReportHistory_GEN_B'));
const ReportHistory_GEN_A = lazy(() => import('./pages/Reports/ReportHistory_GEN_A'));
const ReportDetailDispatcher = lazy(() => import('./pages/Reports/ReportDetailDispatcher'));
const ReportEditDispatcher = lazy(() => import('./pages/Reports/ReportEditDispatcher'));
const ReportPrintDispatcher = lazy(() => import('./pages/Reports/ReportPrintDispatcher'));

// Forms
const BZ_Form = lazy(() => import('./components/formGen/pages/GEN_B/BZ_Form/BZ_index'));
const BN_Form = lazy(() => import('./components/formGen/pages/GEN_B/BN_Form/BN_index'));
const BS_B_Form = lazy(() => import('./components/formGen/pages/GEN_B/BS-B_Form/BS-B_index'));
const BS_Form = lazy(() => import('./components/formGen/pages/GEN_B/BS_Form/BS_index'));
const BZ3_Form = lazy(() => import('./components/formGen/pages/GEN_B/BZ3_Form/BZ3_index'));
const BS3_Form = lazy(() => import('./components/formGen/pages/GEN_B/BS3_Form/BS3_index'));
const BZ3_B_Form = lazy(() => import('./components/formGen/pages/GEN_B/BZ3-B_Form/BZ3-B_index'));
const BS3_B_Form = lazy(() => import('./components/formGen/pages/GEN_B/BS3-B_Form/BS3-B_index'));
const BS3_B1_Form = lazy(() => import('./components/formGen/pages/GEN_B/BS3-B1_Form/BS3-B1_index'));
const AS2_Form = lazy(() => import('./components/formGen/pages/GEN_A/AS2_Form/AS2_index'));
const AX9_B_Form = lazy(() => import('./components/formGen/pages/GEN_A/AX9-B_Form/AX9-B_index'));
const AX2_B_Form = lazy(() => import('./components/formGen/pages/GEN_A/AX2-B_Form/AX2-B_index'));
const BZ5_C_Form = lazy(() => import('./components/formGen/pages/GEN_B/BZ5-C_Form/BZ5-C_index.tsx'));
const BS5_C_Form = lazy(() => import('./components/formGen/pages/GEN_B/BS5-C_Form/BS5-C_index.tsx'));
const BS3_C_Form = lazy(() => import('./components/formGen/pages/GEN_B/BS3-C_Form/BS3-C_index.tsx'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/reports/print/:id" element={<ReportPrintDispatcher />} />
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

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Routes>
                {/* Routes without DefaultLayout */}
                
                {/* Routes with DefaultLayout */}
                <Route
                  path="*"
                  element={
                    <DefaultLayout>
                      <Routes>
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
                          path="/master/nacl-master"
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
                          path="/forms/ax9-b-form"
                          element={<><PageTitle title="AX9-B Form" /><AX9_B_Form /></>}
                        />
                        <Route
                          path="/forms/ax2-b-form"
                          element={<><PageTitle title="AX2-B Form" /><AX2_B_Form /></>}
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
                          path="/forms/bs-b-form"
                          element={<><PageTitle title="BS-B Form" /><BS_B_Form /></>}
                        />
                        <Route
                          path="/forms/bs-form"
                          element={<><PageTitle title="BS Form" /><BS_Form /></>}
                        />
                        <Route
                          path="/forms/bn-form"
                          element={<><PageTitle title="BN Form" /><BN_Form /></>}
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
                          path="/forms/bs3-c-form"
                          element={<><PageTitle title="BS3-C Form" /><BS3_C_Form /></>}
                        />
                        <Route
                          path="/forms/bs3-b-form"
                          element={<><PageTitle title="BS3-B Form" /><BS3_B_Form /></>}
                        />
                        <Route
                          path="/forms/bs3-b1-form"
                          element={<><PageTitle title="BS3-B Form" /><BS3_B1_Form /></>}
                        />
                        <Route
                          path="/forms/bz3-b-form"
                          element={<><PageTitle title="BZ3-B Form" /><BZ3_B_Form /></>}
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
                  }
                />
              </Routes>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
