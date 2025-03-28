// C:\Users\User_\Desktop\thesis-app\app\admin\counselors\register\page.tsx
import CreateCounselorForm from "@/components/forms/CreateCounselorForm";

const RegisterCounselorPage = () => {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h1 className="text-2xl font-bold mb-6 text-black">Create Counselor</h1>
      <CreateCounselorForm />
    </div>
  );
};

export default RegisterCounselorPage;