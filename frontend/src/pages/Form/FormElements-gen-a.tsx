// location: src/pages/Form/FormElements-gen-a.tsx


import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFileAlt } from 'react-icons/fa';
import { availableForms } from '../../components/formGen/pages/GEN_A/availableForms_GENA';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';

const FormElementsA = () => {
  const navigate = useNavigate();
  const [showSelection, setShowSelection] = useState(false);

  useEffect(() => {
    const lastUsedPath = localStorage.getItem('lastUsedFormPath');

    // Check if the last used path is valid for GEN A
    const isValidPath = availableForms.some(form => form.path === lastUsedPath);

    if (isValidPath && lastUsedPath) {
      navigate(lastUsedPath, { replace: true });
    } else {
      // No valid last used form for GEN A (or first time), show selection list
      setShowSelection(true);
    }
  }, [navigate]);

  if (!showSelection) {
    return null; // Initial checking state
  }

  return (
    <>
      <Breadcrumb pageName="Select Genmatsu A Form" />

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">
            All Types Genmatsu A
          </h3>
        </div>
        <div className="p-6.5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {availableForms.map((form) => (
              <button
                key={form.value}
                onClick={() => navigate(form.path)}
                className="group flex flex-col items-center justify-center rounded-lg border border-stroke bg-gray-50 p-6 text-center shadow-1 transition hover:bg-white hover:shadow-card hover:border-primary dark:border-strokedark dark:bg-meta-4 dark:hover:border-primary dark:hover:bg-boxdark"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <FaFileAlt size={24} />
                </div>
                <h4 className="text-title-sm font-bold text-black dark:text-white group-hover:text-primary transition-colors">
                  {form.label}
                </h4>
                <span className="text-xs text-body font-medium mt-1">Create New</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default FormElementsA;
