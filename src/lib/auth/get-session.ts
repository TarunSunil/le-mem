import { cache } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export const getCachedSession = cache(() => getServerSession(authOptions));