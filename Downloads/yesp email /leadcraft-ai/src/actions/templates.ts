"use server";

import { supabase } from "@/lib/supabase";
import { dbLog } from "@/lib/db-error";
import { revalidatePath } from "next/cache";

export async function getTemplates() {
  const { data, error } = await supabase
    .from("Template")
    .select("*")
    .order("createdAt", { ascending: false });
  if (error) {
    dbLog("getTemplates", error);
  }
  return data || [];
}

export async function createTemplate(data: {
  name: string;
  subject: string;
  body: string;
  category?: string;
  replyTo?: string;
  attachments?: { id: string; name: string; url: string }[];
}) {
  const { data: template, error } = await supabase
    .from("Template")
    .insert([
      {
        name: data.name,
        subject: data.subject,
        body: data.body,
        category: data.category || "Custom",
        replyTo: data.replyTo || null,
        attachments: data.attachments ?? [],
      },
    ])
    .select()
    .single();

  if (error) {
    dbLog("createTemplate", error);
    return { success: false, error };
  }

  revalidatePath("/templates");
  return { success: true, template };
}

export async function deleteTemplate(id: string) {
  const { error } = await supabase.from("Template").delete().eq("id", id);

  if (error) {
    dbLog("deleteTemplate", error);
    if (error.code === "23503") {
      return {
        success: false,
        error:
          "Cannot delete this template because it is currently being used in an active Campaign.",
      };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/templates");
  return { success: true };
}

export async function updateTemplate(
  id: string,
  data: {
    name: string;
    subject: string;
    body: string;
    category?: string;
    replyTo?: string;
    attachments?: { id: string; name: string; url: string }[];
  }
) {
  const { data: template, error } = await supabase
    .from("Template")
    .update({
      name: data.name,
      subject: data.subject,
      body: data.body,
      category: data.category || "Custom",
      replyTo: data.replyTo || null,
      attachments: data.attachments ?? [],
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    dbLog("updateTemplate", error);
    return { success: false, error };
  }

  revalidatePath("/templates");
  return { success: true, template };
}

export async function duplicateTemplate(id: string) {
  const { data: original, error: fetchError } = await supabase
    .from("Template")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !original) {
    dbLog("duplicateTemplate(fetch)", fetchError);
    return { success: false, error: "Template not found" };
  }

  const { data: copy, error: insertError } = await supabase
    .from("Template")
    .insert([
      {
        name: `Copy of ${original.name}`,
        subject: original.subject,
        body: original.body,
        category: original.category || "Custom",
        replyTo: original.replyTo || null,
        attachments: original.attachments ?? [],
      },
    ])
    .select()
    .single();

  if (insertError || !copy) {
    dbLog("duplicateTemplate(insert)", insertError);
    return { success: false, error: "Failed to duplicate template" };
  }

  revalidatePath("/templates");
  return { success: true, id: copy.id };
}
