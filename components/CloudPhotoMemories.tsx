"use client";

import {createClient, type Session, type SupabaseClient} from "@supabase/supabase-js";
import {useEffect, useState, type FormEvent} from "react";
import {prefectureOrder} from "../lib/guide-categories";
import {prepareMemoryPhoto} from "../lib/photo-memories";
import PrefectureMap from "./PrefectureMap";
import styles from "./PhotoMemories.module.css";

type Memory = {
  id: string;
  prefecture: string;
  place: string;
  taken_on: string;
  photoUrl: string | null;
};

type Location = {initialPrefecture: string; initialPlace: string};

function Album({session, initialPrefecture, initialPlace}: Location & {session: Session}) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [region, setRegion] = useState("");
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<FormData | null>(null);
  const [listError, setListError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const token = session.access_token;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const rows: Memory[] = [];
      let offset: number | null = 0;
      while (offset !== null) {
        const result: Response = await fetch("/api/memories?offset=" + offset, {
          headers: {Authorization: "Bearer " + token}, signal: controller.signal,
        });
        const page: {memories: Memory[]; nextOffset: number | null; error?: string} = await result.json();
        if (!result.ok) throw new Error(page.error);
        rows.push(...page.memories);
        offset = page.nextOffset;
      }
      if (!controller.signal.aborted) {
        setMemories(rows);
        setListError("");
      }
    }
    void load().catch(error => {
      if (!controller.signal.aborted) setListError(error.message || "思い出を読み込めませんでした。");
    });
    return () => controller.abort();
  }, [token, revision]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = pending ?? new FormData(form);
    setBusy(true);
    setSaveMessage("");
    try {
      if (!pending) {
        const file = data.get("photo");
        if (!(file instanceof File) || !file.size) throw new Error("写真を選んでください。");
        const photo = await prepareMemoryPhoto(file);
        data.set("photo", photo, "memory.jpg");
        data.set("id", crypto.randomUUID());
        setPending(data);
      }
      const result = await fetch("/api/memories", {
        method: "POST", headers: {Authorization: "Bearer " + token}, body: data,
      });
      if ([400, 409, 413].includes(result.status)) setPending(null);
      const body = await result.json();
      if (!result.ok) throw new Error(body.error);
      setPending(null);
      form.reset();
      setRegion(String(data.get("prefecture")));
      setRevision(value => value + 1);
      setSaveMessage("クラウドに保存しました。");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "保存できませんでした。");
    } finally {
      setBusy(false);
    }
  }

  const counts: Record<string, number> = {};
  for (const memory of memories) counts[memory.prefecture] = (counts[memory.prefecture] ?? 0) + 1;

  return <>
    <section className={styles.card}>
      <h2>クラウドに思い出を登録</h2>
      <form onSubmit={save} noValidate={Boolean(pending)}>
        <fieldset className={styles.form} disabled={busy || Boolean(pending)}>
          <label>都道府県<select name="prefecture" required defaultValue={initialPrefecture}>
            <option value="">選択してください</option>
            {prefectureOrder.map(name => <option key={name}>{name}</option>)}
          </select></label>
          <label>場所・施設名<input name="place" required maxLength={120} defaultValue={initialPlace}/></label>
          <label>撮影日<input name="date" type="date" required/></label>
          <label>写真<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required/></label>
        </fieldset>
        <button type="submit" disabled={busy}>{busy ? "保存中…" : pending ? "同じ登録を再試行" : "写真を保存"}</button>
      </form>
      <p role="status">{saveMessage}</p>
    </section>
    <PrefectureMap category="memories" counts={counts} onSelect={setRegion}/>
    <section className={styles.card} aria-labelledby="memory-album-title">
      <h2 id="memory-album-title">{region || "全国"}の思い出</h2>
      {region && <button type="button" onClick={() => setRegion("")}>全国の写真を見る</button>}
      <button type="button" onClick={() => setRevision(value => value + 1)}>写真を再読み込み</button>
      {listError && <p role="alert">{listError}</p>}
      <div className={styles.album}>
        {memories.filter(memory => !region || memory.prefecture === region).map(memory => <article key={memory.id}>
          {memory.photoUrl && <img src={memory.photoUrl} referrerPolicy="no-referrer" alt={memory.place + "の思い出写真"}/>}
          <h3>{memory.place}</h3>
          <p>{memory.prefecture} · <time dateTime={memory.taken_on}>{memory.taken_on}</time></p>
        </article>)}
      </div>
    </section>
  </>;
}

export default function CloudPhotoMemories({url, publishableKey, localHref, ...location}: Location & {
  url: string; publishableKey: string; localHref: string;
}) {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const authClient = createClient(url, publishableKey);
    setClient(authClient);
    const {data: {subscription}} = authClient.auth.onAuthStateChange((_event, current) => {
      setSession(current);
      setReady(true);
    });
    return () => subscription.unsubscribe();
  }, [url, publishableKey]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const {error} = await client.auth.signInWithPassword({
        email: String(form.get("email")), password: String(form.get("password")),
      });
      if (error) setError("ログインできませんでした。メールアドレスとパスワードを確認してください。");
    } catch {
      setError("ログイン先に接続できませんでした。");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!client || busy) return;
    setBusy(true);
    setError("");
    try {
      const {error} = await client.auth.signOut({scope: "local"});
      if (error) setError("ログアウトできませんでした。再試行してください。");
    } finally {
      setBusy(false);
    }
  }

  return <main className={styles.page}>
    <a href={localHref}>← この端末の思い出に戻る</a>
    <h1>思い出マップ・クラウド保存</h1>
    {error && <p role="alert">{error}</p>}
    {!ready ? <p role="status">ログイン状態を確認中…</p> : session ? <>
      <button type="button" disabled={busy} onClick={() => void signOut()}>ログアウト</button>
      <Album key={session.user.id} session={session} {...location}/>
    </> : <form method="post" className={styles.form} onSubmit={signIn}>
      <label>メールアドレス<input name="email" type="email" autoComplete="username" required/></label>
      <label>パスワード<input name="password" type="password" autoComplete="current-password" required/></label>
      <button type="submit" disabled={busy}>ログイン</button>
    </form>}
  </main>;
}
