import type { KVNamespace } from "@edgeone/ef-types";

export type Bindings = {
  DATABASE: KVNamespace;
  FULL_URL: string;
  PAGE_URL: string;
  Protocol: string;
  EDIT_LEN: string;
  EDIT_SUB: string;
  AUTH_USE: string;
  AUTH_USER: string;
  AUTH_PASS: string;
  PASS_KEY: string;
  TOKEN: string;
};