
/**
 * Booking Types Module
 * 
 * Defines TypeScript types related to bookings
 */

/**
 * Booking creation parameters
 */
export interface BookingCreateParams {
  /** ID of the selected barber */
  barber_id: string;
  /** ID of the selected service */
  service_id: string;
  /** Booking date in 'YYYY-MM-DD' format */
  booking_date: string;
  /** Booking time in 'HH:MM' format */
  booking_time: string;
  /** Optional notes for the booking */
  notes?: string;
  /** Flag indicating if this is a guest booking */
  guest_booking?: boolean;
  /** Guest name for guest bookings */
  guest_name?: string;
  /** Guest phone for guest bookings */
  guest_phone?: string;
  /** Guest email for guest bookings */
  guest_email?: string;
}

/**
 * Booking update parameters
 */
export interface BookingUpdateParams {
  /** Booking date in 'YYYY-MM-DD' format */
  booking_date?: string;
  /** Booking time in 'HH:MM' format */
  booking_time?: string;
  /** Status of the booking (confirmed, cancelled, etc.) */
  status?: string;
  /** Notes for the booking */
  notes?: string;
  /** ID of the barber */
  barber_id?: string;
  /** ID of the service */
  service_id?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  /** Current page (0-based) */
  page: number;
  /** Number of items per page */
  pageSize: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  /** Array of items */
  data: T[];
  /** Total count of items */
  totalCount: number;
  /** Current page (0-based) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
}
