import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import MyFirstForm from '../../components/formGen/pages/GEN_B/BZ_Form/BZ_index';

const FormElementsB = () => {
  return (
    <>
      <Breadcrumb pageName="Form Elements" />
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-9">
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">
            ใบรายงานการผลิต Manufacturing BZ
          </h3>
        </div>
        <MyFirstForm />
      </div>
    </>
  );
};

export default FormElementsB;
