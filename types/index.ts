export type UserRole = "admin" | "employee";

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export interface OfficeSettings {
  id: number;
  latitude: number;
  longitude: number;
  radius: number;
  updated_at: string;
}

export interface Attendance {
  id: number;
  user_id: string;
  attendance_date: string;
  marked_at: string;
  latitude: number | null;
  longitude: number | null;
}

export interface AttendanceWithProfile extends Attendance {
  profiles: Pick<Profile, "name" | "role"> | null;
}

export interface CommunityEvent {
  id: number;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  created_by: string;
  created_at: string;
  profiles?: Pick<Profile, "name"> | null;
}

export interface DiscussionPost {
  id: number;
  event_id: number;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Pick<Profile, "name"> | null;
}

export interface ItineraryItem {
  id: number;
  event_id: number;
  title: string;
  description: string | null;
  suggested_by: string;
  created_at: string;
  profiles?: Pick<Profile, "name"> | null;
}

export interface Poll {
  id: number;
  event_id: number;
  question: string;
  created_by: string;
  created_at: string;
  poll_options?: PollOption[];
  user_vote_option_id?: number;
}

export interface PollOption {
  id: number;
  poll_id: number;
  option_text: string;
  vote_count?: number;
}

export interface EventPayment {
  id: number;
  event_id: number;
  title: string;
  amount: number | null;
  payment_link: string | null;
  payment_qr_url: string | null;
  created_by: string;
  created_at: string;
  confirmation_count?: number;
  user_confirmed?: boolean;
}

export interface ChatMessage {
  id: number;
  event_id: number;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: Pick<Profile, "name"> | null;
}

export interface EventDetailData {
  event: CommunityEvent;
  posts: DiscussionPost[];
  itinerary: ItineraryItem[];
  polls: Poll[];
  payments: EventPayment[];
  messages: ChatMessage[];
}

export interface DirectMessage {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export interface MessageThreadPartner {
  user_id: string;
  name: string;
  role: UserRole;
  last_message: string;
  last_message_at: string;
}

export interface SnackSession {
  id: number;
  title: string;
  organizer_id: string;
  payment_link: string | null;
  payment_qr_url: string | null;
  amount_per_person: number | null;
  payment_note: string | null;
  is_open: boolean;
  created_at: string;
  profiles?: Pick<Profile, "name"> | null;
  order_count?: number;
}

export interface SnackOrder {
  id: number;
  session_id: number;
  user_id: string;
  order_text: string;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, "name"> | null;
  paid?: boolean;
}

export interface SnackSessionDetail {
  session: SnackSession;
  orders: SnackOrder[];
  myOrder: SnackOrder | null;
  myPaid: boolean;
  isOrganizer: boolean;
}
