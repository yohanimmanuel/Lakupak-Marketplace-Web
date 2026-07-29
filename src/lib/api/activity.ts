import "server-only";

import { graphqlMutate, graphqlRequest, type MutationResult } from "@/lib/api/graphql";
import type { ActivityType, MarketplaceProduct, UserActivity } from "@/lib/api/types";

const ACTIVITY_QUERY = `
  query WebUserActivity($userId: Int!, $type: ActivityType!) {
    mobileUserActivity(userId: $userId, type: $type) {
      success
      activities {
        id
        productId
        productData
        activityType
        createdAt
        updatedAt
      }
    }
  }
`;

const ADD_ACTIVITY = `
  mutation WebAddUserActivity($input: AddUserActivityInput!) {
    addUserActivity(input: $input) {
      success
      action
    }
  }
`;

const DELETE_ACTIVITY = `
  mutation WebDeleteUserActivity($userId: Int!, $productId: String!, $type: ActivityType!) {
    deleteUserActivity(userId: $userId, productId: $productId, type: $type) {
      success
      deletedCount
    }
  }
`;

/**
 * Activities carry the product snapshot the client stored at the time, so these
 * lists render without a second catalog round-trip.
 */
export async function getUserActivity(params: {
  userId: number;
  token: string;
  type: ActivityType;
}): Promise<UserActivity[]> {
  try {
    const data = await graphqlRequest<{
      mobileUserActivity: { activities: UserActivity[] };
    }>(ACTIVITY_QUERY, { userId: params.userId, type: params.type }, {
      token: params.token,
    });

    return (data.mobileUserActivity.activities ?? []).filter(
      (activity) => activity.productData?.id,
    );
  } catch {
    return [];
  }
}

export async function addUserActivity(params: {
  userId: number;
  token: string;
  product: MarketplaceProduct;
  type: ActivityType;
}): Promise<MutationResult<unknown>> {
  return graphqlMutate(
    ADD_ACTIVITY,
    {
      input: {
        userId: params.userId,
        productId: params.product.id,
        productData: params.product,
        activityType: params.type,
      },
    },
    params.token,
  );
}

export async function deleteUserActivity(params: {
  userId: number;
  token: string;
  productId: string;
  type: ActivityType;
}): Promise<MutationResult<unknown>> {
  return graphqlMutate(
    DELETE_ACTIVITY,
    { userId: params.userId, productId: params.productId, type: params.type },
    params.token,
  );
}

export async function getFavoriteIds(params: {
  userId: number;
  token: string;
}): Promise<Set<string>> {
  const favorites = await getUserActivity({ ...params, type: "favorite" });
  return new Set(favorites.map((activity) => activity.productId));
}
