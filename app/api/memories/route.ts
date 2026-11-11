import {createClient} from "@supabase/supabase-js";
import {NextResponse} from "next/server";
import {prefectureOrder} from "../../../lib/guide-categories";

const bucket = "photo-memories";
const maxPhotoBytes = 4 * 1024 * 1024;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function response(body: object, status = 200) {
  return NextResponse.json(body, {status, headers: {"Cache-Control": "private, no-store"}});
}

async function authorize(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.SUPABASE_PHOTO_MEMORIES_SECRET_KEY;
  if (!url || !key || !secret) return {failure: response({error: "クラウド保存は準備中です。"}, 503)};

  const token = request.headers.get("authorization")?.match(/^Bearer (\S+)$/i)?.[1];
  if (!token) return {failure: response({error: "ログインが必要です。"}, 401)};

  const auth = {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false};
  const client = createClient(url, key, {auth, global: {headers: {Authorization: "Bearer " + token}}});
  const {data: {user}, error} = await client.auth.getUser(token);
  if (error || !user) return {failure: response({error: "ログインし直してください。"}, 401)};
  return {client, user, url, secret, auth};
}

export async function GET(request: Request) {
  const session = await authorize(request);
  if (session.failure) return session.failure;
  const offset = Number(new URL(request.url).searchParams.get("offset") ?? "0");
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 2_147_483_600) {
    return response({error: "表示範囲が無効です。"}, 400);
  }

  const {data, error} = await session.client.from("cloud_photo_memories")
    .select("id,prefecture,place,taken_on")
    .eq("account_id", session.user.id)
    .eq("ready", true)
    .order("taken_on", {ascending: false}).order("id")
    .range(offset, offset + 30);
  if (error) return response({error: "思い出を読み込めませんでした。"}, 503);
  const memories = data.slice(0, 30);
  if (!memories.length) return response({memories, nextOffset: null});

  const {data: photos, error: photoError} = await session.client.storage.from(bucket).createSignedUrls(
    memories.map(memory => session.user.id + "/" + memory.id + ".jpg"), 300,
  );
  if (photoError) return response({error: "写真を読み込めませんでした。"}, 503);
  return response({
    memories: memories.map((memory, index) => ({...memory, photoUrl: photos[index]?.signedUrl || null})),
    nextOffset: data.length > memories.length ? offset + memories.length : null,
  });
}

export async function POST(request: Request) {
  const session = await authorize(request);
  if (session.failure) return session.failure;
  const contentLength = Number(request.headers.get("content-length"));
  if (contentLength > maxPhotoBytes + 16_384) return response({error: "写真は4MBまでです。"}, 413);

  const form = await request.formData().catch(() => null);
  const id = form?.get("id");
  const prefecture = form?.get("prefecture");
  const place = form?.get("place");
  const date = form?.get("date");
  const photo = form?.get("photo");
  if (typeof id !== "string" || !uuid.test(id) ||
      typeof prefecture !== "string" || !prefectureOrder.includes(prefecture) ||
      typeof place !== "string" || !place.trim() || place.length > 120 ||
      typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !(photo instanceof File) || photo.type !== "image/jpeg" || photo.size > maxPhotoBytes) {
    return response({error: "登録内容または写真形式を確認してください。"}, 400);
  }
  const parsedDate = new Date(date);
  if (!Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date || date.startsWith("0000")) {
    return response({error: "撮影日を確認してください。"}, 400);
  }
  const signature = new Uint8Array(await photo.slice(0, 3).arrayBuffer());
  if (signature[0] !== 255 || signature[1] !== 216 || signature[2] !== 255) {
    return response({error: "JPEG写真を選んでください。"}, 400);
  }

  const account = session.user.id;
  const server = createClient(session.url, session.secret, {auth: session.auth});
  const {data: reserved, error: reserveError} = await server.rpc("reserve_cloud_photo_memory", {
    p_account_id: account, p_id: id, p_prefecture: prefecture, p_place: place.trim(), p_taken_on: date,
  });
  if (reserveError?.code === "23505") return response({error: "同じ登録IDが使われています。"}, 409);
  if (reserveError) return response({error: "登録枠を確保できませんでした。"}, 503);
  if (!reserved) return response({error: "無料プランは思い出3件までです。"}, 409);

  const storage = server.storage.from(bucket);
  const path = account + "/" + id + ".jpg";
  const {error: uploadError} = await storage.upload(path, photo, {contentType: "image/jpeg", upsert: false});
  if (uploadError) {
    // A previous attempt may have uploaded the file before its response was lost.
    const {data: existing, error: lookupError} = await storage.info(path);
    if (lookupError || !existing) return response({error: "写真を保存できませんでした。同じ登録を再試行してください。"}, 503);
  }
  const {data: ready, error: updateError} = await server.from("cloud_photo_memories")
    .update({ready: true}).eq("account_id", account).eq("id", id).select("id").maybeSingle();
  if (updateError || !ready) return response({error: "登録を確定できませんでした。同じ登録を再試行してください。"}, 503);
  return response({id});
}
