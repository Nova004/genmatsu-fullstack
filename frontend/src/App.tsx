import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Loader from './common/Loader';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './AppRoutes';
import { setupGlobalScrollHandler } from './utils/utils';

function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);

    // Call the global scroll handler from utils
    const cleanup = setupGlobalScrollHandler();

    return cleanup;
  }, []);

  return loading ? (
    <Loader />
  ) : (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        containerClassName="overflow-auto"
      />
      <AppRoutes />
    </>
  );
}

export default App;