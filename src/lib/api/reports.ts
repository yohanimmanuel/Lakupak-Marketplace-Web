import "server-only";

import { restMutate } from "@/lib/api/graphql";

export type DistributorReportInput = {
  distributorId: number;
  reasonCode: string;
  reasonText: string;
  reasonDetail?: string;
  imageUrls: string[];
};

export async function submitDistributorReport(params: {
  token: string;
  input: DistributorReportInput;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await restMutate<unknown>("/api/mobile/reports/distributor", {
    method: "POST",
    token: params.token,
    body: params.input,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true };
}
