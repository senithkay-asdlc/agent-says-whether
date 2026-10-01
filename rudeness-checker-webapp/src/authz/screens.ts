/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Adapted from thunder-authentication's screens.example.ts pattern.
//
// THIS IS THE ONLY FILE THAT KNOWS ABOUT SCREENS. Both of this app's screens
// are `loads: null` — not by choice, but because there is nothing else they
// COULD be: rudeness-checker-agent is an `ai-agent` dependency reached
// through the fixed chat contract (api.ts), not an openapi.yaml, so
// `npm run gen` finds no REST contract anywhere in this project and
// OperationKey is the empty union (`never`). The catalog's one handle,
// `sentences:check`, has no operation to attach to and so gates nothing here
// — the design's whole gate for this app is sign-in itself (security.json's
// one role, one grant, and the issue's "Sign-in is enforced ... before any
// screen is usable"). `<RequireOperation>` is therefore never used; every
// signed-in caller reaches both screens.
//
// THE ORDER OF THIS TABLE IS THE RAIL'S ORDER, and its first reachable row is
// the screen the app lands on — CheckSentence, per wireframes.dsl's one flow.

import type { OperationKey } from "./operations.gen";

export interface ScreenRoute {
  /** A stable id the App maps to a page component. */
  readonly key: string;
  /** The wireframe's screen name, for the rail and the Forbidden copy. */
  readonly label: string;
  readonly path: string;
  /**
   * The operation this screen exists to perform. `null` here because this
   * app's one dependency carries no REST contract at all — see the file
   * comment above.
   */
  readonly loads: OperationKey | null;
  /**
   * In a flow with no `role` line: reachable before sign-in. Not used here —
   * wireframes.dsl's one flow carries `role "User"`, so both screens sit
   * behind the sign-in gate.
   */
  readonly public?: boolean;
}

export const SCREEN_ROUTES: readonly ScreenRoute[] = [
  { key: "check-sentence", label: "Check a sentence", path: "/check", loads: null },
  { key: "verdict-result", label: "Result", path: "/result", loads: null },
];

/**
 * The screens a caller can actually open, in rail order. Every row here is
 * `loads: null`, so this resolves to "both screens" for any signed-in caller
 * and "neither" for a visitor — reachability is exactly sign-in, which is
 * this app's whole gate.
 */
export function reachableScreens(
  _scopes: ReadonlySet<string>,
  signedIn: boolean,
): readonly ScreenRoute[] {
  return signedIn ? SCREEN_ROUTES : [];
}
