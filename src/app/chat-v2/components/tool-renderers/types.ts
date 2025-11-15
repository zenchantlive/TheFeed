import type { RenderFunctionStatus } from "@copilotkit/react-core";
import type { HoursType } from "@/lib/schema";

export type CopilotRenderProps<TResult> = {
  status: RenderFunctionStatus;
  args: Record<string, unknown>;
  result?: TResult;
};

export type SearchEventResult = {
  id: string;
  title: string;
  description: string;
  eventType: string;
  distanceMiles: number | null;
  startsAt: string;
  location: string;
  isVerified: boolean;
};

export type SearchResourceResult = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceMiles: number | null;
  isOpen: boolean;
  phone?: string | null;
  website?: string | null;
  services?: string[];
  hours?: HoursType | string | null;
};

export type SearchPostResult = {
  id: string;
  content: string;
  kind: string;
  distanceMiles: number | null;
  location?: string | null;
  createdAt: string;
};

export type UserContextSavedLocation = {
  id: string;
  foodBankId: string;
  label: string | null;
  lat: number | null;
  lng: number | null;
};

export type UserContextResult = {
  hasProfile: boolean;
  preferredRadiusMiles: number | null;
  savedLocations: UserContextSavedLocation[];
};

export type ResourceDetailsResult = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string | null;
  website?: string | null;
  services?: string[];
  hours?: HoursType | string | null;
};

export type ResourceDetailsResponse =
  | ResourceDetailsResult
  | { error: string };

export type DirectionsResult = {
  url: string;
};
