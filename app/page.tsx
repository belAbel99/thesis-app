import PatientForms from "@/components/forms/PatientForms"
import PasskeyModal from "@/components/PasskeyModal";
import { ThemeProvider } from "@/components/theme-provider";
import Image from "next/image"
import Link from "next/link"

export default async function Home({ searchParams}: SearchParamProps) {
  const params = await searchParams;
  const isAdmin = params.admin === 'true';
 return (
  <div className = "flex h-screen max-h-screen bg-white text-blue-700">
    {isAdmin && <PasskeyModal/>}


   <section className="remove-scrollbar container my-auto bg-white"> 
    <div className="sub-container max-w-[496px]">
      {/* <Image
        src="/assets/icons/logo-full.svg"
        height={1000}
        width={1000}
        alt="patient"
        className="mb-12 h-10 w-fit"
      /> */}

      <PatientForms />
      <div className="text-14-regular mt-20 flex justify-between">
      <p className="justify-items-end text-dark-600 xl:text-left">
      © Guidance Office CSU 2025
      </p>
      <Link href="/?admin=true" className="text-green-500">
        Admin
      </Link>
      </div>
    </div>

   </section>
  </div>
 )
}
