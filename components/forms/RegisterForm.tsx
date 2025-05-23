"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl,FormField, FormItem, FormLabel, FormMessage  } from "@/components/ui/form";
import CustomFormField from "../ui/CustomFormField";
import { useState } from "react";
import SubmitButton from "../SubmitButton";
import { useRouter } from "next/navigation";
import { registerPatient } from "@/lib/actions/patient.actions";
import { FormFieldType } from "./PatientForms";
import { RadioGroup, RadioGroupItem } from "@radix-ui/react-radio-group";
import { GenderOptions } from "@/constants";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import FileUploader from "../FileUploader";
import { useEffect } from "react";
import SuccessMessage from "../SuccessMessage";
import SignaturePad from "../SignaturePad";
import { Client, Databases, ID } from "appwrite";
import { useSearchParams } from "next/navigation";

// Load environment variables
const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID!;
const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID!;
const ENDPOINT = process.env.NEXT_PUBLIC_ENDPOINT!;
const PROGRAMTYPES_COLLECTION_ID = process.env.NEXT_PUBLIC_PROGRAMTYPES_COLLECTION_ID!;
const COUNSELOR_COLLECTION_ID = process.env.NEXT_PUBLIC_COUNSELOR_COLLECTION_ID!;
const REFERRALS_COLLECTION_ID = process.env.NEXT_PUBLIC_REFERRALS_COLLECTION_ID!;

// Define validation schema for the guidance counseling system
const GuidanceFormValidation = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  suffix: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  idNumber: z.string().min(1, "ID number is required"),
  program: z.string().min(1, "Program is required"),
  yearLevel: z.string().min(1, "Year level is required"),
  gender: z.string().min(1, "Gender is required"),
  birthDate: z.date({
    required_error: "Date of birth is required",
    invalid_type_error: "Invalid date format",
  }),
  age: z.string().min(1, "Age is required"),
  address: z.string().min(1, "Address is required"),
  civilStatus: z.string().min(1, "Civil status is required"),
  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyContactNumber: z.string().min(1, "Emergency contact number is required"),
  scholarship: z.string().optional(),
  academicPerformance: z.string().min(1, "Academic performance is required"),
  counselingPreferences: z.string().min(1, "Counseling preferences are required"),
  mentalHealthHistory: z.string().optional(),
  identificationType: z.string().min(1, "Identification type is required"),
  identificationNumber: z.string().min(1, "Identification number is required"),
  identificationDocument: z.any().optional(),
  treatmentConsent: z.boolean().refine((val) => val === true, "You must consent to the privacy policy"),
  privacyConsent: z.boolean().refine(val => val === true, "You must consent to the privacy policy"),
  disclosureConsent: z.boolean().refine(val => val === true, "You must consent to information disclosure"),
  signatureData: z.string().min(1, "Signature is required"),
  signatureDate: z.date(),
});

