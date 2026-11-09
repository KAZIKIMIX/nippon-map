"use client";

import {useEffect, useMemo, useState, type FormEvent} from "react";
import {prefectureOrder} from "../lib/guide-categories";
import {addMemory, deleteMemory, listMemories, memoryLimit, prepareMemoryPhoto, type PhotoMemory} from "../lib/photo-memories";
import PrefectureMap from "./PrefectureMap";
import styles from "./PhotoMemories.module.css";

function MemoryPhoto({photo, place}: {photo: Blob; place: string}) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const objectUrl = URL.createObjectURL(photo);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);
  return url ? <img src={url} alt={place + "の思い出写真"}/> : null;
}

export default function PhotoMemories({initialPrefecture, initialPlace}: {
  initialPrefecture: string;
  initialPlace: string;
}) {
  const [memories, setMemories] = useState<PhotoMemory[] | null>(null);
  const [region, setRegion] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    listMemories().then(rows => {
      if (active) setMemories(rows);
    }).catch(() => {
      if (active) setError("このブラウザの保存領域を開けませんでした。");
    });
    return () => { active = false; };
  }, []);

  const counts = useMemo(() => {
    const byPrefecture: Record<string, number> = {};
    for (const memory of memories ?? []) {
      byPrefecture[memory.prefecture] = (byPrefecture[memory.prefecture] ?? 0) + 1;
    }
    return byPrefecture;
  }, [memories]);
  const visible = (memories ?? []).filter(memory => !region || memory.prefecture === region)
    .sort((a, b) => b.date.localeCompare(a.date));
  const full = (memories?.length ?? 0) >= memoryLimit;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || full || !memories) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const prefecture = String(data.get("prefecture") ?? "");
    const place = String(data.get("place") ?? "").trim() || prefecture;
    const date = String(data.get("date") ?? "");
    const file = data.get("photo");
    if (!prefectureOrder.includes(prefecture) || !date || !(file instanceof File) || !file.size) {
      setError("都道府県・撮影日・写真を指定してください。");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const photo = await prepareMemoryPhoto(file);
      const saved = await addMemory({id: crypto.randomUUID(), prefecture, place, date, photo});
      setMemories(await listMemories());
      if (saved) {
        form.reset();
        setRegion(prefecture);
        setMessage(prefecture + "に思い出を登録しました。");
      } else {
        setError("登録できる思い出は3件までです。");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "思い出を保存できませんでした。");
    } finally {
      setBusy(false);
    }
  }

  async function remove(memory: PhotoMemory) {
    if (busy || !window.confirm(memory.place + "の思い出を削除しますか？")) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await deleteMemory(memory.id);
      setMemories(await listMemories());
      setMessage("思い出を削除しました。");
    } catch {
      setError("思い出を削除できませんでした。");
    } finally {
      setBusy(false);
    }
  }

  return <main className={styles.page}>
    <a href="/map">← 施設を探す地図へ</a>
    <h1>思い出マップ</h1>
    <p>撮った写真を登録して、自分の日本地図を色づけよう。</p>
    <p>試作版の写真と記録は、このブラウザ内に保存されます。</p>
    <section className={styles.card} aria-labelledby="memory-form-title">
      <h2 id="memory-form-title">思い出を登録</h2>
      {memories && <p>登録済み {memories.length} / {memoryLimit} 件</p>}
      {full && <p>3件の上限に達しました。空きを作ると新しい思い出を登録できます。</p>}
      <form onSubmit={save}>
        <fieldset className={styles.form} disabled={busy || full || !memories}>
          <label>都道府県<select name="prefecture" required defaultValue={initialPrefecture}>
            <option value="">選択してください</option>
            {prefectureOrder.map(name => <option key={name}>{name}</option>)}
          </select></label>
          <label>場所・施設名（任意）<input name="place" maxLength={120} defaultValue={initialPlace}/></label>
          <label>撮影日<input name="date" type="date" required/></label>
          <label>写真（JPEG・PNG・WebP、15MBまで）<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required/></label>
          <button type="submit">{busy ? "処理中…" : "写真を登録"}</button>
        </fieldset>
      </form>
      <p role="status">{message}</p>
      {error && <p role="alert">{error}</p>}
    </section>
    <PrefectureMap category="memories" counts={counts} onSelect={setRegion}/>
    <section className={styles.card} aria-labelledby="memory-album-title">
      <h2 id="memory-album-title">{region || "全国"}の思い出</h2>
      {region && <button type="button" onClick={() => setRegion("")}>全国の写真を見る</button>}
      {memories && !visible.length && <p>表示できる思い出はまだありません。</p>}
      <div className={styles.album}>
        {visible.map(memory => <article key={memory.id}>
          <MemoryPhoto photo={memory.photo} place={memory.place}/>
          <h3>{memory.place}</h3>
          <p>{memory.prefecture} · <time dateTime={memory.date}>{memory.date}</time></p>
          <button type="button" disabled={busy} onClick={() => void remove(memory)}>削除</button>
        </article>)}
      </div>
    </section>
  </main>;
}
