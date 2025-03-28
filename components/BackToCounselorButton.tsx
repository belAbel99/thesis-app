import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FiArrowLeft } from "react-icons/fi";

const BackToCounselorButton = ({ userId }: { userId: string }) => {
  return (
    <Link href={`/counselors/${userId}/counselor`}>
      <Button className="bg-blue-700 hover:bg-blue-500 text-white">
        <FiArrowLeft className="mr-2" /> Back to Dashboard
      </Button>
    </Link>
  );
};

export default BackToCounselorButton;