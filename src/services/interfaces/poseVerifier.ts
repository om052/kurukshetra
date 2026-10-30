/**
 * Modular pose-verification interface.
 * A future MediaPipe Pose Landmarker integration implements this contract;
 * until connected, workout sessions run in clearly-labelled "Demo Workout Mode".
 */

export type VerificationStatus =
  | "not-connected"
  | "connecting"
  | "active"
  | "error";

export interface PoseVerifier {
  readonly status: VerificationStatus;
  /** Given camera frames, decide whether the current rep counts. Not implemented yet. */
  countRep(
    videoFrame: unknown,
  ): Promise<{ counted: boolean; confidence: number }>;
}

export const noOpVerifier: PoseVerifier = {
  status: "not-connected",
  async countRep() {
    return { counted: false, confidence: 0 };
  },
};
