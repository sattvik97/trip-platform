import { getToken } from "../auth";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export interface TripImage {
  id: string;
  trip_id: string;
  image_url: string;
  position: number;
  created_at: string;
}

export interface TripImageListResponse {
  images: TripImage[];
}

export async function getTripImages(tripId: string): Promise<TripImage[]> {
  const response = await fetch(
    `${apiBaseUrl}/api/v1/trips/${tripId}/images`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch trip images: ${response.statusText}`);
  }

  const data: TripImageListResponse = await response.json();
  return data.images;
}

export async function uploadTripImage(
  tripId: string,
  file: File
): Promise<TripImage> {
  const token = getToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${apiBaseUrl}/api/v1/trips/${tripId}/images`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `Failed to upload image: ${response.statusText}`
    );
  }

  return await response.json();
}

export async function deleteTripImage(
  tripId: string,
  imageId: string
): Promise<void> {
  const token = getToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${apiBaseUrl}/api/v1/trips/${tripId}/images/${imageId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `Failed to delete image: ${response.statusText}`
    );
  }
}

export async function reorderTripImages(
  tripId: string,
  imageIds: string[]
): Promise<TripImage[]> {
  const token = getToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${apiBaseUrl}/api/v1/trips/${tripId}/images/reorder`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image_ids: imageIds }),
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `Failed to reorder images: ${response.statusText}`
    );
  }

  const data: TripImageListResponse = await response.json();
  return data.images;
}

