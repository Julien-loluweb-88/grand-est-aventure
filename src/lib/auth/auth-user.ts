"use server"
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../auth";

export const getSession = async () => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
  
    return session;
  };

  export const getUser = async () => {
    const session = await getSession();
    return session?.user;
  };

  export const isAdmin = async () => {
    const user = await getUser();
    if (!user || user.role !== "admin") {
      redirect("/admin-game");
    }
    return true;
  };