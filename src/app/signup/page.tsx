"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignUp() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/auth/sign-up');
  }, [router]);
  
  return null;
}
