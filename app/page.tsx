import PatientForms from "@/components/forms/PatientForms"
import { ThemeProvider } from "@/components/theme-provider";
import Image from "next/image"

export default async function Home({ searchParams }: SearchParamProps) {
  const params = await searchParams;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <Image
            src="/assets/images/GCOLOGO.png"
            width={100}
            height={100}
            alt="CSU Guidance Logo"
            className="mx-auto mb-4 rounded-full shadow-lg border border-gray-200 transform transition-transform hover:scale-105 duration-300 ease-in-out shadow-blue-500/50 hover:shadow-lg hover:shadow-blue-500/50 "
          />
          <h1 className="text-3xl font-bold text-blue-800 mt-4 ">CSU Guidance Office</h1>
          <p className="text-gray-600 mt-2 ">Student Counseling Services</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <PatientForms />
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Guidance & Counseling Office CSU</p>
        </div>
      </div>
    </div>
  )
}