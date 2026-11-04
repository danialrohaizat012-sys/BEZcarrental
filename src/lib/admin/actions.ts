"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasLocale } from "../i18n/config";
import { ADMIN_COOKIE, checkCredentials, createSessionToken, sessionCookieOptions } from "./auth";

export type LoginState = { error: "invalid" | null };

export async function loginAction(_: LoginState, form: FormData): Promise<LoginState> {
  const lang = String(form.get("lang"));
  const email = String(form.get("email") ?? "").slice(0, 200);
  const password = String(form.get("password") ?? "").slice(0, 200);
  if (!checkCredentials(email, password)) {
    await new Promise((r) => setTimeout(r, 400)); // slow down guessing
    return { error: "invalid" };
  }
  (await cookies()).set(ADMIN_COOKIE, createSessionToken(email.trim().toLowerCase()), sessionCookieOptions);
  redirect(`/${hasLocale(lang) ? lang : "ms"}/admin`);
}

export async function logoutAction(form: FormData) {
  const lang = String(form.get("lang"));
  (await cookies()).delete(ADMIN_COOKIE);
  redirect(`/${hasLocale(lang) ? lang : "ms"}/admin/login`);
}