const RegisterForm = ({ user }: { user: User }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [programTypes, setProgramTypes] = useState<string[]>([]);
  const [counselors, setCounselors] = useState<any[]>([]);
  const [message, setMessage] = useState<string>(""); // Add state for error messages
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";

  const form = useForm<z.infer<typeof GuidanceFormValidation>>({
    resolver: zodResolver(GuidanceFormValidation),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      suffix: "",
      email: emailFromQuery,
      phone: "",
      idNumber: "",
      program: "",
      yearLevel: "",
      gender: "",
      birthDate: undefined,
      address: "",
      civilStatus: "",
      scholarship: "",
      emergencyContactName: "",
      emergencyContactNumber: "",
      academicPerformance: "",
      counselingPreferences: "",
      mentalHealthHistory: "",
      identificationType: "",
      identificationNumber: "",
      identificationDocument: [],
      treatmentConsent: false,
    },
  });

  // Fetch program types and counselors from Appwrite
  useEffect(() => {
    const client = new Client()
      .setEndpoint(ENDPOINT)
      .setProject(PROJECT_ID);

    const databases = new Databases(client);

    const fetchProgramTypes = async () => {
      try {
        const response = await databases.listDocuments(DATABASE_ID, PROGRAMTYPES_COLLECTION_ID);
        setProgramTypes(response.documents.map((doc) => doc.name));
      } catch (error) {
        console.error("Error fetching program types:", error);
      }
    };

    const fetchCounselors = async () => {
      try {
        const response = await databases.listDocuments(DATABASE_ID, COUNSELOR_COLLECTION_ID);
        setCounselors(response.documents);
      } catch (error) {
        console.error("Error fetching counselors:", error);
      }
    };

    fetchProgramTypes();
    fetchCounselors();
  }, []);
  
  async function onSubmit(values: z.infer<typeof GuidanceFormValidation>) {
    setIsLoading(true);
    setSuccessMessage("");
    setMessage("");
  
    try {
      // Prepare form data
      let formData;
      if (values.identificationDocument?.length > 0) {
        const blobFile = new Blob([values.identificationDocument[0]], {
          type: values.identificationDocument[0].type,
        });
        formData = new FormData();
        formData.append("blobFile", blobFile);
        formData.append("fileName", values.identificationDocument[0].name);
      }
  
      // Find counselor
      const counselor = counselors.find((c) => c.program === values.program);
      if (!counselor) {
        throw new Error("No counselor available for this program.");
      }
  
      // Prepare patient data
      const patientData = {
        ...values,
        userId: user.$id,
        birthDate: new Date(values.birthDate),
        identificationDocument: formData,
        counselorId: counselor.$id,
        program: values.program,
        signatureData: values.signatureData,
        signatureDate: new Date(),
        privacyConsent: values.privacyConsent,
        disclosureConsent: values.disclosureConsent,
      };
  
      // Register patient (this will also create consent record)
      const patient = await registerPatient(patientData);
  
      // Create referral
      const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID);
      const databases = new Databases(client);
      await databases.createDocument(
        DATABASE_ID,
        REFERRALS_COLLECTION_ID,
        ID.unique(),
        {
          studentId: patient.$id,
          counselorId: counselor.$id,
          program: values.program,
          date: new Date().toISOString(),
          status: "Pending",
        }
      );
  
      // Show success message
      setSuccessMessage("Registration successful! Redirecting...");
      
      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push(`/patients/${patient.$id}/student`);
      }, 1500);
      
    } catch (error: any) {
      console.error("Registration error:", error);
      setMessage(
        error?.message || 
        error?.response?.message || 
        "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12 flex-1">
        {successMessage && <SuccessMessage message={successMessage} />}

        <section className="space-y-6">
          <div className="mb-9 space-y-1">
            <h2 className="sub-header text-blue-700">Personal Information</h2>
          </div>
        </section>

        <div className="flex flex-col gap-6 xl:flex-row">
          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            name="firstName"
            label="First Name"
            placeholder="John"
            required={true}
          />
          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            name="middleName"
            label="Middle Name"
            placeholder="Michael"
          />
          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            name="lastName"
            label="Last Name"
            placeholder="Doe"
            required={true}
          />
          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            name="suffix"
            label="Suffix (if any)"
            placeholder="Jr., Sr., III, etc."
          />
        </div>

        <div className="flex flex-col gap-6 xl:flex-row">
          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            name="idNumber"
            label="ID Number"
            placeholder="211-00024"
            required={true}
          />
          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            name="email"
            label="Email"
            placeholder="JohnAbel@gmail.com"
            readOnly={true}
            required={true}
          />
          <CustomFormField
            fieldType={FormFieldType.PHONE_INPUT}
            control={form.control}
            name="phone"
            label="Phone Number"
            placeholder="091234567"
            required={true}
          />
        </div>

        <div className="flex flex-col gap-6 xl:flex-row">
          <CustomFormField
          fieldType={FormFieldType.DATE_PICKER}
          control={form.control}
          name="birthDate"
          label="Date of Birth"
          required={false}
        />
          <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="age"
          label="Age"
          placeholder="21"
          type="text" // Pass type directly if supported
          required={true}
        />
        <CustomFormField
                fieldType={FormFieldType.SKELETON}
                control={form.control}
                name="gender"
                label="Gender"
                backgroundColor="bg-gray-50"
                required={true} 
                renderSkeleton={(field)=>(
                    <FormControl>
                        <RadioGroup className="flex flex-11 gap-6 xl:justify-between text-black" 
                        onValueChange={field.onChange}
                        defaultValue={field.value}>
                            {GenderOptions.map((option) => (
                                <div key={option} className="radio-group">
                                    <RadioGroupItem value = {option} id={option}/>
                                    <Label htmlFor={option} className="cursor-pointer">{option}</Label>
                                </div>
                         ))}
                        </RadioGroup>
                    </FormControl>
                )}
            />
        </div>

          <div className="flex flex-col gap-6 xl:flex-row">
          <CustomFormField
            fieldType={FormFieldType.SKELETON}
            control={form.control}
            name="civilStatus"
            label="Civil Status"
            required={true}
            renderSkeleton={(field) => (
              <FormControl>
                <RadioGroup
                  className="flex flex-wrap gap-6 xl:justify-between text-black"
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  {["Single", "Married", "Solo Parent", "Widowed", "Divorced"].map((status) => (
                    <div key={status} className="radio-group flex items-center gap-2">
                      <RadioGroupItem value={status} id={status} />
                      <Label htmlFor={status} className="cursor-pointer">
                        {status}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
            )}
          />
        </div>

        <div className="flex flex-col gap-6 xl:flex-row">
          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            name="address"
            label="Address"
            placeholder="Ampayon, Butuan City"
            required={true}
          />
        </div>

        <div className="flex flex-col gap-6 xl:flex-row">
          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            name="emergencyContactName"
            label="Emergency Contact Name"
            placeholder="Guardian's name"
            required={true}
          />
          <CustomFormField
            fieldType={FormFieldType.PHONE_INPUT}
            control={form.control}
            name="emergencyContactNumber"
            label="Emergency Contact Number"
            placeholder="091234567"
            required={true}
          />
        </div>

        <section className="space-y-6">
          <div className="mb-9 space-y-1">
            <h2 className="sub-header text-blue-700">Academic Information</h2>
          </div>
        </section>

        <div className="flex flex-col gap-6 xl:flex-row">
          <CustomFormField
            fieldType={FormFieldType.SKELETON}
            control={form.control}
            name="program"
            label="College Program"
            required={true}
            renderSkeleton={(field) => (
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select College" />
                  </SelectTrigger>
                  <SelectContent className="w-full text-black">
                    {programTypes.map((program) => (
                      <SelectItem key={program} value={program}>
                        {program}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            )}
          />
          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            name="yearLevel"
            label="Year Level"
            placeholder="4"
            required={true}
          />
          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            name="scholarship"
            label="Scholarship (if any)"
            placeholder="e.g., Academic Scholarship, Athletic Scholarship"
            backgroundColor="bg-gray-50"
            required={false} // Optional field
          />
        </div>

        <div className="flex flex-col gap-6 xl:flex-row">
          <CustomFormField
            fieldType={FormFieldType.SKELETON}
            control={form.control}
            name="academicPerformance"
            label="Academic Performance"
            required={true}
            renderSkeleton={(field) => (
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Academic Performance" />
                  </SelectTrigger>
                  <SelectContent className="w-full text-black">
                    {["Excellent", "Good", "Average", "Needs Improvement"].map((performance) => (
                      <SelectItem key={performance} value={performance}>
                        {performance}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            )}
          />
        </div>

        <section className="space-y-6">
          <div className="mb-9 space-y-1">
            <h2 className="sub-header text-blue-700">Counseling Information</h2>
          </div>
        </section>

        <div className="flex flex-col gap-6 xl:flex-row">
          <CustomFormField
            fieldType={FormFieldType.SKELETON}
            control={form.control}
            name="counselingPreferences"
            label="Counseling Preferences"
            required={true}
            renderSkeleton={(field) => (
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Counseling Preferences" />
                  </SelectTrigger>
                  <SelectContent className="w-full text-black">
                    {["Academic Advising", "Career Counseling", "Mental Health Support", "Personal Development"].map((preference) => (
                      <SelectItem key={preference} value={preference}>
                        {preference}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            )}
          />
        </div>

        <div className="flex flex-col gap-6 xl:flex-row">
          <CustomFormField
            fieldType={FormFieldType.TEXTAREA}
            control={form.control}
            name="mentalHealthHistory"
            label="Mental Health History (if any)"
            placeholder="Please specify..."
          />
        </div>

        <section className="space-y-6">
          <div className="mb-9 space-y-1">
            <h2 className="sub-header text-blue-700">Identification and Verification</h2>
          </div>
        </section>

        <div className="flex flex-col gap-6 xl:flex-row">
          <CustomFormField
            fieldType={FormFieldType.SKELETON}
            control={form.control}
            name="identificationType"
            label="Identification Type"
            required={true}
            renderSkeleton={(field) => (
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Identification Type" />
                  </SelectTrigger>
                  <SelectContent className="w-full text-black">
                    {["Student ID", "Passport", "Driver's License"].map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            )}
          />
          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            name="identificationNumber"
            label="Identification Number"
            placeholder="123456789"
            required={true}
          />
        </div>

        <div className="flex flex-col gap-6 xl:flex-row">
          <CustomFormField
            fieldType={FormFieldType.SKELETON}
            control={form.control}
            name="identificationDocument"
            label="Scanned Copy of Identification Document"
            renderSkeleton={({ value, onChange }) => (
              <FormControl>
                <FileUploader
                  files={value}
                  onChange={(files) => {
                    onChange(files);
                    form.trigger("identificationDocument");
                  }}
                />
              </FormControl>
            )}
          />
        </div>

        <section className="space-y-6">
        <div className="space-y-6">
          <h3 className="font-large text-bold">Consent and Privacy</h3>
  
        <div className="grid gap-4">
          <div className="p-4 border rounded-lg bg-gray-50">
            <h4 className="font-medium mb-2">Privacy Policy Consent</h4>
            <p className="text-sm mb-4">
              I consent to the collection, use, and disclosure of my personal information 
              in accordance with the university privacy policy for counseling services.
            </p>
            <CustomFormField
              fieldType={FormFieldType.CHECKBOX}
              control={form.control}
              name="privacyConsent"
              label="I consent to the privacy policy"
              required={true}
            />
          </div>

          <div className="p-4 border rounded-lg bg-gray-50">
            <h4 className="font-medium mb-2">Information Disclosure Consent</h4>
            <p className="text-sm mb-4">
              I consent to the disclosure of relevant information to university staff 
              when necessary for my academic support and counseling services.
            </p>
            <CustomFormField
              fieldType={FormFieldType.CHECKBOX}
              control={form.control}
              name="disclosureConsent"
              label="I consent to information disclosure"
              required={true}
            />
          </div>

          <div className="p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium mb-2">Electronic Signature</h4>
              <p className="text-sm mb-4">
                Please provide your signature to confirm your consent to the above policies.
              </p>
              <FormField
                control={form.control}
                name="signatureData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Your Signature</FormLabel>
                    <FormControl>
                      <SignaturePad 
                        onSave={field.onChange} 
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <CustomFormField
              fieldType={FormFieldType.DATE_PICKER}
              control={form.control}
              name="signatureDate"
              label="Date Signed"
              required={true}
            />
          </div>
        </div>
        </div>
        </section>

        <div className="text-black space-y-9">
          <CustomFormField
            fieldType={FormFieldType.CHECKBOX}
            control={form.control}
            name="treatmentConsent"
            label="I consent to the privacy policy"
            required={true}
          />
        </div>

        <SubmitButton isLoading={isLoading}>Submit</SubmitButton>
      </form>
    </Form>
  );
};

export default RegisterForm;