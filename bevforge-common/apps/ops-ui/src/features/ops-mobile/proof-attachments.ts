export interface OpsMobileProofAttachmentRecord {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
  createdAt: string;
}

const DB_NAME = "ops-mobile-proof-attachments";
const STORE_NAME = "attachments";
const DB_VERSION = 1;

const canUseIndexedDb = (): boolean =>
  typeof window !== "undefined" && typeof window.indexedDB !== "undefined";

const openDatabase = (): Promise<globalThis.IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (!canUseIndexedDb()) {
      reject(new Error("IndexedDB is unavailable on this device."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => {
      reject(request.error ?? new Error("Failed to open proof attachment store."));
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });

const readFileAsDataUrl = (file: globalThis.File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new globalThis.FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Failed to read proof attachment."));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read proof attachment."));
    };
    reader.readAsDataURL(file);
  });

export const saveOpsMobileProofAttachment = async (
  file: globalThis.File,
): Promise<OpsMobileProofAttachmentRecord> => {
  const dataUrl = await readFileAsDataUrl(file);
  const attachment: OpsMobileProofAttachmentRecord = {
    id: `proof-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    fileName: file.name.trim() || "proof-image.jpg",
    mimeType: file.type.trim() || "image/jpeg",
    sizeBytes: file.size,
    dataUrl,
    createdAt: new Date().toISOString(),
  };

  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Failed to store proof attachment."));
      tx.objectStore(STORE_NAME).put(attachment);
    });
  } finally {
    db.close();
  }

  return attachment;
};

export const getOpsMobileProofAttachment = async (
  id: string,
): Promise<OpsMobileProofAttachmentRecord | null> => {
  const db = await openDatabase();
  try {
    return await new Promise<OpsMobileProofAttachmentRecord | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      tx.onerror = () => reject(tx.error ?? new Error("Failed to read proof attachment."));
      const request = tx.objectStore(STORE_NAME).get(id);
      request.onerror = () => reject(request.error ?? new Error("Failed to read proof attachment."));
      request.onsuccess = () => {
        resolve((request.result as OpsMobileProofAttachmentRecord | undefined) ?? null);
      };
    });
  } finally {
    db.close();
  }
};

export const deleteOpsMobileProofAttachment = async (id: string): Promise<void> => {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Failed to delete proof attachment."));
      tx.objectStore(STORE_NAME).delete(id);
    });
  } finally {
    db.close();
  }
};
