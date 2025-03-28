
import Image from "next/image";
import RegisterForm from "@/components/forms/RegisterForm";
import { getUser } from "@/lib/actions/patient.actions";
import BackToHomeButton from "@/components/BackToHomeButton";

// import * as Sentry from '@sentry/nextjs'


const Register = async ({ params }: { params: { userId: string } }) => {
  const { userId } = await params; // Await params before accessing its properties
  const user = await getUser(userId);
  
  // Sentry.metrics.set("user_view", user.name);

  return (
    <div className = "flex h-screen max-h-screen bg-white text-blue-700">

   <section className="remove-scrollbar container">
   <BackToHomeButton />
    <div className="sub-container max-w-[860px] flex-1 flex-col py-10">
      
      {/* <Image
        src="/assets/icons/logo-full.svg"
        height={1000}
        width={1000}
        alt="patient"
        className="mb-12 h-10 w-fit"
      /> */}
      
      <RegisterForm user={user}/>


      <p className="copyright py-12">
      © 2025 Guidance Office CSU
      </p>
      
    </div>
   </section>


  </div>
  );
};

export default Register
