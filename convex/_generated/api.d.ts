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
import type * as analytics from "../analytics.js";
import type * as characters from "../characters.js";
import type * as chat_llmAction from "../chat/llmAction.js";
import type * as chat_llmAction_helpers from "../chat/llmAction_helpers.js";
import type * as chat_messages from "../chat/messages.js";
import type * as chat_sessions from "../chat/sessions.js";
import type * as knowledge from "../knowledge.js";
import type * as marketplace from "../marketplace.js";
import type * as media_jobs from "../media/jobs.js";
import type * as media_siliconflow from "../media/siliconflow.js";
import type * as playground from "../playground.js";
import type * as providerSettings from "../providerSettings.js";
import type * as publicChat_agentInfo from "../publicChat/agentInfo.js";
import type * as publicChat_llmAction from "../publicChat/llmAction.js";
import type * as publicChat_llmHelpers from "../publicChat/llmHelpers.js";
import type * as publicChat_sessions from "../publicChat/sessions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agents: typeof agents;
  analytics: typeof analytics;
  characters: typeof characters;
  "chat/llmAction": typeof chat_llmAction;
  "chat/llmAction_helpers": typeof chat_llmAction_helpers;
  "chat/messages": typeof chat_messages;
  "chat/sessions": typeof chat_sessions;
  knowledge: typeof knowledge;
  marketplace: typeof marketplace;
  "media/jobs": typeof media_jobs;
  "media/siliconflow": typeof media_siliconflow;
  playground: typeof playground;
  providerSettings: typeof providerSettings;
  "publicChat/agentInfo": typeof publicChat_agentInfo;
  "publicChat/llmAction": typeof publicChat_llmAction;
  "publicChat/llmHelpers": typeof publicChat_llmHelpers;
  "publicChat/sessions": typeof publicChat_sessions;
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
