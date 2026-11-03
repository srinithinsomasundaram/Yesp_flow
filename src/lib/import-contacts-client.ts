import { importContacts, type ContactImportRow } from "@/actions/contacts";
import { CONTACT_IMPORT_BATCH_SIZE, MAX_CONTACTS } from "@/lib/pagination";

export async function importContactBatches(
  rows: ContactImportRow[],
  campaignId?: string,
  onProgress?: (processed: number) => void
): Promise<{ success: boolean; count: number; error?: string }> {
  if (rows.length > MAX_CONTACTS) {
    return { success: false, count: 0, error: `A CSV can contain at most ${MAX_CONTACTS.toLocaleString()} contacts.` };
  }

  let count = 0;
  for (let offset = 0; offset < rows.length; offset += CONTACT_IMPORT_BATCH_SIZE) {
    const batch = rows.slice(offset, offset + CONTACT_IMPORT_BATCH_SIZE);
    const isLastBatch = offset + batch.length >= rows.length;
    const result = await importContacts(batch, campaignId, isLastBatch);
    count += result.count;
    if (!result.success) return { success: false, count, error: result.error };
    onProgress?.(Math.min(offset + batch.length, rows.length));
  }
  return { success: true, count };
}
