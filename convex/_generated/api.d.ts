/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agents from "../agents.js";
import type * as chat_llmAction from "../chat/llmAction.js";
import type * as chat_llmAction_helpers from "../chat/llmAction_helpers.js";
import type * as chat_messages from "../chat/messages.js";
import type * as chat_sessions from "../chat/sessions.js";
import type * as marketplace from "../marketplace.js";
import type * as media_jobs from "../media/jobs.js";
import type * as media_siliconflow from "../media/siliconflow.js";
import type * as providerSettings from "../providerSettings.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agents: typeof agents;
  "chat/llmAction": typeof chat_llmAction;
  "chat/llmAction_helpers": typeof chat_llmAction_helpers;
  "chat/messages": typeof chat_messages;
  "chat/sessions": typeof chat_sessions;
  marketplace: typeof marketplace;
  "media/jobs": typeof media_jobs;
  "media/siliconflow": typeof media_siliconflow;
  providerSettings: typeof providerSettings;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
