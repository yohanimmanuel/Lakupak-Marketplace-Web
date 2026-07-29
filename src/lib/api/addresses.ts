import "server-only";

import { graphqlMutate, graphqlRequest, type MutationResult } from "@/lib/api/graphql";

export type MarketplaceAddress = {
  id: number;
  userId: number;
  fullName?: string | null;
  phone?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geocodePrecision?: string | null;
  label?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AddressInput = {
  fullName: string;
  phone: string;
  address: string;
  label?: string;
  isDefault?: boolean;
};

const ADDRESS_FRAGMENT = `
  id
  userId
  fullName
  phone
  address
  latitude
  longitude
  geocodePrecision
  label
  isDefault
  createdAt
  updatedAt
`;

export async function listAddresses(params: {
  userId: number;
  token: string;
}): Promise<MarketplaceAddress[]> {
  try {
    const data = await graphqlRequest<{
      marketplaceAddresses: {
        success: boolean;
        addresses: MarketplaceAddress[];
      };
    }>(
      `query WebMarketplaceAddresses($userId: Int!) {
        marketplaceAddresses(userId: $userId) {
          success
          addresses { ${ADDRESS_FRAGMENT} }
        }
      }`,
      { userId: params.userId },
      { token: params.token },
    );
    if (!data.marketplaceAddresses.success) return [];
    return data.marketplaceAddresses.addresses ?? [];
  } catch {
    return [];
  }
}

export async function createAddress(params: {
  userId: number;
  token: string;
  input: AddressInput;
}): Promise<MutationResult<MarketplaceAddress>> {
  const result = await graphqlMutate<{
    createMarketplaceAddress: {
      success: boolean;
      message?: string;
      address?: MarketplaceAddress | null;
    };
  }>(
    `mutation WebCreateMarketplaceAddress($userId: Int!, $input: CreateMarketplaceAddressInput!) {
      createMarketplaceAddress(userId: $userId, input: $input) {
        success
        message
        address { ${ADDRESS_FRAGMENT} }
      }
    }`,
    { userId: params.userId, input: params.input },
    params.token,
  );
  if (!result.ok) return result;
  const payload = result.data.createMarketplaceAddress;
  if (!payload.success || !payload.address) {
    return {
      ok: false,
      status: 400,
      error: payload.message ?? "Failed to create address",
    };
  }
  return { ok: true, data: payload.address };
}

export async function updateAddress(params: {
  userId: number;
  token: string;
  addressId: number;
  input: Partial<AddressInput>;
}): Promise<MutationResult<MarketplaceAddress>> {
  const result = await graphqlMutate<{
    updateMarketplaceAddress: {
      success: boolean;
      message?: string;
      address?: MarketplaceAddress | null;
    };
  }>(
    `mutation WebUpdateMarketplaceAddress($userId: Int!, $addressId: Int!, $input: UpdateMarketplaceAddressInput!) {
      updateMarketplaceAddress(userId: $userId, addressId: $addressId, input: $input) {
        success
        message
        address { ${ADDRESS_FRAGMENT} }
      }
    }`,
    {
      userId: params.userId,
      addressId: params.addressId,
      input: params.input,
    },
    params.token,
  );
  if (!result.ok) return result;
  const payload = result.data.updateMarketplaceAddress;
  if (!payload.success || !payload.address) {
    return {
      ok: false,
      status: 400,
      error: payload.message ?? "Failed to update address",
    };
  }
  return { ok: true, data: payload.address };
}

export async function deleteAddress(params: {
  userId: number;
  token: string;
  addressId: number;
}): Promise<MutationResult<{ success: boolean }>> {
  const result = await graphqlMutate<{
    deleteMarketplaceAddress: {
      success: boolean;
      message?: string;
    };
  }>(
    `mutation WebDeleteMarketplaceAddress($userId: Int!, $addressId: Int!) {
      deleteMarketplaceAddress(userId: $userId, addressId: $addressId) {
        success
        message
      }
    }`,
    { userId: params.userId, addressId: params.addressId },
    params.token,
  );
  if (!result.ok) return result;
  const payload = result.data.deleteMarketplaceAddress;
  if (!payload.success) {
    return {
      ok: false,
      status: 400,
      error: payload.message ?? "Failed to delete address",
    };
  }
  return { ok: true, data: { success: true } };
}
