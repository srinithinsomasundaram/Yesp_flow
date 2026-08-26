"use server";

import { supabase } from "@/lib/supabase";
import { dbLog } from "@/lib/db-error";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth-helper";

export type FileData = {
  name: string;
  originalName: string;
  url: string;
  size?: number;
  mimeType?: string;
  storagePath?: string;
};

export async function getFiles() {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("FileLibrary")
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: false });
  if (error) dbLog("getFiles", error);
  return data || [];
}

export async function addFile(data: FileData) {
  const userId = await getCurrentUserId();
  const { data: file, error } = await supabase
    .from("FileLibrary")
    .insert([{
      userId,
      name: data.name,
      originalName: data.originalName,
      url: data.url,
      size: data.size ?? null,
      mimeType: data.mimeType ?? null,
      storagePath: data.storagePath ?? null,
    }])
    .select()
    .single();

  if (error) { dbLog("addFile", error); return { success: false, error: error.message }; }
  revalidatePath("/files");
  return { success: true, file };
}

export async function deleteFile(id: string, storagePath?: string | null) {
  const userId = await getCurrentUserId();
  if (storagePath) {
    const { error: storageError } = await supabase.storage.from("files").remove([storagePath]);
    if (storageError) dbLog("deleteFile(storage)", storageError);
  }
  const { error } = await supabase.from("FileLibrary").delete().eq("id", id).eq("userId", userId);
  if (error) { dbLog("deleteFile", error); return { success: false, error: error.message }; }
  revalidatePath("/files");
  return { success: true };
}
