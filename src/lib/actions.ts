"use server";

import {
  checkInAppointment,
  createDelivery,
  createWalkIn,
  notifyHost,
  readSnapshot,
  resetDemo,
  updateVisitStatus,
} from "@/lib/store";
import type {
  ActionResult,
  DeliveryInput,
  Snapshot,
  Visit,
  VisitStatus,
  WalkInInput,
} from "@/lib/types";

function asResult(
  outcome: { snapshot: Snapshot; visit: Visit } | { message: string },
): ActionResult {
  if ("message" in outcome) return { ok: false, message: outcome.message };
  return { ok: true, snapshot: outcome.snapshot, visit: outcome.visit };
}

export async function getSnapshot(): Promise<Snapshot> {
  return readSnapshot();
}

export async function checkInAction(visitId: string): Promise<ActionResult> {
  return asResult(await checkInAppointment(visitId));
}

export async function walkInAction(input: WalkInInput): Promise<ActionResult> {
  return asResult(await createWalkIn(input));
}

export async function deliveryAction(input: DeliveryInput): Promise<ActionResult> {
  return asResult(await createDelivery(input));
}

export async function statusAction(
  visitId: string,
  status: VisitStatus,
): Promise<ActionResult> {
  return asResult(await updateVisitStatus(visitId, status));
}

export async function notifyAction(visitId: string): Promise<ActionResult> {
  return asResult(await notifyHost(visitId));
}

export async function resetDemoAction(): Promise<Snapshot> {
  return resetDemo();
}
