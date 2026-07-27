import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/auth/guards";
import { NotificationsPage } from "@/pages/Notifications";

// Where the "Notification settings" link in every collaboration email lands.
// Guarded like the rest of /account: the link is in mail, so following it from a
// signed-out browser bounces through sign-in first.
//
// The file is named account_.notifications so the trailing underscore opts this
// route out of nesting under /account. /account is a leaf page, not a layout —
// it renders no <Outlet/> — so nesting here would render the account overview
// instead of this page.
export const Route = createFileRoute("/account_/notifications")({
  ssr: false,
  beforeLoad: () => requireAuth(),
  component: NotificationsPage,
});
