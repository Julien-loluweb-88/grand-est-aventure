/** Entrée fichier extraite d’un `FormData` (Server Action / route API). */
export type FormDataUploadFile = {
  blob: Blob;
  name: string;
  type: string;
  size: number;
};

/** Compatible production Next : `instanceof File` peut échouer selon le runtime. */
export function readFormDataUploadFile(
  formData: FormData,
  fieldName = "file"
): FormDataUploadFile | null {
  const raw = formData.get(fieldName);
  if (!raw || typeof raw === "string") {
    return null;
  }
  if (!(raw instanceof Blob)) {
    return null;
  }
  const name = raw instanceof File && raw.name ? raw.name : "upload";
  const type = typeof raw.type === "string" ? raw.type : "";
  return { blob: raw, name, type, size: raw.size };
}
