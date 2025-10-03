import { getServerSession } from "next-auth";
import { upsertTalentProfile } from "@/server/mock-store";

export async function POST() {
  const session = await getServerSession();
  if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });
  const uid = String(session.user.email);
  const profile = upsertTalentProfile(uid, { status: "COMPLETE", completedAt: new Date() });
  return Response.json({ ok: true, profile });
}


