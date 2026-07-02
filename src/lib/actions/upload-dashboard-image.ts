"use server";

import { runUploadDashboardImage } from "@/lib/uploads/upload-dashboard-image-handler";

export async function uploadDashboardImage(formData: FormData) {
  return runUploadDashboardImage(formData);
}
