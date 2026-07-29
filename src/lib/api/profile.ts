import "server-only";

import { graphqlMutate, graphqlRequest, type MutationResult } from "@/lib/api/graphql";
import type { UserProfile } from "@/lib/api/types";

const PROFILE_FIELDS = `
  id
  username
  name
  storeName
  email
  bio
  phone
  image
  bannerImage
  chosenAddress
  country
  createdAt
  updatedAt
`;

const PROFILE_QUERY = `
  query WebMarketplaceUser($userId: Int!) {
    marketplaceUser(userId: $userId) { ${PROFILE_FIELDS} }
  }
`;

const UPDATE_PROFILE = `
  mutation WebUpdateMarketplaceUser($userId: Int!, $input: UpdateMarketplaceUserInput!) {
    updateMarketplaceUser(userId: $userId, input: $input) { ${PROFILE_FIELDS} }
  }
`;

export async function getProfile(params: {
  userId: number;
  token: string;
}): Promise<UserProfile | null> {
  try {
    const data = await graphqlRequest<{ marketplaceUser: UserProfile }>(
      PROFILE_QUERY,
      { userId: params.userId },
      { token: params.token },
    );
    return data.marketplaceUser ?? null;
  } catch {
    return null;
  }
}

export type ProfileInput = Partial<
  Pick<
    UserProfile,
    | "username"
    | "name"
    | "storeName"
    | "email"
    | "bio"
    | "phone"
    | "image"
    | "chosenAddress"
    | "country"
  >
>;

/** Only the keys present in `input` are written, so partial saves are safe. */
export async function updateProfile(params: {
  userId: number;
  token: string;
  input: ProfileInput;
}): Promise<MutationResult<{ updateMarketplaceUser: UserProfile }>> {
  return graphqlMutate(
    UPDATE_PROFILE,
    { userId: params.userId, input: params.input },
    params.token,
  );
}
