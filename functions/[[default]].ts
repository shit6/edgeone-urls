import { app } from "../src/cfapp";
import { scheduled } from "../src/index";
import type { Bindings } from "../src/types";

export async function onRequest(context: {
  request: Request;
  env: Bindings;
  params: Record<string, string>;
}) {
  // 绑定EdgeOne KV存储（控制台需绑定名为KV_DATABASE的实例）
  context.env.DATABASE = context.env.KV_DATABASE;

  // 处理定时任务（原Cloudflare Scheduled函数）
  if (new URL(context.request.url).pathname === "/__scheduled") {
    await scheduled(context.env);
    return new Response("定时任务执行成功", { status: 200 });
  }

  // 转发请求到原Hono应用
  return app.fetch(context.request, context.env);
}