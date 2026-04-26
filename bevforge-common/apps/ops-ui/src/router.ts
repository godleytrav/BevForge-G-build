import {
  Link as RouterLink,
  Navigate as RouterNavigate,
  useNavigate as useRouterNavigate,
  useParams as useRouterParams,
} from "react-router-dom";

// Export standard React Router components
export const Link = RouterLink;
export const Navigate = RouterNavigate;

// Export hooks
export const useNavigate = useRouterNavigate;
export const useParams = useRouterParams;

// Types for type-safe navigation
export type Path =
  | "/"
  | "/os"
  | "/flow"
  | "/lab"
  | "/ops"
  | "/connect"
  | "/connect/inbox"
  | "/connect/messages"
  | "/connect/employees"
  | "/connect/tasks"
  | "/connect/campaigns"
  | "/connect/timesheets"
  | "/connect/accounts"
  | "/connect/contacts"
  | "/connect/threads"
  | "/reports"
  | "/settings";

export type Params = Record<string, string | undefined>;
