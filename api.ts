const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export interface CarrierQuote {
  name: string;
  code: string;
  price: number;
  stops: number;
  duration_min: number | null;
  departure_time: string | null;
  arrival_time: string | null;
  booking_url: string;
}

export interface MLPrediction {
  origin: string;
  destination: string;
  route_code: string;
  base_fare: number;
  predicted_price_1h: number;
  predicted_price_24h: number;
  predicted_price_7d: number;
  confidence_corridors: Record<"1h" | "24h" | "7d", { lower: number; upper: number }>;
  holiday_impact_factor: string;
  holiday_impact_pct: number;
  festival_name: string | null;
  recommendation: string;
  advice_text: string;
  status_badge: string;
  generated_at: string;
  live_carrier_quotes: CarrierQuote[];
  departure_date: string;
  google_flights_url: string;
}

export interface ResolvedRoute {
  origin: string;
  destination: string;
  origin_city: string;
  destination_city: string;
}

export interface IndexPoint {
  calculation_date: string;
  jevons_index_value: number;
  avg_base_fare: number;
  sample_count: number;
}

export interface ChatResponse {
  markdown_advice: string;
  status_badge: string;
  recommendation: string;
  suggested_queries: string[];
  carrier_links: CarrierQuote[];
}

/** One-way Google Flights results for a route/date, optionally scoped to a carrier. */
export function buildGoogleFlightsUrl(origin: string, destination: string, date: string, airline?: string): string {
  const q = `One way flights from ${origin.toUpperCase()} to ${destination.toUpperCase()} on ${date}${airline ? ` on ${airline}` : ""}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}&curr=INR&hl=en&tt=o`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, init);
  } catch {
    throw new ApiError("Cannot reach the NAPIER backend.", 0, "NETWORK");
  }
  if (!res.ok) {
    let message = `Request failed (HTTP ${res.status})`;
    let code: string | undefined;
    try {
      const detail = (await res.json())?.detail;
      if (typeof detail === "string") message = detail;
      else if (detail?.message) {
        message = detail.message;
        code = detail.code;
      }
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(message, res.status, code);
  }
  return (await res.json()) as T;
}

export const resolveRoute = (q: string) => request<ResolvedRoute>(`/api/v1/resolve?q=${encodeURIComponent(q)}`);

export const fetchRoutePrediction = (origin: string, destination: string, date: string) =>
  request<MLPrediction>(`/api/v1/predict/${origin}/${destination}?date=${encodeURIComponent(date)}`);

export const fetchIndexTrends = (route: string, leadTime: number) =>
  request<{ data: IndexPoint[]; total_datapoints: number }>(
    `/api/v1/index-trends?route=${encodeURIComponent(route)}&lead_time=${leadTime}`
  );

export const sendChatMessage = (message: string, origin: string, destination: string, date: string) =>
  request<ChatResponse>(`/api/v1/assistant/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, origin, destination, date }),
  });
