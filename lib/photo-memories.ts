export const memoryLimit = 3;

export type PhotoMemory = {
  id: string;
  prefecture: string;
  place: string;
  date: string;
  photo: Blob;
};

async function transact<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore, finish: (value: T) => void) => void,
): Promise<T> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("nippon-map-photo-memories", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("photos", {keyPath: "id"});
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction("photos", mode);
      let result: T;
      tx.oncomplete = () => resolve(result);
      tx.onabort = () => reject(tx.error);
      tx.onerror = () => reject(tx.error);
      run(tx.objectStore("photos"), value => { result = value; });
    });
  } finally {
    db.close();
  }
}

export function listMemories() {
  return transact<PhotoMemory[]>("readonly", (store, finish) => {
    const request = store.getAll();
    request.onsuccess = () => finish(request.result);
  });
}

export function addMemory(memory: PhotoMemory) {
  return transact<boolean>("readwrite", (store, finish) => {
    const request = store.count();
    request.onsuccess = () => {
      if (request.result >= memoryLimit) {
        finish(false);
        return;
      }
      store.add(memory);
      finish(true);
    };
  });
}

export function deleteMemory(id: string) {
  return transact<void>("readwrite", (store, finish) => {
    store.delete(id);
    finish();
  });
}

export async function prepareMemoryPhoto(file: File): Promise<Blob> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 15 * 1024 * 1024) {
    throw new Error("15MB以下のJPEG・PNG・WebPを選んでください。");
  }

  const image = await createImageBitmap(file).catch(() => {
    throw new Error("写真を読み込めませんでした。別の写真を選んでください。");
  });
  try {
    const ratio = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * ratio));
    canvas.height = Math.max(1, Math.round(image.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("写真を処理できませんでした。");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("写真を処理できませんでした。")), "image/jpeg", 0.85);
    });
  } finally {
    image.close();
  }
}
