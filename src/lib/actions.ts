"use server";

import {
  checkInAppointment,
  createDelivery,
  createGuest,
  createInterview,
  createWalkIn,
  createWork,
  markNoticesRead,
  notifyHost,
  readSnapshot,
  resetDemo,
  updateVisitStatus,
} from "@/lib/store";
import type {
  ActionResult,
  DeliveryInput,
  GuestInput,
  InterviewInput,
  Snapshot,
  Visit,
  VisitStatus,
  WalkInInput,
  WorkInput,
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

export async function guestAction(input: GuestInput): Promise<ActionResult> {
  return asResult(await createGuest(input));
}

export async function interviewAction(
  input: InterviewInput,
): Promise<ActionResult> {
  return asResult(await createInterview(input));
}

export async function deliveryAction(input: DeliveryInput): Promise<ActionResult> {
  return asResult(await createDelivery(input));
}

export async function workAction(input: WorkInput): Promise<ActionResult> {
  return asResult(await createWork(input));
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

export async function markReadAction(hostId: string): Promise<Snapshot> {
  return markNoticesRead(hostId);
}
