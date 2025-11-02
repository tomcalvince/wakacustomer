// Order related types

export interface Order {
  id: string
  order_number: string
  status: OrderStatus
  sender_name: string
  created_at: string
}

export type OrderDirection = "incoming" | "outgoing" | "all"

export type OrderStatus =
  | "pending"
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "at_agent_office"
  | "pending_agent_delivery"
  | "out_for_return"
  | "delivered"
  | "failed"
  | "cancelled"
  | "returned"
  | "all"

export interface Parcel {
  id: string
  parcel_name: string
  description: string
  weight: string
  estimated_weight: string
  size: string
  size_display: string
  package_type: string
  package_type_display: string
  declared_value: string
  cod: boolean
  cod_amount: string
  special_instructions: string
}

export interface Recipient {
  recipient_name: string
  recipient_phone: string
  recipient_id_number: string | null
  recipient_id_type: string | null
  delivery_instructions: string
  preferred_delivery_time: string | null
  alternative_contact: string | null
  is_verified: boolean
  verified_at: string | null
}

export interface OrderDetails {
  id: string
  order_number: string
  tracking_number: string
  status: OrderStatus
  status_display: string
  service_type: string
  service_type_display: string
  service_option: string
  service_option_display: string
  delivery_time: string
  delivery_time_display: string
  payment_status: string
  payment_status_display: string
  payment_method: string | null
  paid_at: string | null
  customer: string
  sender_name: string
  sender_phone: string
  pickup_address: string
  pickup_latitude: string
  pickup_longitude: string
  pickup_country: string
  origin_office_name: string
  origin_office_code: string
  delivery_address: string
  delivery_latitude: string
  delivery_longitude: string
  delivery_country: string
  destination_office_name: string
  destination_office_code: string
  parcels: Parcel[]
  recipient: Recipient
  base_fee: string
  distance_fee: string
  weight_fee: string
  service_fee: string
  total_fee: string
  created_at: string
  scheduled_delivery: string | null
  picked_up_at: string | null
  delivered_at: string | null
  special_instructions: string
  requires_signature: boolean
  requires_id_verification: boolean
}

export interface TrackingData {
  tracking_number: string
  order_number: string
  status: OrderStatus
  status_display: string
  pickup_address: string
  pickup_latitude: string
  pickup_longitude: string
  pickup_country: string
  delivery_address: string
  delivery_latitude: string
  delivery_longitude: string
  delivery_country: string
  current_rider_location: [number, number] | null
  created_at: string
  picked_up_at: string | null
  delivered_at: string | null
  estimated_delivery_time: string | null
}

export interface DirectionStep {
  step_number: number
  instruction: string
  distance: number
  duration: number
  coordinates: [number, number] // [lng, lat]
  road_name: string
  maneuver_type: string
  driving_side: string
}

export interface DirectionsResponse {
  total_distance: number
  total_duration: number
  directions: DirectionStep[]
  start_location: [number, number] // [lat, lng]
  end_location: [number, number] // [lat, lng]
  country: string
  route_quality: string
  estimated_fuel_cost: number
  toll_roads: string[]
}

