// Query keys shared by more than one hook. Keys used by a single hook stay
// local to it; these are here so an invalidation in one place is guaranteed to
// hit the query another place reads (the shell's invite badge vs. the projects
// hub's invite list).
export const MY_INVITES_KEY = ["myInvites"] as const;

// Read by the notifications settings page and written back by every toggle.
export const NOTIFICATION_PREFERENCES_KEY = ["notificationPreferences"] as const;
