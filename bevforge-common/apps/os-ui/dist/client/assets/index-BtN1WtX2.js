const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/_404-Bwa15Arl.js","assets/vendor-Bhi5WPns.js","assets/preload-DNrUkv91.js","assets/vendor-DjDsNOP-.css"])))=>i.map(i=>d[i]);
import { _ as __vitePreload } from "./preload-DNrUkv91.js";
import { r as reactExports, j as jsxRuntimeExports, t as twMerge, c as clsx, S as Slot, a as cva, b as SubTrigger2, C as ChevronRight, d as SubContent2, P as Portal2, e as Content2, I as Item2, f as CheckboxItem2, g as ItemIndicator2, h as Check, R as RadioItem2, i as Circle, L as Label2, k as Separator2, l as Root2, T as Trigger, O as Overlay, m as Portal, n as Content, o as Close, X, p as Title, D as Description, q as Root, s as Trigger$1, u as useLocation, M as Menu, v as Link, B as Bell, w as Calendar, x as Settings, U as User, H as House, y as Users, z as CircleCheckBig, F as FileText, A as Cog, E as useNavigate, G as FlaskConical, J as Monitor, K as TriangleAlert, N as Activity, Q as Package, V as TrendingUp, W as LayoutGrid, Y as ArrowRight, Z as Gauge, _ as Plus, $ as Beer, a0 as CircleCheck, a1 as Clock, a2 as Beaker, a3 as Wheat, a4 as Hop, a5 as Apple, a6 as Wrench, a7 as Box, a8 as Checkbox$1, a9 as CheckboxIndicator, aa as Trigger$2, ab as Icon, ac as ChevronDown, ad as ScrollUpButton, ae as ChevronUp, af as ScrollDownButton, ag as Portal$1, ah as Content2$1, ai as Viewport, aj as Label$1, ak as Item, al as ItemIndicator, am as ItemText, an as Separator$1, ao as Root2$1, ap as Value, aq as useSearchParams, ar as startOfMonth, as as startOfWeek, at as endOfWeek, au as endOfMonth, av as eachDayOfInterval, aw as RefreshCw, ax as Search, ay as CalendarDays, az as format, aA as ChevronLeft, aB as subMonths, aC as addMonths, aD as isSameMonth, aE as isToday, aF as ChevronsRight, aG as ChevronsLeft, aH as List, aI as Trigger$3, aJ as Content$1, aK as Root2$2, aL as Root$1, aM as ArrowLeft, aN as MapPin, aO as DollarSign, aP as useParams, aQ as Root$2, aR as Root$3, aS as Viewport$1, aT as Corner, aU as ScrollAreaScrollbar, aV as ScrollAreaThumb, aW as Handle, aX as Position, aY as ReactFlowProvider, aZ as useReactFlow, a_ as useNodesState, a$ as useEdgesState, b0 as MarkerType, b1 as Upload, b2 as Download, b3 as Save, b4 as RotateCcw, b5 as index, b6 as Background, b7 as MiniMap, b8 as Controls, b9 as Copy, ba as Trash2, bb as PanelLeft, bc as RefreshCcw, bd as Play, be as Pause, bf as SkipForward, bg as CircleStop, bh as ArrowRightLeft, bi as Timer, bj as WandSparkles, bk as Clock3, bl as Root$4, bm as Thumb, bn as Grid3x3, bo as ZoomOut, bp as Maximize2, bq as ZoomIn, br as ExternalLink, bs as TrendingDown, bt as ArrowUpDown, bu as ArrowUp, bv as ArrowDown, bw as Filter, bx as createBrowserRouter, by as RouterProvider2, bz as Outlet, bA as QueryClient, bB as ReactDOM, bC as React, bD as QueryClientProvider } from "./vendor-Bhi5WPns.js";
const NotificationContext = reactExports.createContext(void 0);
function NotificationProvider({ children }) {
  const [notifications, setNotifications] = reactExports.useState([
    {
      id: "1",
      title: "Low Stock Alert",
      message: "Dark Night Stout is running low (300L remaining)",
      type: "warning",
      read: false,
      timestamp: new Date(Date.now() - 1e3 * 60 * 30)
      // 30 minutes ago
    },
    {
      id: "2",
      title: "Batch Complete",
      message: "BATCH-001 (Hoppy Trail IPA) has completed fermentation",
      type: "success",
      read: false,
      timestamp: new Date(Date.now() - 1e3 * 60 * 60 * 2)
      // 2 hours ago
    }
  ]);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const markAsRead = (id) => {
    setNotifications(
      (prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n)
    );
  };
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };
  const addNotification = (notification) => {
    const newNotification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
      timestamp: /* @__PURE__ */ new Date()
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    NotificationContext.Provider,
    {
      value: { notifications, unreadCount, markAsRead, markAllAsRead, addNotification },
      children
    }
  );
}
function useNotifications() {
  const context = reactExports.useContext(NotificationContext);
  if (context === void 0) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = reactExports.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Comp,
      {
        className: cn(buttonVariants({ variant, size, className })),
        ref,
        ...props
      }
    );
  }
);
Button.displayName = "Button";
const DropdownMenu = Root2;
const DropdownMenuTrigger = Trigger;
const DropdownMenuSubTrigger = reactExports.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  SubTrigger2,
  {
    ref,
    className: cn(
      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "ml-auto" })
    ]
  }
));
DropdownMenuSubTrigger.displayName = SubTrigger2.displayName;
const DropdownMenuSubContent = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  SubContent2,
  {
    ref,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
      className
    ),
    ...props
  }
));
DropdownMenuSubContent.displayName = SubContent2.displayName;
const DropdownMenuContent = reactExports.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(Portal2, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
  Content2,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
      className
    ),
    ...props
  }
) }));
DropdownMenuContent.displayName = Content2.displayName;
const DropdownMenuItem = reactExports.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Item2,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuItem.displayName = Item2.displayName;
const DropdownMenuCheckboxItem = reactExports.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  CheckboxItem2,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    checked,
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ItemIndicator2, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) }) }),
      children
    ]
  }
));
DropdownMenuCheckboxItem.displayName = CheckboxItem2.displayName;
const DropdownMenuRadioItem = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  RadioItem2,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ItemIndicator2, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Circle, { className: "h-2 w-2 fill-current" }) }) }),
      children
    ]
  }
));
DropdownMenuRadioItem.displayName = RadioItem2.displayName;
const DropdownMenuLabel = reactExports.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Label2,
  {
    ref,
    className: cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuLabel.displayName = Label2.displayName;
const DropdownMenuSeparator = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Separator2,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
DropdownMenuSeparator.displayName = Separator2.displayName;
const Sheet = Root;
const SheetTrigger = Trigger$1;
const SheetPortal = Portal;
const SheetOverlay = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Overlay,
  {
    className: cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props,
    ref
  }
));
SheetOverlay.displayName = Overlay.displayName;
const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
      }
    },
    defaultVariants: {
      side: "right"
    }
  }
);
const SheetContent = reactExports.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetPortal, { children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(SheetOverlay, {}),
  /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Content,
    {
      ref,
      className: cn(sheetVariants({ side }), className),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
SheetContent.displayName = Content.displayName;
const SheetHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "div",
  {
    className: cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    ),
    ...props
  }
);
SheetHeader.displayName = "SheetHeader";
const SheetTitle = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Title,
  {
    ref,
    className: cn("text-lg font-semibold text-foreground", className),
    ...props
  }
));
SheetTitle.displayName = Title.displayName;
const SheetDescription = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
SheetDescription.displayName = Description.displayName;
const suites$1 = [
  { id: "os", label: "OS", subtitle: "System Core & Home", route: "/os", icon: "⬡" },
  { id: "flow", label: "Flow", subtitle: "Keg / Tap Management", route: "/flow", icon: "◈" },
  { id: "lab", label: "Lab", subtitle: "Recipes & Brewing Science", route: "/lab", icon: "◆" },
  { id: "ops", label: "Ops", subtitle: "Business Operations", route: "/ops", icon: "◇" },
  { id: "connect", label: "Connect", subtitle: "Employee Hub", route: "/connect", icon: "◉" }
];
const globalLinks = [
  { label: "Dashboard Home", route: "/", icon: House },
  { label: "Calendar", route: "/calendar", icon: Calendar },
  { label: "Directory", route: "/directory", icon: Users },
  { label: "Tasks & Approvals", route: "/tasks", icon: CircleCheckBig },
  { label: "Reports", route: "/reports", icon: FileText },
  { label: "Settings", route: "/settings", icon: Cog }
];
function AppShell({
  children,
  pageTitle = "Dashboard",
  currentSuite,
  fullWidth = false
}) {
  const [drawerOpen, setDrawerOpen] = reactExports.useState(false);
  const location = useLocation();
  const { unreadCount } = useNotifications();
  const getCurrentSuite = () => {
    if (currentSuite) return currentSuite;
    const path = location.pathname;
    const suite = suites$1.find((s) => path.startsWith(s.route));
    return suite == null ? void 0 : suite.label;
  };
  const activeSuite = getCurrentSuite();
  const getSuiteId = () => {
    if (currentSuite) {
      return currentSuite.toLowerCase();
    }
    const path = location.pathname;
    const suite = suites$1.find((s) => path.startsWith(s.route));
    return suite == null ? void 0 : suite.id;
  };
  const suiteId = getSuiteId();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "min-h-screen",
      "data-suite": suiteId,
      style: {
        background: suiteId === "os" ? "linear-gradient(180deg, hsl(0, 0%, 8%) 0%, hsl(220, 60%, 18%) 60%, hsl(220, 70%, 22%) 100%)" : suiteId === "flow" ? "linear-gradient(180deg, hsl(0, 0%, 8%) 0%, hsl(45, 60%, 18%) 60%, hsl(45, 70%, 22%) 100%)" : suiteId === "lab" ? "linear-gradient(180deg, hsl(0, 0%, 8%) 0%, hsl(160, 60%, 18%) 60%, hsl(160, 70%, 22%) 100%)" : suiteId === "ops" ? "linear-gradient(180deg, hsl(0, 0%, 8%) 0%, hsl(200, 15%, 18%) 60%, hsl(200, 15%, 22%) 100%)" : suiteId === "connect" ? "linear-gradient(180deg, hsl(0, 0%, 8%) 0%, hsl(270, 50%, 18%) 60%, hsl(270, 60%, 22%) 100%)" : "hsl(var(--background))"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full items-center justify-between px-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: () => setDrawerOpen(true),
                className: "hover:bg-accent/10",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Menu, { className: "h-5 w-5" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded bg-primary/20 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-bold", children: "⬡" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold leading-none text-foreground", children: "BevForge" }),
                activeSuite && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs leading-none text-muted-foreground", children: activeSuite })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden md:block", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg font-semibold text-foreground", children: pageTitle }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/notifications", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "icon", className: "hover:bg-accent/10 relative", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-5 w-5" }),
              unreadCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white", children: unreadCount > 9 ? "9+" : unreadCount })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/calendar", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "hover:bg-accent/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-5 w-5" }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/settings", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "hover:bg-accent/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "h-5 w-5" }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "ghost",
                  size: "icon",
                  className: "rounded-full hover:bg-accent/10",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-4 w-4" }) })
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { align: "end", className: "w-48", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/profile", className: "cursor-pointer", children: "Profile" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/settings", className: "cursor-pointer", children: "Account Settings" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuSeparator, {}),
                /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuItem, { children: "Logout" })
              ] })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Sheet, { open: drawerOpen, onOpenChange: setDrawerOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetContent, { side: "left", className: "w-[280px] sm:w-[320px] p-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SheetHeader, { className: "border-b border-border p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded bg-primary/20 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-bold", children: "⬡" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTitle, { className: "text-foreground", children: "BevForge Navigation" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6 p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "Suites" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "flex flex-col gap-1", children: suites$1.map((suite) => {
                const isActive = location.pathname.startsWith(suite.route);
                return /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Link,
                  {
                    to: suite.route,
                    onClick: () => setDrawerOpen(false),
                    className: `group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-all hover:border-border hover:bg-accent/10 ${isActive ? `suite-${suite.id}-active border-border bg-accent/5` : ""}`,
                    children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "span",
                        {
                          className: "text-sm font-medium",
                          style: {
                            color: suite.id === "os" ? "hsl(190, 95%, 60%)" : suite.id === "flow" ? "hsl(45, 95%, 55%)" : suite.id === "lab" ? "hsl(160, 75%, 50%)" : suite.id === "ops" ? "hsl(200, 15%, 65%)" : "hsl(270, 70%, 60%)"
                          },
                          children: suite.label
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: suite.subtitle })
                    ] })
                  },
                  suite.id
                );
              }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "Global" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "flex flex-col gap-1", children: globalLinks.map((link) => {
                const Icon2 = link.icon;
                const isActive = location.pathname === link.route;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Link,
                  {
                    to: link.route,
                    onClick: () => setDrawerOpen(false),
                    className: `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent/10 ${isActive ? "bg-accent/5 text-primary" : "text-foreground"}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon2, { className: "h-4 w-4" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: link.label })
                    ]
                  },
                  link.route
                );
              }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "Help & Support" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "flex flex-col gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "a",
                  {
                    href: "#",
                    className: "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/10",
                    children: "Docs"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "a",
                  {
                    href: "#",
                    className: "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/10",
                    children: "Support"
                  }
                )
              ] })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "pt-16", children: fullWidth ? children : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container mx-auto p-6", children }) })
      ]
    }
  );
}
const Card = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "div",
  {
    ref,
    className: cn(
      "rounded-lg border bg-card text-card-foreground shadow-glow-md",
      className
    ),
    ...props
  }
));
Card.displayName = "Card";
const CardHeader = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "div",
  {
    ref,
    className: cn("flex flex-col space-y-1.5 p-6", className),
    ...props
  }
));
CardHeader.displayName = "CardHeader";
const CardTitle = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "div",
  {
    ref,
    className: cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    ),
    ...props
  }
));
CardTitle.displayName = "CardTitle";
const CardDescription = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "div",
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
CardDescription.displayName = "CardDescription";
const CardContent = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref, className: cn("p-6 pt-0", className), ...props }));
CardContent.displayName = "CardContent";
const CardFooter = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "div",
  {
    ref,
    className: cn("flex items-center p-6 pt-0", className),
    ...props
  }
));
CardFooter.displayName = "CardFooter";
const Dialog = Root;
const DialogPortal = Portal;
const DialogOverlay = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Overlay,
  {
    ref,
    className: cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props
  }
));
DialogOverlay.displayName = Overlay.displayName;
const DialogContent = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogPortal, { children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(DialogOverlay, {}),
  /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
DialogContent.displayName = Content.displayName;
const DialogHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "div",
  {
    className: cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    ),
    ...props
  }
);
DialogHeader.displayName = "DialogHeader";
const DialogFooter = ({
  className,
  ...props
}) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "div",
  {
    className: cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    ),
    ...props
  }
);
DialogFooter.displayName = "DialogFooter";
const DialogTitle = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Title,
  {
    ref,
    className: cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    ),
    ...props
  }
));
DialogTitle.displayName = Title.displayName;
const DialogDescription = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
DialogDescription.displayName = Description.displayName;
const statusCardStyles = {
  operational: "border-green-500/70 shadow-[0_0_0_1px_rgba(34,197,94,0.25),0_0_24px_rgba(34,197,94,0.12)]",
  warning: "border-yellow-500/70 shadow-[0_0_0_1px_rgba(234,179,8,0.25),0_0_24px_rgba(234,179,8,0.12)]",
  error: "border-destructive/70 shadow-[0_0_0_1px_rgba(239,68,68,0.25),0_0_24px_rgba(239,68,68,0.12)]",
  info: "border-blue-500/70 shadow-[0_0_0_1px_rgba(59,130,246,0.25),0_0_24px_rgba(59,130,246,0.12)]"
};
const statusIconStyles = {
  operational: "text-green-500",
  warning: "text-yellow-500",
  error: "text-destructive",
  info: "text-blue-500"
};
function MetricCard({
  title,
  value,
  unit,
  change,
  icon: Icon2,
  status = "info",
  className = ""
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Card,
    {
      className: `${className} ${statusCardStyles[status]} transition-shadow hover:shadow-glow-lg`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: title }),
          Icon2 && /* @__PURE__ */ jsxRuntimeExports.jsx(Icon2, { className: `h-4 w-4 ${statusIconStyles[status]}` })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold font-mono", children: value }),
            unit && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: unit })
          ] }),
          change && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "span",
              {
                className: `font-medium ${change.value > 0 ? "text-secondary" : change.value < 0 ? "text-destructive" : "text-muted-foreground"}`,
                children: [
                  change.value > 0 ? "+" : "",
                  change.value,
                  "%"
                ]
              }
            ),
            " ",
            change.label
          ] })
        ] })
      ]
    }
  );
}
function HomePage() {
  const navigate = useNavigate();
  const [showAddItemDialog, setShowAddItemDialog] = reactExports.useState(false);
  const categories = [
    {
      id: "yeast",
      name: "Yeast",
      icon: Beaker,
      description: "Ale, lager, wine yeast",
      isIngredient: true
    },
    {
      id: "malt",
      name: "Malt & Grain",
      icon: Wheat,
      description: "Base, specialty, adjunct",
      isIngredient: true
    },
    {
      id: "hops",
      name: "Hops",
      icon: Hop,
      description: "Bittering, aroma, dual-purpose",
      isIngredient: true
    },
    {
      id: "fruit",
      name: "Fruit & Adjuncts",
      icon: Apple,
      description: "Fruit, spices, additives",
      isIngredient: true
    },
    {
      id: "equipment",
      name: "Equipment",
      icon: Wrench,
      description: "Tools, parts, supplies",
      isIngredient: false
    },
    {
      id: "packaging",
      name: "Packaging",
      icon: Box,
      description: "Bottles, caps, labels",
      isIngredient: false
    },
    {
      id: "kegs",
      name: "Kegs & Barrels",
      icon: Beer,
      description: "Kegs, casks, barrels",
      isIngredient: false
    }
  ];
  const handleCategorySelect = (categoryId) => {
    setShowAddItemDialog(false);
    navigate(`/os/inventory/add?category=${categoryId}`);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { currentSuite: "os", pageTitle: "OS Dashboard", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold text-foreground", children: "OS Dashboard" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Operating System - Inventory, Batches & Production Tracking" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              onClick: () => navigate("/os/recipe-execution"),
              className: "gap-2",
              size: "lg",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FlaskConical, { className: "h-5 w-5" }),
                "Recipe Execution"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: () => navigate("/os/control-panel"),
              className: "gap-2",
              size: "lg",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Monitor, { className: "h-5 w-5" }),
                "Open Control Panel"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 rounded-full bg-green-500 animate-pulse" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: "System Operational" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-px bg-border" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground font-mono", children: "Uptime: 47d 12h 34m" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-px bg-border" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground font-mono", children: "Last Sync: 2 minutes ago" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4 text-yellow-500" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "3 warnings require attention" })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          MetricCard,
          {
            title: "Active Devices",
            value: 8,
            unit: "devices",
            icon: Activity,
            status: "operational",
            change: { value: 2, label: "from last week" }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          MetricCard,
          {
            title: "Inventory Items",
            value: 247,
            unit: "items",
            icon: Package,
            status: "info",
            change: { value: 12, label: "from last week" }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          MetricCard,
          {
            title: "System Warnings",
            value: 3,
            unit: "alerts",
            icon: TriangleAlert,
            status: "warning"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          MetricCard,
          {
            title: "Production Rate",
            value: "94.2",
            unit: "%",
            icon: TrendingUp,
            status: "operational",
            change: { value: 3.2, label: "from last month" }
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "hover:shadow-glow-lg transition-shadow cursor-pointer", onClick: () => navigate("/os/control-panel"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 rounded-lg bg-primary/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LayoutGrid, { className: "h-6 w-6 text-primary" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Device Layout" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Configure brewery equipment" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-5 w-5 text-muted-foreground" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "Design and configure your brewery device layout, connections, and flow paths." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 rounded-full bg-green-500" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Canvas editor + live controls" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Gauge, { className: "h-4 w-4 text-muted-foreground" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Node wiring and runtime logic ready" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "hover:shadow-glow-lg transition-shadow cursor-pointer", onClick: () => navigate("/os/inventory"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 rounded-lg bg-primary/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-6 w-6 text-primary" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Inventory Management" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Track all brewery materials" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-5 w-5 text-muted-foreground" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "Manage ingredients, equipment, packaging, and track inventory levels across all locations." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-4 w-4 text-muted-foreground" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "247 items tracked" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4 text-yellow-500" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-yellow-500", children: "12 low stock" })
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Quick Actions" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Common operations and shortcuts" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              className: "h-auto flex-col gap-2 p-4",
              onClick: () => setShowAddItemDialog(true),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-5 w-5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: "Add Item" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              className: "h-auto flex-col gap-2 p-4",
              onClick: () => navigate("/os/batches/new"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Beer, { className: "h-5 w-5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: "New Batch" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              className: "h-auto flex-col gap-2 p-4",
              onClick: () => navigate("/os/inventory"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-5 w-5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: "View Inventory" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              className: "h-auto flex-col gap-2 p-4",
              onClick: () => navigate("/os/devices"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LayoutGrid, { className: "h-5 w-5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: "Edit Layout" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              className: "h-auto flex-col gap-2 p-4",
              onClick: () => navigate("/os/control-panel"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Gauge, { className: "h-5 w-5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: "Control Panel" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              className: "h-auto flex-col gap-2 p-4",
              onClick: () => navigate("/os/recipe-execution"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FlaskConical, { className: "h-5 w-5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: "Run Recipe" })
              ]
            }
          )
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Recent Batches" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Latest production runs" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: [
            { id: "B-2024-045", name: "West Coast IPA", status: "fermenting", progress: 65 },
            { id: "B-2024-044", name: "Belgian Dubbel", status: "conditioning", progress: 85 },
            { id: "B-2024-043", name: "Pilsner", status: "packaging", progress: 95 }
          ].map((batch) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-muted/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-sm text-muted-foreground", children: batch.id }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: batch.name })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-1.5 bg-background rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: "h-full bg-primary rounded-full",
                    style: { width: `${batch.progress}%` }
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
                  batch.progress,
                  "%"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => navigate(`/os/batches/${batch.id}`), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" }) })
          ] }, batch.id)) }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Low Stock Alerts" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Items requiring reorder" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: [
            { name: "SafAle US-05", quantity: 8, unit: "packs", reorder: 10 },
            { name: "Cascade Hops", quantity: 42, unit: "kg", reorder: 50 },
            { name: "Bottle Caps", quantity: 450, unit: "units", reorder: 500 },
            { name: "Sanitizer", quantity: 2, unit: "gallons", reorder: 5 }
          ].map((item, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-muted/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-sm", children: item.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
                item.quantity,
                " ",
                item.unit,
                " (reorder at ",
                item.reorder,
                ")"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", children: "Reorder" })
          ] }, idx)) }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "System Integration" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Module connectivity status" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-3 rounded-lg bg-muted/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-5 w-5 text-green-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-sm", children: "API Connected" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "All endpoints operational" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-3 rounded-lg bg-muted/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-5 w-5 text-green-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-sm", children: "Database Synced" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Last sync: 2 min ago" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-3 rounded-lg bg-muted/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-5 w-5 text-yellow-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-sm", children: "OPS Integration" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Pending configuration" })
            ] })
          ] })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: showAddItemDialog, onOpenChange: setShowAddItemDialog, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-3xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Add Inventory Item" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Select the type of item you want to add" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-4 py-4", children: categories.map((category) => {
        const Icon2 = category.icon;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => handleCategorySelect(category.id),
            className: "flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors text-left",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-lg bg-primary/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon2, { className: "h-6 w-6 text-primary" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold mb-1", children: category.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: category.description }),
                category.isIngredient && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block mt-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded", children: "LAB-Tracked" })
              ] })
            ]
          },
          category.id
        );
      }) })
    ] }) })
  ] });
}
const suites = [
  {
    id: "os",
    title: "OS",
    description: "System Core and source of truth.",
    route: "/os"
  },
  {
    id: "ops",
    title: "OPS",
    description: "Business, warehouse, and compliance.",
    route: "/ops"
  },
  {
    id: "lab",
    title: "LAB",
    description: "Recipe authoring and export.",
    route: "/lab"
  },
  {
    id: "flow",
    title: "FLOW",
    description: "Keg and tap operations.",
    route: "/flow"
  },
  {
    id: "connect",
    title: "CONNECT",
    description: "Employee hub and collaboration.",
    route: "/connect"
  }
];
function HomeHubPage() {
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { pageTitle: "Dashboard Home", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "BevForge Suites" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Unified hub for OS, OPS, LAB, FLOW, and CONNECT." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: suites.map((suite) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Card,
      {
        className: "cursor-pointer transition-shadow hover:shadow-glow-lg",
        onClick: () => navigate(suite.route),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: suite.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4 text-muted-foreground" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: suite.description })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-mono", children: suite.route }) })
        ]
      },
      suite.id
    )) })
  ] }) });
}
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({ className, variant, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(badgeVariants({ variant }), className), ...props });
}
const Checkbox = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Checkbox$1,
  {
    ref,
    className: cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      CheckboxIndicator,
      {
        className: cn("flex items-center justify-center text-current"),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" })
      }
    )
  }
));
Checkbox.displayName = Checkbox$1.displayName;
const Input = reactExports.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        type,
        className: cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";
const Select = Root2$1;
const SelectValue = Value;
const SelectTrigger = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  Trigger$2,
  {
    ref,
    className: cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4 opacity-50" }) })
    ]
  }
));
SelectTrigger.displayName = Trigger$2.displayName;
const SelectScrollUpButton = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  ScrollUpButton,
  {
    ref,
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "h-4 w-4" })
  }
));
SelectScrollUpButton.displayName = ScrollUpButton.displayName;
const SelectScrollDownButton = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  ScrollDownButton,
  {
    ref,
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4" })
  }
));
SelectScrollDownButton.displayName = ScrollDownButton.displayName;
const SelectContent = reactExports.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(Portal$1, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
  Content2$1,
  {
    ref,
    className: cn(
      "relative z-50 max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]",
      position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
      className
    ),
    position,
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectScrollUpButton, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Viewport,
        {
          className: cn(
            "p-1",
            position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          ),
          children
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectScrollDownButton, {})
    ]
  }
) }));
SelectContent.displayName = Content2$1.displayName;
const SelectLabel = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Label$1,
  {
    ref,
    className: cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className),
    ...props
  }
));
SelectLabel.displayName = Label$1.displayName;
const SelectItem = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  Item,
  {
    ref,
    className: cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ItemIndicator, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ItemText, { children })
    ]
  }
));
SelectItem.displayName = Item.displayName;
const SelectSeparator = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Separator$1,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
SelectSeparator.displayName = Separator$1.displayName;
const Textarea = reactExports.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "textarea",
    {
      className: cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      ),
      ref,
      ...props
    }
  );
});
Textarea.displayName = "Textarea";
const STORAGE_KEY = "bevforge.calendar.failed-sync-queue.v1";
const nowIso$1 = () => (/* @__PURE__ */ new Date()).toISOString();
const isTransientHttpStatus = (status) => status === 0 || status === 408 || status === 425 || status === 429 || status >= 500;
const makeCalendarEventId = () => `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const parseQueue = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry) => {
      var _a;
      if (!entry || typeof entry !== "object") return false;
      const payloadId = String(((_a = entry == null ? void 0 : entry.payload) == null ? void 0 : _a.id) ?? "").trim();
      return payloadId.length > 0;
    });
  } catch {
    return [];
  }
};
const readCalendarSyncQueue = (storage) => parseQueue(storage.getItem(STORAGE_KEY));
const writeCalendarSyncQueue = (storage, entries) => {
  const normalized = [...entries].filter((entry) => {
    var _a;
    return String(((_a = entry == null ? void 0 : entry.payload) == null ? void 0 : _a.id) ?? "").trim().length > 0;
  }).slice(-200);
  if (normalized.length === 0) {
    storage.removeItem(STORAGE_KEY);
    return [];
  }
  storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
};
const queueCalendarSyncFailure = (storage, payload, errorMessage) => {
  const now = nowIso$1();
  const queue = readCalendarSyncQueue(storage);
  const existingIndex = queue.findIndex((entry) => entry.payload.id === payload.id);
  const queueId = `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  if (existingIndex >= 0) {
    const current = queue[existingIndex];
    const attempt = Number.isFinite(current.attemptCount) ? current.attemptCount + 1 : 1;
    const retryDelaySeconds = Math.min(300, attempt * 10);
    queue[existingIndex] = {
      ...current,
      payload,
      attemptCount: attempt,
      lastError: errorMessage,
      updatedAt: now,
      nextRetryAt: new Date(Date.now() + retryDelaySeconds * 1e3).toISOString()
    };
    return writeCalendarSyncQueue(storage, queue);
  }
  queue.push({
    queueId,
    payload,
    attemptCount: 1,
    lastError: errorMessage,
    createdAt: now,
    updatedAt: now,
    nextRetryAt: now
  });
  return writeCalendarSyncQueue(storage, queue);
};
const replayCalendarSyncQueue = async (storage, callbacks) => {
  const queue = readCalendarSyncQueue(storage);
  if (queue.length === 0) {
    return { delivered: 0, remaining: 0, attempted: 0 };
  }
  const nowMs = Date.now();
  const remaining = [];
  let delivered = 0;
  let attempted = 0;
  let stopReplay = false;
  const updateFailureEntry = (entry, message) => {
    const attempt = Number.isFinite(entry.attemptCount) ? entry.attemptCount + 1 : 1;
    const retryDelaySeconds = Math.min(300, attempt * 10);
    return {
      ...entry,
      attemptCount: attempt,
      lastError: message,
      updatedAt: nowIso$1(),
      nextRetryAt: new Date(Date.now() + retryDelaySeconds * 1e3).toISOString()
    };
  };
  for (let index2 = 0; index2 < queue.length; index2 += 1) {
    const entry = queue[index2];
    if (stopReplay) {
      remaining.push(entry);
      continue;
    }
    const retryAtMs = entry.nextRetryAt ? Date.parse(entry.nextRetryAt) : 0;
    if (Number.isFinite(retryAtMs) && retryAtMs > nowMs) {
      remaining.push(entry);
      continue;
    }
    attempted += 1;
    try {
      const response = await callbacks.postPayload(entry.payload);
      if (response.ok) {
        delivered += 1;
        continue;
      }
      if (!isTransientHttpStatus(response.status)) {
        continue;
      }
      remaining.push(
        updateFailureEntry(entry, response.message ?? `HTTP ${response.status}`)
      );
      stopReplay = true;
      continue;
    } catch (error) {
      remaining.push(
        updateFailureEntry(
          entry,
          error instanceof Error ? error.message : "Network error"
        )
      );
      stopReplay = true;
      continue;
    }
  }
  const finalQueue = writeCalendarSyncQueue(storage, remaining);
  return { delivered, remaining: finalQueue.length, attempted };
};
const suiteIds = ["os", "ops", "lab", "flow", "connect"];
const statusIds = [
  "planned",
  "in_progress",
  "completed",
  "canceled",
  "blocked"
];
const suiteLabels = {
  os: "OS",
  ops: "OPS",
  lab: "LAB",
  flow: "FLOW",
  connect: "CONNECT"
};
const suiteBadgeClass = {
  os: "border-cyan-400/60 text-cyan-300 bg-cyan-500/10",
  ops: "border-blue-400/60 text-blue-300 bg-blue-500/10",
  lab: "border-amber-400/60 text-amber-300 bg-amber-500/10",
  flow: "border-green-400/60 text-green-300 bg-green-500/10",
  connect: "border-violet-400/60 text-violet-300 bg-violet-500/10"
};
const suiteDotClass = {
  os: "bg-cyan-400",
  ops: "bg-blue-400",
  lab: "bg-amber-400",
  flow: "bg-green-400",
  connect: "bg-violet-400"
};
const statusLabel = {
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
  canceled: "Canceled",
  blocked: "Blocked"
};
const statusBadgeClass = {
  planned: "border-slate-500/70 text-slate-200 bg-slate-500/10",
  in_progress: "border-sky-400/70 text-sky-300 bg-sky-500/10",
  completed: "border-emerald-400/70 text-emerald-300 bg-emerald-500/10",
  canceled: "border-zinc-500/70 text-zinc-300 bg-zinc-500/10",
  blocked: "border-red-500/70 text-red-300 bg-red-500/10"
};
const statusDotClass = {
  planned: "bg-slate-400",
  in_progress: "bg-sky-400",
  completed: "bg-emerald-400",
  canceled: "bg-zinc-400",
  blocked: "bg-red-400"
};
const eventTypeDotClass = {
  production: "bg-cyan-400",
  inventory: "bg-emerald-400",
  order: "bg-indigo-400",
  delivery: "bg-blue-400",
  compliance: "bg-rose-400",
  schedule: "bg-violet-400",
  maintenance: "bg-amber-400",
  task: "bg-lime-400",
  note: "bg-slate-400"
};
const calendarEventTypes = [
  "production",
  "inventory",
  "order",
  "delivery",
  "compliance",
  "schedule",
  "maintenance",
  "task",
  "note"
];
const defaultSummary = {
  total: 0,
  bySuite: { os: 0, ops: 0, lab: 0, flow: 0, connect: 0 },
  byStatus: { planned: 0, in_progress: 0, completed: 0, canceled: 0, blocked: 0 }
};
const defaultStatusFilter = () => ({
  planned: true,
  in_progress: true,
  completed: true,
  canceled: true,
  blocked: true
});
const defaultSuiteFilter = () => ({
  os: true,
  ops: true,
  lab: true,
  flow: true,
  connect: true
});
const sameDay = (left, right) => left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
const localDateKey = (iso) => format(new Date(iso), "yyyy-MM-dd");
const toDateInputValue = (value) => format(value, "yyyy-MM-dd");
const eventTimeLabel = (event) => {
  const start = format(new Date(event.startAt), "h:mm a");
  if (!event.endAt) return start;
  return `${start} - ${format(new Date(event.endAt), "h:mm a")}`;
};
const eventTypeLabel = (value) => value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
const dateCellLabel = (value) => format(value, "EEEE, MMM d, yyyy");
const sortEvents = (events) => [...events].sort(
  (left, right) => Date.parse(left.startAt) - Date.parse(right.startAt)
);
function CalendarPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = reactExports.useState([]);
  const [summary, setSummary] = reactExports.useState(defaultSummary);
  const [status, setStatus] = reactExports.useState("Loading calendar...");
  const [isLoading, setIsLoading] = reactExports.useState(false);
  const [rangeDays, setRangeDays] = reactExports.useState("30");
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [selectedDate, setSelectedDate] = reactExports.useState(/* @__PURE__ */ new Date());
  const [currentMonth, setCurrentMonth] = reactExports.useState(startOfMonth(/* @__PURE__ */ new Date()));
  const [filtersOpen, setFiltersOpen] = reactExports.useState(false);
  const [suiteFilter, setSuiteFilter] = reactExports.useState(
    defaultSuiteFilter
  );
  const [statusFilter, setStatusFilter] = reactExports.useState(
    defaultStatusFilter
  );
  const [typeFilter, setTypeFilter] = reactExports.useState({});
  const [createDialogOpen, setCreateDialogOpen] = reactExports.useState(false);
  const [createDialogError, setCreateDialogError] = reactExports.useState(null);
  const [creatingEvent, setCreatingEvent] = reactExports.useState(false);
  const [createDraft, setCreateDraft] = reactExports.useState({
    sourceSuite: "os",
    title: "",
    description: "",
    date: toDateInputValue(/* @__PURE__ */ new Date()),
    startTime: "09:00",
    endTime: "10:00",
    type: "schedule",
    status: "planned",
    priority: "medium",
    siteId: "main",
    allDay: false
  });
  const longPressTimerRef = reactExports.useRef(null);
  const activeSuiteTab = reactExports.useMemo(() => {
    const value = searchParams.get("suite");
    if (!value) return "all";
    return suiteIds.includes(value) ? value : "all";
  }, [searchParams]);
  const calendarBasePath = location.pathname.startsWith("/os/calendar") ? "/os/calendar" : "/calendar";
  const suiteForNewEvent = activeSuiteTab === "all" ? "os" : activeSuiteTab;
  const postCalendarPayload = async (payload) => {
    const response = await fetch("/api/calendar/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => null);
    return {
      ok: response.ok && Boolean(body == null ? void 0 : body.success),
      status: response.status,
      message: typeof (body == null ? void 0 : body.error) === "string" ? body.error : void 0
    };
  };
  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };
  const openCreateDialogForDay = (day) => {
    setSelectedDate(day);
    setCurrentMonth(startOfMonth(day));
    setCreateDialogError(null);
    setCreateDraft({
      sourceSuite: suiteForNewEvent,
      title: "",
      description: "",
      date: toDateInputValue(day),
      startTime: "09:00",
      endTime: "10:00",
      type: "schedule",
      status: "planned",
      priority: "medium",
      siteId: "main",
      allDay: false
    });
    setCreateDialogOpen(true);
  };
  const onDayPointerDown = (event, day) => {
    if (event.pointerType === "mouse") {
      return;
    }
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      openCreateDialogForDay(day);
      longPressTimerRef.current = null;
    }, 450);
  };
  const onDayPointerEnd = () => {
    clearLongPressTimer();
  };
  const loadEvents = async () => {
    var _a, _b;
    setIsLoading(true);
    try {
      const now = /* @__PURE__ */ new Date();
      const from = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1e3);
      const to = new Date(now.getTime() + Number(rangeDays) * 24 * 60 * 60 * 1e3);
      const params = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString()
      });
      const response = await fetch(`/api/calendar/events?${params.toString()}`);
      const payload = await response.json().catch(() => null);
      if (!response.ok || !(payload == null ? void 0 : payload.success)) {
        throw new Error((payload == null ? void 0 : payload.error) ?? "Failed to load calendar.");
      }
      setEvents(((_a = payload.data) == null ? void 0 : _a.events) ?? []);
      setSummary(((_b = payload.data) == null ? void 0 : _b.summary) ?? defaultSummary);
      setStatus("Calendar loaded.");
    } catch (error) {
      setEvents([]);
      setSummary(defaultSummary);
      setStatus(error instanceof Error ? error.message : "Failed to load calendar.");
    } finally {
      setIsLoading(false);
    }
  };
  reactExports.useEffect(() => {
    void loadEvents();
  }, [rangeDays]);
  const replayFailedSyncQueue = async (announce = true) => {
    if (typeof window === "undefined") {
      return { delivered: 0, remaining: 0, attempted: 0 };
    }
    const result = await replayCalendarSyncQueue(window.localStorage, {
      postPayload: postCalendarPayload
    });
    if (result.delivered > 0) {
      await loadEvents();
      if (announce) {
        setStatus(
          `Recovered ${result.delivered} queued event${result.delivered === 1 ? "" : "s"}.`
        );
      }
    }
    return result;
  };
  reactExports.useEffect(() => {
    void replayFailedSyncQueue();
  }, []);
  reactExports.useEffect(
    () => () => {
      clearLongPressTimer();
    },
    []
  );
  const buildIsoFromDraft = (dateText, timeText) => {
    const [year, month, day] = dateText.split("-").map((value) => Number(value));
    const [hours, minutes] = timeText.split(":").map((value) => Number(value));
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day) || !Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return null;
    }
    const next = new Date(year, month - 1, day, hours, minutes, 0, 0);
    if (Number.isNaN(next.getTime())) return null;
    return next.toISOString();
  };
  const submitCreateEvent = async () => {
    setCreateDialogError(null);
    const title = createDraft.title.trim();
    if (!title) {
      setCreateDialogError("Title is required.");
      return;
    }
    let startAt;
    let endAt;
    if (createDraft.allDay) {
      startAt = buildIsoFromDraft(createDraft.date, "00:00");
      endAt = buildIsoFromDraft(createDraft.date, "23:59") ?? void 0;
    } else {
      startAt = buildIsoFromDraft(createDraft.date, createDraft.startTime);
      endAt = createDraft.endTime.trim().length > 0 ? buildIsoFromDraft(createDraft.date, createDraft.endTime) ?? void 0 : void 0;
    }
    if (!startAt) {
      setCreateDialogError("Invalid date or time.");
      return;
    }
    if (endAt && Date.parse(endAt) < Date.parse(startAt)) {
      setCreateDialogError("End time must be after start time.");
      return;
    }
    const requestId = makeCalendarEventId();
    const requestPayload = {
      id: requestId,
      sourceSuite: createDraft.sourceSuite,
      title,
      description: createDraft.description.trim() || void 0,
      siteId: createDraft.siteId.trim() || void 0,
      type: createDraft.type,
      status: createDraft.status,
      priority: createDraft.priority,
      startAt,
      endAt,
      allDay: createDraft.allDay,
      metadata: {
        createdFrom: "calendar-ui",
        clientRequestId: requestId
      }
    };
    setCreatingEvent(true);
    try {
      const result = await postCalendarPayload(requestPayload);
      if (result.ok) {
        setCreateDialogOpen(false);
        await loadEvents();
        const replay = await replayFailedSyncQueue(false);
        setStatus(
          replay.delivered > 0 ? `Created "${title}" and recovered ${replay.delivered} queued event${replay.delivered === 1 ? "" : "s"}.` : `Created event "${title}".`
        );
        return;
      }
      if (!isTransientHttpStatus(result.status)) {
        setCreateDialogError(result.message ?? "Failed to create calendar event.");
        return;
      }
      if (typeof window !== "undefined") {
        queueCalendarSyncFailure(
          window.localStorage,
          requestPayload,
          result.message ?? `HTTP ${result.status}`
        );
      }
      setCreateDialogOpen(false);
      setStatus("Event queued for retry due to temporary connection issue.");
    } catch (error) {
      if (typeof window !== "undefined") {
        queueCalendarSyncFailure(
          window.localStorage,
          requestPayload,
          error instanceof Error ? error.message : "Network error"
        );
      }
      setCreateDialogOpen(false);
      setStatus("Event queued for retry due to temporary connection issue.");
    } finally {
      setCreatingEvent(false);
    }
  };
  const availableTypes = reactExports.useMemo(
    () => [...new Set(events.map((event) => event.type).filter((type) => type && type.length > 0))].sort(),
    [events]
  );
  const selectableTypes = reactExports.useMemo(
    () => [.../* @__PURE__ */ new Set([...calendarEventTypes, ...availableTypes])],
    [availableTypes]
  );
  reactExports.useEffect(() => {
    setTypeFilter((current) => {
      const next = { ...current };
      let changed = false;
      for (const type of availableTypes) {
        if (!(type in next)) {
          next[type] = true;
          changed = true;
        }
      }
      for (const key of Object.keys(next)) {
        if (!availableTypes.includes(key)) {
          delete next[key];
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [availableTypes]);
  const filteredEvents = reactExports.useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    return sortEvents(
      events.filter((event) => {
        if (activeSuiteTab !== "all" && event.sourceSuite !== activeSuiteTab) {
          return false;
        }
        if (!suiteFilter[event.sourceSuite]) {
          return false;
        }
        if (!statusFilter[event.status]) {
          return false;
        }
        if (typeFilter[event.type] === false) {
          return false;
        }
        if (!search) {
          return true;
        }
        const haystack = [
          event.title,
          event.description ?? "",
          event.type,
          event.status,
          event.sourceSuite,
          event.sourceRecordId ?? ""
        ].join(" ").toLowerCase();
        return haystack.includes(search);
      })
    );
  }, [activeSuiteTab, events, searchQuery, statusFilter, suiteFilter, typeFilter]);
  const visibleSummary = reactExports.useMemo(() => {
    const bySuite = { os: 0, ops: 0, lab: 0, flow: 0, connect: 0 };
    const byStatus = {
      planned: 0,
      in_progress: 0,
      completed: 0,
      canceled: 0,
      blocked: 0
    };
    for (const event of filteredEvents) {
      bySuite[event.sourceSuite] += 1;
      byStatus[event.status] += 1;
    }
    return {
      total: filteredEvents.length,
      bySuite,
      byStatus
    };
  }, [filteredEvents]);
  const eventsByDay = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const event of filteredEvents) {
      const key = localDateKey(event.startAt);
      const current = map.get(key) ?? [];
      current.push(event);
      map.set(key, current);
    }
    return map;
  }, [filteredEvents]);
  const monthDays = reactExports.useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);
  const selectedDayEvents = reactExports.useMemo(
    () => sortEvents(eventsByDay.get(localDateKey(selectedDate)) ?? []),
    [eventsByDay, selectedDate]
  );
  const resetLegendFilters = () => {
    setSuiteFilter(defaultSuiteFilter());
    setStatusFilter(defaultStatusFilter());
    setTypeFilter(
      Object.fromEntries(availableTypes.map((type) => [type, true]))
    );
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { currentSuite: "os", pageTitle: "Universal Calendar", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 lg:pr-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "Universal Calendar" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-muted-foreground", children: "Shared calendar projection with suite-owned events." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: status })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => void loadEvents(), disabled: isLoading, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: `mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}` }),
          "Refresh"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-4 pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: searchQuery,
              onChange: (event) => setSearchQuery(event.target.value),
              placeholder: "Search events...",
              className: "pl-9"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: rangeDays, onValueChange: setRangeDays, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Range" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "14", children: "14 Days" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "30", children: "30 Days" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "60", children: "60 Days" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "90", children: "90 Days" })
          ] })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Link,
          {
            to: calendarBasePath,
            className: "block",
            "aria-current": activeSuiteTab === "all" ? "page" : void 0,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Card,
              {
                className: `transition-colors ${activeSuiteTab === "all" ? "border-primary/70 bg-primary/10" : "hover:bg-accent/10"}`,
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold", children: summary.total }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Visible Events" })
                ] })
              }
            )
          }
        ),
        suiteIds.map((suite) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          Link,
          {
            to: `${calendarBasePath}?suite=${suite}`,
            className: "block",
            "aria-current": activeSuiteTab === suite ? "page" : void 0,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Card,
              {
                className: `transition-colors ${activeSuiteTab === suite ? "border-primary/70 bg-primary/10" : "hover:bg-accent/10"}`,
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold", children: summary.bySuite[suite] ?? 0 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: suiteLabels[suite] })
                ] })
              }
            )
          },
          suite
        ))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarDays, { className: "h-4 w-4" }),
              format(currentMonth, "MMMM yyyy")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { children: [
              dateCellLabel(selectedDate),
              " • ",
              selectedDayEvents.length,
              " event",
              selectedDayEvents.length === 1 ? "" : "s"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Single click to select day. Double click (desktop) or long press (mobile) to add event." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                size: "icon",
                onClick: () => setCurrentMonth(subMonths(currentMonth)),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => {
                  const today = /* @__PURE__ */ new Date();
                  setCurrentMonth(startOfMonth(today));
                  setSelectedDate(today);
                },
                children: "Today"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                size: "icon",
                onClick: () => setCurrentMonth(addMonths(currentMonth, 1)),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" })
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-7 gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "Sun" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "Mon" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "Tue" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "Wed" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "Thu" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "Fri" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "Sat" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 grid grid-cols-7 gap-2", children: monthDays.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = sortEvents(eventsByDay.get(key) ?? []);
            const isSelected = sameDay(day, selectedDate);
            const inMonth = isSameMonth(day, currentMonth);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => setSelectedDate(day),
                onDoubleClick: () => openCreateDialogForDay(day),
                onPointerDown: (event) => onDayPointerDown(event, day),
                onPointerUp: onDayPointerEnd,
                onPointerCancel: onDayPointerEnd,
                onPointerLeave: onDayPointerEnd,
                className: `min-h-[120px] rounded-lg border p-2 text-left transition-colors ${isSelected ? "border-primary/70 bg-primary/10" : "border-border/70 bg-card/50 hover:bg-accent/10"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: `text-sm font-semibold ${inMonth ? "text-foreground" : "text-muted-foreground/50"}`,
                        children: format(day, "d")
                      }
                    ),
                    isToday(day) && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-primary/30 px-1.5 py-0.5 text-[10px] font-semibold text-primary", children: "Today" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 space-y-1", children: [
                    dayEvents.slice(0, 3).map((event) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: "rounded border border-border/60 px-1.5 py-1 text-[11px]",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "span",
                            {
                              className: `h-2 w-2 rounded-full ${suiteDotClass[event.sourceSuite]}`
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate font-medium", children: event.title })
                        ] })
                      },
                      event.id
                    )),
                    dayEvents.length > 3 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] text-muted-foreground", children: [
                      "+",
                      dayEvents.length - 3,
                      " more"
                    ] })
                  ] })
                ]
              },
              key
            );
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base", children: [
          "Events • ",
          dateCellLabel(selectedDate)
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3", children: selectedDayEvents.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No events on selected date." }) : selectedDayEvents.map((event) => {
          var _a, _b, _c, _d;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border/70 bg-card/70 p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: suiteBadgeClass[event.sourceSuite], children: suiteLabels[event.sourceSuite] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: statusBadgeClass[event.status], children: statusLabel[event.status] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: eventTypeLabel(event.type) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: eventTimeLabel(event) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: event.title }),
              event.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: event.description })
            ] }),
            (((_a = event.links) == null ? void 0 : _a.openPath) || ((_b = event.links) == null ? void 0 : _b.openUrl)) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2", children: ((_c = event.links) == null ? void 0 : _c.openPath) ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              Link,
              {
                to: event.links.openPath,
                className: "text-xs font-medium text-primary hover:underline",
                children: "Open Source Record"
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
              "a",
              {
                href: (_d = event.links) == null ? void 0 : _d.openUrl,
                target: "_blank",
                rel: "noreferrer",
                className: "text-xs font-medium text-primary hover:underline",
                children: "Open Source Record"
              }
            ) })
          ] }, event.id);
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: createDialogOpen, onOpenChange: setCreateDialogOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-[560px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Create Calendar Event" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Adds a suite-owned event to the universal calendar feed." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 py-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "Title" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: createDraft.title,
              onChange: (event) => setCreateDraft((current) => ({ ...current, title: event.target.value })),
              placeholder: "Event title"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "Owning Suite" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: createDraft.sourceSuite,
                onValueChange: (value) => setCreateDraft((current) => ({
                  ...current,
                  sourceSuite: value
                })),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: suiteIds.map((suite) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: suite, children: suiteLabels[suite] }, suite)) })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "Event Type" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: createDraft.type,
                onValueChange: (value) => setCreateDraft((current) => ({ ...current, type: value })),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: selectableTypes.map((type) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: type, children: eventTypeLabel(type) }, type)) })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "Date" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "date",
                value: createDraft.date,
                onChange: (event) => setCreateDraft((current) => ({ ...current, date: event.target.value }))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "Site" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: createDraft.siteId,
                onChange: (event) => setCreateDraft((current) => ({ ...current, siteId: event.target.value })),
                placeholder: "main"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Checkbox,
            {
              checked: createDraft.allDay,
              onCheckedChange: (checked) => setCreateDraft((current) => ({ ...current, allDay: checked === true }))
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "All day event" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "Start Time" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "time",
                disabled: createDraft.allDay,
                value: createDraft.startTime,
                onChange: (event) => setCreateDraft((current) => ({
                  ...current,
                  startTime: event.target.value
                }))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "End Time" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "time",
                disabled: createDraft.allDay,
                value: createDraft.endTime,
                onChange: (event) => setCreateDraft((current) => ({
                  ...current,
                  endTime: event.target.value
                }))
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "Status" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: createDraft.status,
                onValueChange: (value) => setCreateDraft((current) => ({
                  ...current,
                  status: value
                })),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: statusIds.map((statusId) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: statusId, children: statusLabel[statusId] }, statusId)) })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "Priority" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: createDraft.priority,
                onValueChange: (value) => setCreateDraft((current) => ({
                  ...current,
                  priority: value
                })),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "low", children: "Low" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "medium", children: "Medium" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "high", children: "High" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "critical", children: "Critical" })
                  ] })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "Description" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              value: createDraft.description,
              onChange: (event) => setCreateDraft((current) => ({
                ...current,
                description: event.target.value
              })),
              placeholder: "Optional details and execution notes...",
              rows: 3
            }
          )
        ] }),
        createDialogError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-red-400", children: createDialogError })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "outline",
            onClick: () => setCreateDialogOpen(false),
            disabled: creatingEvent,
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: submitCreateEvent, disabled: creatingEvent, children: creatingEvent ? "Creating..." : "Create Event" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: `fixed right-0 top-20 z-40 h-[calc(100vh-5.5rem)] transition-transform duration-200 ${filtersOpen ? "translate-x-0" : "translate-x-[288px]"}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              "aria-label": filtersOpen ? "Close filters" : "Open filters",
              onClick: () => setFiltersOpen((open) => !open),
              className: "absolute -left-8 top-1/2 -translate-y-1/2 rounded-l-md border border-r-0 border-border bg-card/95 px-2 py-3 hover:bg-accent/10",
              children: filtersOpen ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronsRight, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronsLeft, { className: "h-4 w-4" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full w-72 overflow-y-auto border-l border-border bg-card/95 p-4 backdrop-blur", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold", children: "Event Key + Filters" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: resetLegendFilters, children: "Reset" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Suites" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: suiteIds.map((suite) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-xs", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Checkbox,
                    {
                      checked: suiteFilter[suite],
                      onCheckedChange: (checked) => setSuiteFilter((current) => ({
                        ...current,
                        [suite]: checked === true
                      }))
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `h-2.5 w-2.5 rounded-full ${suiteDotClass[suite]}` }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: suiteLabels[suite] })
                ] }, suite)) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Status" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: statusIds.map((statusId) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-xs", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Checkbox,
                    {
                      checked: statusFilter[statusId],
                      onCheckedChange: (checked) => setStatusFilter((current) => ({
                        ...current,
                        [statusId]: checked === true
                      }))
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `h-2.5 w-2.5 rounded-full ${statusDotClass[statusId]}` }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: statusLabel[statusId] })
                ] }, statusId)) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Event Types" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: availableTypes.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "No typed events in range." }) : availableTypes.map((type) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-xs", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Checkbox,
                    {
                      checked: typeFilter[type] !== false,
                      onCheckedChange: (checked) => setTypeFilter((current) => ({
                        ...current,
                        [type]: checked === true
                      }))
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: `h-2.5 w-2.5 rounded-full ${eventTypeDotClass[type] ?? "bg-slate-400"}`
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: eventTypeLabel(type) })
                ] }, type)) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Source Window" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                  "Loaded ",
                  summary.total,
                  " total events from API window; showing ",
                  visibleSummary.total,
                  " ",
                  "after filters."
                ] })
              ] })
            ] })
          ] })
        ]
      }
    )
  ] });
}
const Tabs = Root2$2;
const TabsList = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  List,
  {
    ref,
    className: cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    ),
    ...props
  }
));
TabsList.displayName = List.displayName;
const TabsTrigger = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Trigger$3,
  {
    ref,
    className: cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    ),
    ...props
  }
));
TabsTrigger.displayName = Trigger$3.displayName;
const TabsContent = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Content$1,
  {
    ref,
    className: cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    ),
    ...props
  }
));
TabsContent.displayName = Content$1.displayName;
const Separator = reactExports.forwardRef(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    Root$1,
    {
      ref,
      decorative,
      orientation,
      className: cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      ),
      ...props
    }
  )
);
Separator.displayName = Root$1.displayName;
const mockYeastData = {
  name: "SafAle US-05",
  category: "yeast",
  quantity: 45,
  unit: "packs",
  reorderPoint: 10,
  cost: 4.99,
  trend: "stable",
  manufacturer: "Fermentis",
  strain: "American Ale",
  attenuation: { min: 78, max: 82 },
  alcoholTolerance: 12,
  temperatureRange: { min: 15, max: 24 },
  flocculation: "medium",
  fermentationSpeed: "fast",
  esterProfile: "low",
  phenolProfile: "low",
  sensoryCharacteristics: [
    "Clean fermentation profile",
    "Neutral flavor",
    "Highlights malt and hop character",
    "Well-balanced"
  ],
  operationalNotes: "Ideal for American-style ales. Direct pitch at 11.5g/hL for standard gravity worts. No rehydration required."
};
const mockLocations$3 = [
  { location: "Cold Storage A", quantity: 30, unit: "packs" },
  { location: "Warehouse B - Shelf 3", quantity: 15, unit: "packs" }
];
const mockHistory$3 = [
  { date: "2024-12-20", type: "Receipt", quantity: 50, unit: "packs", reference: "PO-2024-156" },
  { date: "2024-12-18", type: "Consumption", quantity: -5, unit: "packs", reference: "Batch #045" },
  { date: "2024-12-15", type: "Consumption", quantity: -10, unit: "packs", reference: "Batch #044" }
];
function YeastDetailsPage() {
  var _a, _b, _c, _d, _e;
  const navigate = useNavigate();
  const item = mockYeastData;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => navigate("/"),
          className: "mb-4 gap-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
            "Back to Dashboard"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-start justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: item.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: item.category.toUpperCase() }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: item.manufacturer }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: item.strain })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "On Hand" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl font-bold", children: item.quantity }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: item.unit })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
            "Reorder at ",
            item.reorderPoint,
            " ",
            item.unit
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "Last Cost" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-2xl font-bold", children: [
            "$",
            item.cost.toFixed(2)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-muted-foreground", children: [
            "per ",
            item.unit
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "Usage Trend" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-5 w-5 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl font-bold capitalize", children: item.trend })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Last 30 days" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "Active Locations" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl font-bold", children: mockLocations$3.length }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: "locations" })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "general", className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "general", children: "General" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "specs", children: "Yeast Specifications" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "inventory", children: "Inventory" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "history", children: "History" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "general", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "General Information" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Description" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1", children: "Professional dry yeast for American-style ales. Produces clean, neutral fermentation profile that allows malt and hop character to shine through." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Category" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 capitalize", children: item.category })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Unit of Measure" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1", children: item.unit })
            ] })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "specs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Fermentation Characteristics" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Attenuation" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                (_a = item.attenuation) == null ? void 0 : _a.min,
                "% - ",
                (_b = item.attenuation) == null ? void 0 : _b.max,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Alcohol Tolerance" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                item.alcoholTolerance,
                "% ABV"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Temperature Range" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                (_c = item.temperatureRange) == null ? void 0 : _c.min,
                "°C - ",
                (_d = item.temperatureRange) == null ? void 0 : _d.max,
                "°C"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Flocculation" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium capitalize", children: item.flocculation })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Fermentation Speed" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium capitalize", children: item.fermentationSpeed })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Sensory Profile" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Ester Production" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium capitalize", children: item.esterProfile })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Phenol Production" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium capitalize", children: item.phenolProfile })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Characteristics" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-2 space-y-1", children: (_e = item.sensoryCharacteristics) == null ? void 0 : _e.map((char, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "text-sm flex items-start gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary mt-1", children: "•" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: char })
              ] }, idx)) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md lg:col-span-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Operational Notes" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: item.operationalNotes }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "inventory", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Inventory Settings" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Reorder Point" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                item.reorderPoint,
                " ",
                item.unit
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Lot Tracking" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: "Enabled" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-4 w-4" }),
            "Current Locations"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: mockLocations$3.map((loc, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center p-2 border rounded", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: loc.location }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-muted-foreground", children: [
              loc.quantity,
              " ",
              loc.unit
            ] })
          ] }, idx)) }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "history", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-4 w-4" }),
          "Recent Movements"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: mockHistory$3.map((entry, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 border rounded", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: entry.type }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: entry.reference })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "p",
              {
                className: `text-sm font-medium ${entry.quantity > 0 ? "text-green-600" : "text-red-600"}`,
                children: [
                  entry.quantity > 0 ? "+" : "",
                  entry.quantity,
                  " ",
                  entry.unit
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: entry.date })
          ] })
        ] }, idx)) }) })
      ] }) })
    ] })
  ] });
}
const mockMaltData = {
  name: "Pilsner Malt",
  category: "malt",
  quantity: 450,
  unit: "kg",
  reorderPoint: 200,
  cost: 1.25,
  trend: "down",
  maltType: "base",
  origin: "Germany",
  ppg: 37,
  extractYield: 81,
  fermentability: 82,
  color: 1.8,
  maxUsage: 100,
  bodyContribution: "light",
  flavorNotes: [
    "Clean malty sweetness",
    "Light bread crust",
    "Subtle honey notes",
    "Crisp finish"
  ],
  operationalNotes: "Premium German Pilsner malt. Ideal base malt for lagers and light ales. Requires proper mash pH control (5.2-5.6) for optimal enzyme activity."
};
const mockLocations$2 = [
  { location: "Grain Storage - Silo 1", quantity: 300, unit: "kg" },
  { location: "Warehouse A - Pallet 12", quantity: 150, unit: "kg" }
];
const mockHistory$2 = [
  { date: "2024-12-22", type: "Receipt", quantity: 500, unit: "kg", reference: "PO-2024-189" },
  { date: "2024-12-19", type: "Consumption", quantity: -50, unit: "kg", reference: "Batch #045" },
  { date: "2024-12-16", type: "Consumption", quantity: -75, unit: "kg", reference: "Batch #044" }
];
function MaltDetailsPage() {
  var _a;
  const navigate = useNavigate();
  const item = mockMaltData;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => navigate("/"),
          className: "mb-4 gap-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
            "Back to Dashboard"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-start justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: item.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: item.category.toUpperCase() }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "capitalize", children: item.maltType }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: item.origin })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "On Hand" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl font-bold", children: item.quantity }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: item.unit })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
            "Reorder at ",
            item.reorderPoint,
            " ",
            item.unit
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "Last Cost" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-2xl font-bold", children: [
            "$",
            item.cost.toFixed(2)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-muted-foreground", children: [
            "per ",
            item.unit
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "Usage Trend" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-5 w-5 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl font-bold capitalize", children: item.trend })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Last 30 days" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "Active Locations" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl font-bold", children: mockLocations$2.length }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: "locations" })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "general", className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "general", children: "General" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "specs", children: "Malt Specifications" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "inventory", children: "Inventory" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "history", children: "History" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "general", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "General Information" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Description" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1", children: "Premium German Pilsner malt with excellent enzymatic power. Provides clean malty character and light color, ideal for lagers and light-colored ales." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Category" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 capitalize", children: item.category })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Unit of Measure" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1", children: item.unit })
            ] })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "specs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Extract & Fermentability" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "PPG (Points/Pound/Gallon)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: item.ppg })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Extract Yield" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                item.extractYield,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Fermentability" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                item.fermentability,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Max Usage" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                item.maxUsage,
                "% of grist"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Color & Body Contribution" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Color (Lovibond)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                item.color,
                "°L"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Body Contribution" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium capitalize", children: item.bodyContribution })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Malt Type" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium capitalize", children: item.maltType })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Origin" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: item.origin })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md lg:col-span-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Flavor Profile" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1", children: (_a = item.flavorNotes) == null ? void 0 : _a.map((note, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "text-sm flex items-start gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary mt-1", children: "•" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: note })
          ] }, idx)) }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md lg:col-span-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Operational Notes" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: item.operationalNotes }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "inventory", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Inventory Settings" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Reorder Point" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                item.reorderPoint,
                " ",
                item.unit
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Lot Tracking" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: "Enabled" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-4 w-4" }),
            "Current Locations"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: mockLocations$2.map((loc, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center p-2 border rounded", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: loc.location }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-muted-foreground", children: [
              loc.quantity,
              " ",
              loc.unit
            ] })
          ] }, idx)) }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "history", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-4 w-4" }),
          "Recent Movements"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: mockHistory$2.map((entry, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 border rounded", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: entry.type }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: entry.reference })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "p",
              {
                className: `text-sm font-medium ${entry.quantity > 0 ? "text-green-600" : "text-red-600"}`,
                children: [
                  entry.quantity > 0 ? "+" : "",
                  entry.quantity,
                  " ",
                  entry.unit
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: entry.date })
          ] })
        ] }, idx)) }) })
      ] }) })
    ] })
  ] });
}
const mockHopsData = {
  name: "Cascade Hops",
  category: "hops",
  quantity: 85,
  unit: "kg",
  reorderPoint: 50,
  cost: 18.5,
  trend: "stable",
  hopType: "dual-purpose",
  origin: "USA",
  alphaAcid: 5.5,
  betaAcid: 5,
  cohumulone: 33,
  totalOil: 1.5,
  myrcene: 50,
  humulene: 12,
  caryophyllene: 5,
  farnesene: 4,
  aromaDescriptors: [
    "Citrus",
    "Grapefruit",
    "Floral",
    "Spicy"
  ],
  flavorDescriptors: [
    "Citrus zest",
    "Grapefruit pith",
    "Floral notes",
    "Moderate bitterness"
  ],
  operationalNotes: "Classic American hop variety. Excellent for dry hopping and late additions. Store at -18°C to preserve alpha acids and oils."
};
const mockLocations$1 = [
  { location: "Cold Storage - Freezer A", quantity: 50, unit: "kg" },
  { location: "Cold Storage - Freezer B", quantity: 35, unit: "kg" }
];
const mockHistory$1 = [
  { date: "2024-12-21", type: "Receipt", quantity: 100, unit: "kg", reference: "PO-2024-178" },
  { date: "2024-12-17", type: "Consumption", quantity: -10, unit: "kg", reference: "Batch #045" },
  { date: "2024-12-14", type: "Consumption", quantity: -5, unit: "kg", reference: "Batch #044" }
];
function HopsDetailsPage() {
  var _a, _b;
  const navigate = useNavigate();
  const item = mockHopsData;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => navigate("/"),
          className: "mb-4 gap-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
            "Back to Dashboard"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-start justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: item.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: item.category.toUpperCase() }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "capitalize", children: item.hopType }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: item.origin })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "On Hand" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl font-bold", children: item.quantity }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: item.unit })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
            "Reorder at ",
            item.reorderPoint,
            " ",
            item.unit
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "Last Cost" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-2xl font-bold", children: [
            "$",
            item.cost.toFixed(2)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-muted-foreground", children: [
            "per ",
            item.unit
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "Usage Trend" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-5 w-5 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl font-bold capitalize", children: item.trend })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Last 30 days" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "Active Locations" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl font-bold", children: mockLocations$1.length }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: "locations" })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "general", className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "general", children: "General" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "specs", children: "Hops Specifications" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "inventory", children: "Inventory" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "history", children: "History" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "general", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "General Information" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Description" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1", children: "Classic American hop variety with distinctive citrus and floral character. Excellent for both bittering and aroma applications in American-style ales." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Category" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 capitalize", children: item.category })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Unit of Measure" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1", children: item.unit })
            ] })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "specs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Acid Composition" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Alpha Acid" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                item.alphaAcid,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Beta Acid" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                item.betaAcid,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Cohumulone" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                item.cohumulone,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Hop Type" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium capitalize", children: item.hopType })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Oil Profile" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Total Oil" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                item.totalOil,
                " mL/100g"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Myrcene" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                item.myrcene,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Humulene" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                item.humulene,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Caryophyllene" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                item.caryophyllene,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Farnesene" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                item.farnesene,
                "%"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Aroma Descriptors" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1", children: (_a = item.aromaDescriptors) == null ? void 0 : _a.map((desc, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "text-sm flex items-start gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary mt-1", children: "•" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: desc })
          ] }, idx)) }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Flavor Descriptors" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1", children: (_b = item.flavorDescriptors) == null ? void 0 : _b.map((desc, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "text-sm flex items-start gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary mt-1", children: "•" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: desc })
          ] }, idx)) }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md lg:col-span-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Operational Notes" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: item.operationalNotes }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "inventory", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Inventory Settings" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Reorder Point" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                item.reorderPoint,
                " ",
                item.unit
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Lot Tracking" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: "Enabled" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-4 w-4" }),
            "Current Locations"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: mockLocations$1.map((loc, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center p-2 border rounded", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: loc.location }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-muted-foreground", children: [
              loc.quantity,
              " ",
              loc.unit
            ] })
          ] }, idx)) }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "history", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-4 w-4" }),
          "Recent Movements"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: mockHistory$1.map((entry, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 border rounded", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: entry.type }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: entry.reference })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "p",
              {
                className: `text-sm font-medium ${entry.quantity > 0 ? "text-green-600" : "text-red-600"}`,
                children: [
                  entry.quantity > 0 ? "+" : "",
                  entry.quantity,
                  " ",
                  entry.unit
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: entry.date })
          ] })
        ] }, idx)) }) })
      ] }) })
    ] })
  ] });
}
const mockFruitData = {
  name: "Raspberry Puree",
  category: "fruit",
  quantity: 120,
  unit: "kg",
  reorderPoint: 50,
  cost: 8.75,
  trend: "stable",
  fruitType: "puree",
  origin: "Oregon, USA",
  sugars: 45,
  brix: 11.5,
  pH: 3.2,
  titratableAcidity: 2.8,
  malicAcid: 1.5,
  citricAcid: 0.8,
  tannins: 120,
  yan: 85,
  flavorProfile: [
    "Bright raspberry",
    "Tart berry",
    "Floral notes",
    "Sweet finish"
  ],
  operationalNotes: "Premium raspberry puree. Add during secondary fermentation or conditioning. Typical usage: 0.5-1.5 kg per hectoliter. Store frozen until use."
};
const mockLocations = [
  { location: "Cold Storage - Freezer C", quantity: 80, unit: "kg" },
  { location: "Cold Storage - Freezer D", quantity: 40, unit: "kg" }
];
const mockHistory = [
  { date: "2024-12-23", type: "Receipt", quantity: 150, unit: "kg", reference: "PO-2024-201" },
  { date: "2024-12-20", type: "Consumption", quantity: -20, unit: "kg", reference: "Batch #046" },
  { date: "2024-12-17", type: "Consumption", quantity: -10, unit: "kg", reference: "Batch #043" }
];
function FruitDetailsPage() {
  var _a;
  const navigate = useNavigate();
  const item = mockFruitData;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => navigate("/"),
          className: "mb-4 gap-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
            "Back to Dashboard"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-start justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: item.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: item.category.toUpperCase() }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "capitalize", children: item.fruitType }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: item.origin })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "On Hand" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl font-bold", children: item.quantity }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: item.unit })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
            "Reorder at ",
            item.reorderPoint,
            " ",
            item.unit
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "Last Cost" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-2xl font-bold", children: [
            "$",
            item.cost.toFixed(2)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-muted-foreground", children: [
            "per ",
            item.unit
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "Usage Trend" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-5 w-5 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl font-bold capitalize", children: item.trend })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Last 30 days" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "Active Locations" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl font-bold", children: mockLocations.length }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: "locations" })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "general", className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "general", children: "General" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "specs", children: "Fruit Specifications" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "inventory", children: "Inventory" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "history", children: "History" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "general", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "General Information" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Description" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1", children: "Premium raspberry puree from Oregon. Provides bright, tart berry character ideal for fruit beers, ciders, and specialty beverages." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Category" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 capitalize", children: item.category })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Unit of Measure" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1", children: item.unit })
            ] })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "specs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Sugar & Acidity" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Sugars" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                item.sugars,
                " g/kg"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Brix" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                item.brix,
                "°Bx"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "pH" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: item.pH })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Titratable Acidity" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                item.titratableAcidity,
                " g/L"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Acid Composition" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Malic Acid" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                item.malicAcid,
                " g/L"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Citric Acid" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                item.citricAcid,
                " g/L"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Tannins" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                item.tannins,
                " mg/L"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "YAN" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                item.yan,
                " mg/L"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md lg:col-span-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Flavor Profile" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1", children: (_a = item.flavorProfile) == null ? void 0 : _a.map((note, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "text-sm flex items-start gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary mt-1", children: "•" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: note })
          ] }, idx)) }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md lg:col-span-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Operational Notes" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: item.operationalNotes }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "inventory", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Inventory Settings" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Reorder Point" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                item.reorderPoint,
                " ",
                item.unit
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Lot Tracking" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: "Enabled" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-4 w-4" }),
            "Current Locations"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: mockLocations.map((loc, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center p-2 border rounded", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: loc.location }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-muted-foreground", children: [
              loc.quantity,
              " ",
              loc.unit
            ] })
          ] }, idx)) }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "history", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-glow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-4 w-4" }),
          "Recent Movements"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: mockHistory.map((entry, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 border rounded", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: entry.type }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: entry.reference })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "p",
              {
                className: `text-sm font-medium ${entry.quantity > 0 ? "text-green-600" : "text-red-600"}`,
                children: [
                  entry.quantity > 0 ? "+" : "",
                  entry.quantity,
                  " ",
                  entry.unit
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: entry.date })
          ] })
        ] }, idx)) }) })
      ] }) })
    ] })
  ] });
}
const mockItem = {
  itemCode: "YEAST-001",
  name: "SafAle US-05",
  description: "American ale yeast producing well balanced beers with low diacetyl and a very clean, crisp end palate.",
  category: "yeast",
  subcategory: "ale_yeast",
  defaultUom: "g",
  alternateUom: "oz",
  conversionFactor: 28.35,
  lastCost: 4.99,
  costUom: "pack",
  reorderPoint: 10,
  reorderQty: 50,
  quantity: 45,
  unit: "packs",
  trend: "stable",
  yeastData: {
    manufacturer: "Fermentis",
    strainCode: "US-05",
    strainName: "SafAle US-05",
    yeastFamily: "ale",
    form: "dry",
    attenuationMinPct: 78,
    attenuationMaxPct: 82,
    alcoholTolerancePct: 12,
    tempRangeCMin: 15,
    tempRangeCMax: 24,
    flocculation: "med",
    fermentationSpeed: "med",
    preferredSugars: ["glucose", "maltose", "sucrose"],
    sorbitolNonfermentable: true,
    glycerolProduction: "low",
    h2sRisk: "low",
    esterProfile: ["fruity", "citrus"],
    phenolProfile: [],
    mouthfeelEffect: "neutral",
    aromaticIntensity: 2,
    nutrientDemand: "low",
    rehydrationRequired: false,
    killerFactor: false
  }
};
function ItemDetailsPage() {
  var _a, _b, _c;
  const navigate = useNavigate();
  const item = mockItem;
  const isLowStock = item.quantity <= item.reorderPoint;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto p-6 max-w-6xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => navigate("/os"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: item.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "capitalize", children: item.category }),
          isLowStock
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: item.itemCode })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { children: "Edit Item" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm font-medium text-muted-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-4 w-4" }),
          "On Hand"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xl font-bold font-mono", children: [
            item.quantity,
            " ",
            item.unit
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
            "Reorder at ",
            item.reorderPoint,
            " ",
            item.unit
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm font-medium text-muted-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-4 w-4" }),
          "Last Cost"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xl font-bold font-mono", children: [
            "$",
            (_a = item.lastCost) == null ? void 0 : _a.toFixed(2)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
            "per ",
            item.costUom
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm font-medium text-muted-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-4 w-4" }),
          "Usage Trend"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold capitalize", children: item.trend }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Last 30 days" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm font-medium text-muted-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-4 w-4" }),
          "Locations"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold", children: "3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Active locations" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "general", className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid w-full grid-cols-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "general", children: "General" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "specifications", children: "Specifications" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "inventory", children: "Inventory" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "history", children: "History" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "general", className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Item Information" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Basic details about this inventory item" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Description" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1", children: item.description })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Category" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 capitalize", children: item.category })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Subcategory" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 capitalize", children: (_b = item.subcategory) == null ? void 0 : _b.replace("_", " ") })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Default UOM" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1", children: item.defaultUom })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Alternate UOM" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1", children: [
                item.alternateUom,
                " (1 ",
                item.alternateUom,
                " = ",
                item.conversionFactor,
                " ",
                item.defaultUom,
                ")"
              ] })
            ] })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "specifications", className: "space-y-4", children: item.yeastData && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Yeast Specifications" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Technical data for fermentation planning" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Manufacturer" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1", children: item.yeastData.manufacturer })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Strain Code" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1", children: item.yeastData.strainCode })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Yeast Family" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 capitalize", children: item.yeastData.yeastFamily })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Form" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 capitalize", children: item.yeastData.form })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Attenuation" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1", children: [
                  item.yeastData.attenuationMinPct,
                  "% - ",
                  item.yeastData.attenuationMaxPct,
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Alcohol Tolerance" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1", children: [
                  item.yeastData.alcoholTolerancePct,
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Flocculation" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 capitalize", children: item.yeastData.flocculation })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Temperature Range" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1", children: [
                  item.yeastData.tempRangeCMin,
                  "°C - ",
                  item.yeastData.tempRangeCMax,
                  "°C"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Fermentation Speed" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 capitalize", children: item.yeastData.fermentationSpeed })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Sensory Profile" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Flavor and aroma characteristics" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Ester Profile" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 mt-2", children: (_c = item.yeastData.esterProfile) == null ? void 0 : _c.map((ester) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: ester }, ester)) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Mouthfeel Effect" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 capitalize", children: item.yeastData.mouthfeelEffect })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Aromatic Intensity" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1", children: [
                  item.yeastData.aromaticIntensity,
                  " / 5"
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Operational Notes" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Handling and usage information" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Nutrient Demand" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 capitalize", children: item.yeastData.nutrientDemand })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Rehydration Required" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1", children: item.yeastData.rehydrationRequired ? "Yes" : "No" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "H2S Risk" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 capitalize", children: item.yeastData.h2sRisk })
            ] })
          ] }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "inventory", className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Inventory Settings" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Reorder points and tracking preferences" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Reorder Point" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1", children: [
                  item.reorderPoint,
                  " ",
                  item.unit
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Reorder Quantity" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1", children: [
                  item.reorderQty,
                  " ",
                  item.unit
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Lot Tracking" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1", children: "Enabled" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Current Locations" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Where this item is stored" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center p-3 border rounded-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: "WH1-A-12-3" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Main Warehouse - Zone A" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono font-medium", children: [
                "30 ",
                item.unit
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center p-3 border rounded-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: "WH1-B-05-1" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Main Warehouse - Zone B" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono font-medium", children: [
                "10 ",
                item.unit
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center p-3 border rounded-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: "COLD-R2-S3" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Cold Storage - Rack 2" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono font-medium", children: [
                "5 ",
                item.unit
              ] })
            ] })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "history", className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Recent Movements" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Last 10 inventory transactions" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start p-3 border rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: "Receipt" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "PO-2024-001 • WH1-A-12-3" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Dec 20, 2024 10:30 AM" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono font-medium text-green-600", children: [
              "+50 ",
              item.unit
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start p-3 border rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: "Consumption" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Batch #2024-045 • Production" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Dec 18, 2024 2:15 PM" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono font-medium text-destructive", children: [
              "-2 ",
              item.unit
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start p-3 border rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: "Transfer" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "WH1-A-12-3 → COLD-R2-S3" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Dec 15, 2024 9:00 AM" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono font-medium", children: [
              "5 ",
              item.unit
            ] })
          ] })
        ] }) })
      ] }) })
    ] })
  ] });
}
const mockItemCategories = {
  "1": "yeast",
  "2": "hops",
  "3": "malt",
  "4": "packaging",
  "5": "packaging",
  "6": "fruit"
};
function ItemDetailsRouter() {
  const { id } = useParams();
  const category = id ? mockItemCategories[id] : void 0;
  switch (category) {
    case "yeast":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(YeastDetailsPage, {});
    case "malt":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(MaltDetailsPage, {});
    case "hops":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(HopsDetailsPage, {});
    case "fruit":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(FruitDetailsPage, {});
    default:
      return /* @__PURE__ */ jsxRuntimeExports.jsx(ItemDetailsPage, {});
  }
}
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);
const Label = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Root$2,
  {
    ref,
    className: cn(labelVariants(), className),
    ...props
  }
));
Label.displayName = Root$2.displayName;
const ScrollArea = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  Root$3,
  {
    ref,
    className: cn("relative overflow-hidden", className),
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Viewport$1, { className: "h-full w-full rounded-[inherit]", children }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollBar, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Corner, {})
    ]
  }
));
ScrollArea.displayName = Root$3.displayName;
const ScrollBar = reactExports.forwardRef(({ className, orientation = "vertical", ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  ScrollAreaScrollbar,
  {
    ref,
    orientation,
    className: cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollAreaThumb, { className: "relative flex-1 rounded-full bg-border" })
  }
));
ScrollBar.displayName = ScrollAreaScrollbar.displayName;
const FLOW_WIDGET_TYPES$1 = [
  "vessel",
  "pump",
  "valve",
  "sensor",
  "heater"
];
const nowIso = () => (/* @__PURE__ */ new Date()).toISOString();
const makeId = (prefix) => {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
};
const defaultWidgetConfig = (widgetType) => {
  switch (widgetType) {
    case "vessel":
      return {
        vesselType: "fermentor_conical",
        capacity: 100,
        currentLevel: 0,
        temperature: 20
      };
    case "pump":
      return { state: "off", flowRate: 0 };
    case "valve":
      return { valveType: "2way", position: "closed" };
    case "sensor":
      return {
        value: 0,
        sensorType: "temperature",
        unit: "F",
        dummyMode: true,
        dummyValue: 68,
        sensorSampleAtMs: Date.now(),
        min: 0,
        max: 250,
        step: 1
      };
    case "heater":
      return { state: "off", setpoint: 68, temperature: 20 };
    case "pid":
      return {
        setpoint: 68,
        value: 68,
        autoProceed: false,
        requireUserProceed: true
      };
    case "button":
      return {
        state: "off",
        autoProceed: false,
        requireUserProceed: true
      };
    case "switch":
      return { state: "off" };
    case "slider":
      return {
        value: 68,
        setpointType: "temperature",
        unit: "F",
        min: 32,
        max: 212,
        step: 1
      };
    case "glycol_controller":
      return {
        state: "off",
        value: 68,
        setpoint: 65,
        unit: "F",
        glycolController: {
          compareTo: "threshold",
          threshold: 65,
          hysteresis: 1,
          pollMs: 1e3
        }
      };
    case "hlt_controller":
      return {
        state: "off",
        value: 150,
        setpoint: 152,
        unit: "F",
        min: 50,
        max: 180,
        step: 0.5,
        hltController: {
          enabled: false,
          compareTo: "threshold",
          threshold: 152,
          hysteresis: 1,
          pollMs: 1e3
        }
      };
    case "co2_controller":
      return {
        state: "off",
        value: 0,
        setpoint: 12,
        unit: "PSI",
        min: 0,
        max: 40,
        step: 0.1,
        co2Controller: {
          enabled: false,
          beverageStyle: "beer",
          targetMode: "psi",
          targetVolumes: 2.4,
          beverageTempF: 38,
          compareTo: "threshold",
          threshold: 12,
          hysteresis: 0.5,
          pollMs: 1e3,
          maxPressurePsi: 25,
          sampleTimeoutMs: 0,
          maxPressureRisePsiPerMin: 0,
          purgeActive: false,
          purgeCycles: 3,
          purgeInjectMs: 4e3,
          purgeVentMs: 2e3,
          emitAlarmEvents: true,
          runtimeState: "disabled"
        }
      };
    case "transfer_controller":
      return {
        state: "off",
        value: 60,
        unit: "%",
        min: 0,
        max: 100,
        step: 1,
        transferController: {
          enabled: false,
          transferActive: false,
          autoMapWiring: true,
          pumpMode: "fsd",
          transferSpeedPct: 60,
          rampSeconds: 5,
          pollMs: 500,
          sourceValveDeviceIds: [],
          destinationValveDeviceIds: [],
          runtimeState: "disabled"
        }
      };
    case "recipe_executor":
      return {
        state: "off",
        recipeId: "",
        recipeName: "",
        recipeFormat: void 0,
        recipeSteps: [],
        recipeExecutor: {
          enabled: false,
          running: false,
          paused: false,
          awaitingConfirm: false,
          currentStepIndex: 0,
          autoProceedDefault: false,
          runtimeState: "disabled"
        }
      };
    case "automation":
      return {
        automationMode: "simple",
        simpleAutomation: {
          compareTo: "threshold",
          operator: "gt",
          threshold: 69,
          hysteresis: 1,
          command: "on_off",
          onValue: "on",
          offValue: "off",
          pollMs: 1e3
        },
        automationSteps: [],
        requireUserProceed: true
      };
    case "display":
      return { value: "--" };
    case "note":
      return {};
    default:
      return {};
  }
};
const createNode = (widgetType, position = { x: 120, y: 120 }, label) => {
  const id = makeId(widgetType);
  return {
    id,
    type: "widget",
    position,
    data: {
      label: `${widgetType.toUpperCase()} ${id.slice(-4)}`,
      widgetType,
      config: defaultWidgetConfig(widgetType)
    }
  };
};
const createEdge = (source, target, kind, medium) => ({
  id: makeId("edge"),
  source,
  target,
  type: kind === "fluid" ? "smoothstep" : "default",
  data: kind === "fluid" ? { kind, medium: medium ?? "product" } : { kind }
});
const createPage = (name) => {
  const now = nowIso();
  return {
    id: makeId("page"),
    name,
    mode: "draft",
    nodes: [],
    edges: [],
    tags: [],
    createdAt: now,
    updatedAt: now
  };
};
const createDefaultProject = () => {
  const now = nowIso();
  return {
    schemaVersion: "1.0.0",
    id: makeId("project"),
    name: "BevForge OS Canvas Project",
    pages: [createPage("Master Layout")],
    createdAt: now,
    updatedAt: now
  };
};
const createRegisteredDevice = (name, type, id) => {
  const now = nowIso();
  return {
    id: id ?? makeId("dev"),
    name,
    type,
    driver: "dummy",
    config: {},
    createdAt: now,
    updatedAt: now
  };
};
const FLUID_COLORS = {
  product: { active: "#0ea5e9", inactive: "#7dd3fc" },
  glycol: { active: "#06b6d4", inactive: "#67e8f9" },
  co2: { active: "#22c55e", inactive: "#86efac" },
  cip: { active: "#10b981", inactive: "#6ee7b7" },
  water: { active: "#3b82f6", inactive: "#93c5fd" },
  gas: { active: "#f59e0b", inactive: "#fcd34d" }
};
const FLOW_SET = new Set(FLOW_WIDGET_TYPES$1);
const isFlowNode = (node) => Boolean(node && FLOW_SET.has(node.data.widgetType));
const canPassThrough = (node) => {
  const { widgetType, config } = node.data;
  if (widgetType === "valve") {
    if (config.valveType === "3way") {
      return Boolean(config.position);
    }
    return config.position !== "closed";
  }
  if (widgetType === "pump") {
    return config.state === "on";
  }
  return true;
};
const isFluidEdge = (edge) => {
  var _a;
  return (((_a = edge.data) == null ? void 0 : _a.kind) ?? "fluid") === "fluid";
};
const edgeMedium = (edge) => {
  var _a;
  return ((_a = edge.data) == null ? void 0 : _a.medium) ?? "product";
};
const activeFluidStyle = (medium) => ({
  stroke: FLUID_COLORS[medium].active,
  strokeWidth: 3,
  filter: `drop-shadow(0 0 4px ${FLUID_COLORS[medium].active})`
});
const inactiveFluidStyle = (medium) => ({
  stroke: FLUID_COLORS[medium].inactive,
  strokeWidth: 2,
  opacity: 0.95
});
const matchesHandle = (handleId, expected) => {
  if (!handleId) return true;
  return expected.includes(handleId);
};
const annotateFluidEdges = (nodes, edges) => {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const outgoingBySource = /* @__PURE__ */ new Map();
  for (const edge of edges) {
    if (!isFluidEdge(edge)) {
      continue;
    }
    const list = outgoingBySource.get(edge.source) ?? [];
    list.push(edge);
    outgoingBySource.set(edge.source, list);
  }
  const activeEdgeIds = /* @__PURE__ */ new Set();
  const media = ["product", "glycol", "co2", "cip", "water", "gas"];
  for (const medium of media) {
    const queue = nodes.filter(
      (node) => node.data.widgetType === "pump" && node.data.config.state === "on"
    ).map((node) => ({ id: node.id, pressurized: true }));
    const visited = /* @__PURE__ */ new Set();
    while (queue.length > 0) {
      const current = queue.shift();
      const visitKey = `${current.id}:${current.pressurized ? "1" : "0"}`;
      if (visited.has(visitKey)) {
        continue;
      }
      visited.add(visitKey);
      const currentNode = nodeById.get(current.id);
      if (!isFlowNode(currentNode) || !canPassThrough(currentNode)) {
        continue;
      }
      const outgoing = outgoingBySource.get(current.id) ?? [];
      for (const edge of outgoing) {
        if (edgeMedium(edge) !== medium) {
          continue;
        }
        if (currentNode.data.widgetType === "valve") {
          if (currentNode.data.config.valveType === "3way") {
            const position = currentNode.data.config.position;
            const selectedOut = position === "c_to_b" || position === "b_to_c" ? `${medium === "product" ? "fluid" : medium}-out-b` : `${medium === "product" ? "fluid" : medium}-out-a`;
            const fallbackOut = position === "c_to_b" || position === "b_to_c" ? "fluid-out-b" : "fluid-out-a";
            if (!matchesHandle(edge.sourceHandle, [selectedOut, fallbackOut])) {
              continue;
            }
          } else {
            const expectedOut = `${medium === "product" ? "fluid" : medium}-out`;
            if (!matchesHandle(edge.sourceHandle, [expectedOut, "fluid-out"])) {
              continue;
            }
          }
        }
        const targetNode = nodeById.get(edge.target);
        if (!isFlowNode(targetNode)) {
          continue;
        }
        if (targetNode.data.widgetType === "valve") {
          if (targetNode.data.config.valveType === "3way") {
            const expectedIn = `${medium === "product" ? "fluid" : medium}-in-c`;
            if (!matchesHandle(edge.targetHandle, [expectedIn, "fluid-in-c"])) {
              continue;
            }
          } else {
            const expectedIn = `${medium === "product" ? "fluid" : medium}-in`;
            if (!matchesHandle(edge.targetHandle, [expectedIn, "fluid-in"])) {
              continue;
            }
          }
        }
        const nextPressurized = current.pressurized || targetNode.data.widgetType === "pump";
        if (canPassThrough(targetNode) && nextPressurized) {
          activeEdgeIds.add(edge.id);
          queue.push({ id: targetNode.id, pressurized: nextPressurized });
        }
      }
    }
  }
  return edges.map((edge) => {
    if (!isFluidEdge(edge)) {
      return {
        ...edge,
        animated: false
      };
    }
    const isActive = activeEdgeIds.has(edge.id);
    const medium = edgeMedium(edge);
    return {
      ...edge,
      type: "smoothstep",
      animated: isActive,
      data: {
        ...edge.data ?? { kind: "fluid" },
        kind: "fluid",
        medium,
        active: isActive
      },
      style: isActive ? activeFluidStyle(medium) : inactiveFluidStyle(medium)
    };
  });
};
const DATA_PORTS = [
  { id: "data-in", kind: "data", direction: "in" },
  { id: "data-out", kind: "data", direction: "out" }
];
const FLUID_PORTS = [
  { id: "fluid-in", kind: "fluid", direction: "in", medium: "dynamic" },
  { id: "fluid-out", kind: "fluid", direction: "out", medium: "dynamic" }
];
const FLUID_3WAY_PORTS = [
  { id: "fluid-in-c", kind: "fluid", direction: "in", medium: "dynamic" },
  { id: "fluid-out-a", kind: "fluid", direction: "out", medium: "dynamic" },
  { id: "fluid-out-b", kind: "fluid", direction: "out", medium: "dynamic" }
];
const VESSEL_AUX_PORTS = [
  { id: "glycol-in", kind: "fluid", direction: "in", medium: "glycol" },
  { id: "glycol-out", kind: "fluid", direction: "out", medium: "glycol" },
  { id: "gas-in", kind: "fluid", direction: "in", medium: "gas" },
  { id: "gas-out", kind: "fluid", direction: "out", medium: "gas" }
];
const POWER_PORTS = [
  { id: "power-in", kind: "power", direction: "in" },
  { id: "ground-in", kind: "ground", direction: "in" }
];
const FLOW_WIDGET_TYPES = /* @__PURE__ */ new Set(["vessel", "pump", "valve", "sensor", "heater"]);
const getNodePortContracts = (node) => {
  const ports = [...DATA_PORTS];
  const { widgetType, config } = node.data;
  if (widgetType === "valve" && config.valveType === "3way") {
    ports.push(...FLUID_3WAY_PORTS);
  } else if (FLOW_WIDGET_TYPES.has(widgetType)) {
    ports.push(...FLUID_PORTS);
  }
  if (widgetType === "vessel") {
    ports.push(...VESSEL_AUX_PORTS);
  }
  if (widgetType === "pump" || widgetType === "heater" || widgetType === "pid") {
    ports.push(...POWER_PORTS);
  }
  return ports;
};
const resolveNodePort = (node, handleId) => {
  if (!node || !handleId) return null;
  return getNodePortContracts(node).find((port) => port.id === handleId) ?? null;
};
const resolveConnectionCompatibility = ({
  sourcePort,
  targetPort,
  activeFluidMedium
}) => {
  if (sourcePort.direction !== "out" || targetPort.direction !== "in") {
    return { ok: false, reason: "Connect OUT handle to IN handle." };
  }
  if (sourcePort.kind !== targetPort.kind) {
    return { ok: false, reason: "Connection type mismatch. Use matching colors/types only." };
  }
  if (sourcePort.kind === "fluid") {
    const sourceMedium = sourcePort.medium && sourcePort.medium !== "dynamic" ? sourcePort.medium : void 0;
    const targetMedium = targetPort.medium && targetPort.medium !== "dynamic" ? targetPort.medium : void 0;
    if (sourceMedium && targetMedium && sourceMedium !== targetMedium) {
      return { ok: false, reason: "Fluid medium mismatch. Connect ports for the same medium." };
    }
    return {
      ok: true,
      kind: "fluid",
      medium: sourceMedium ?? targetMedium ?? activeFluidMedium
    };
  }
  return { ok: true, kind: sourcePort.kind };
};
const noopConfigure = () => {
};
const noopControl = () => {
};
const CanvasRuntimeContext = reactExports.createContext({
  mode: "draft",
  onConfigure: noopConfigure,
  onControl: noopControl
});
const CanvasRuntimeProvider = CanvasRuntimeContext.Provider;
const useCanvasRuntime = () => reactExports.useContext(CanvasRuntimeContext);
const flowTypes = /* @__PURE__ */ new Set(["vessel", "pump", "valve", "sensor", "heater"]);
const labelByType = {
  vessel: "Vessel",
  pump: "Pump",
  valve: "Valve",
  sensor: "Sensor",
  heater: "Heater",
  pid: "PID",
  button: "Button",
  switch: "Switch",
  slider: "Slider",
  glycol_controller: "Glycol Ctrl",
  hlt_controller: "HLT Ctrl",
  co2_controller: "CO2 Ctrl",
  transfer_controller: "Transfer Ctrl",
  recipe_executor: "Recipe Exec",
  automation: "Automation",
  display: "Display",
  note: "Note"
};
const accentByType = {
  vessel: "#0ea5e9",
  pump: "#2563eb",
  valve: "#06b6d4",
  sensor: "#f59e0b",
  heater: "#ef4444",
  pid: "#8b5cf6",
  button: "#22c55e",
  switch: "#16a34a",
  slider: "#f97316",
  glycol_controller: "#0ea5e9",
  hlt_controller: "#f97316",
  co2_controller: "#22c55e",
  transfer_controller: "#2563eb",
  recipe_executor: "#7c3aed",
  automation: "#6366f1",
  display: "#14b8a6",
  note: "#64748b"
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const WidgetNode = ({ id, data, selected }) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D;
  const { mode, onControl } = useCanvasRuntime();
  const isFlowType = flowTypes.has(data.widgetType);
  const isThreeWayValve = data.widgetType === "valve" && data.config.valveType === "3way";
  const stateValue = data.widgetType === "valve" ? data.config.position ?? (isThreeWayValve ? "c_to_a" : "closed") : data.config.state ?? data.config.value ?? "--";
  const unitSuffix = data.config.unit ? ` ${data.config.unit}` : "";
  const accent = accentByType[data.widgetType] ?? "#64748b";
  const primaryValue = data.widgetType === "sensor" || data.widgetType === "slider" ? `${String(data.config.value ?? "--")}${unitSuffix}` : data.widgetType === "glycol_controller" ? data.config.state === "on" ? "COOLING" : "IDLE" : data.widgetType === "hlt_controller" ? ((_a = data.config.hltController) == null ? void 0 : _a.enabled) === false ? "DISABLED" : data.config.state === "on" ? "HEATING" : "IDLE" : data.widgetType === "co2_controller" ? ((_b = data.config.co2Controller) == null ? void 0 : _b.runtimeState) === "safety_stop" ? "SAFETY" : ((_c = data.config.co2Controller) == null ? void 0 : _c.runtimeState) === "pressurizing" ? "PRESSURIZING" : ((_d = data.config.co2Controller) == null ? void 0 : _d.runtimeState) === "venting" ? "VENTING" : ((_e = data.config.co2Controller) == null ? void 0 : _e.enabled) === false ? "DISABLED" : "HOLD" : data.widgetType === "transfer_controller" ? ((_f = data.config.transferController) == null ? void 0 : _f.enabled) === false ? "DISABLED" : ((_g = data.config.transferController) == null ? void 0 : _g.runtimeState) === "running" ? "RUNNING" : "IDLE" : data.widgetType === "recipe_executor" ? ((_h = data.config.recipeExecutor) == null ? void 0 : _h.enabled) === false ? "DISABLED" : ((_i = data.config.recipeExecutor) == null ? void 0 : _i.runtimeState) === "completed" ? "DONE" : ((_j = data.config.recipeExecutor) == null ? void 0 : _j.runtimeState) === "waiting_confirm" ? "CONFIRM" : ((_k = data.config.recipeExecutor) == null ? void 0 : _k.runtimeState) === "paused" ? "PAUSED" : ((_l = data.config.recipeExecutor) == null ? void 0 : _l.runtimeState) === "running" ? "RUNNING" : "IDLE" : data.widgetType === "valve" ? String(stateValue).replaceAll("_", " ").toUpperCase() : data.widgetType === "automation" ? "READY" : String(stateValue).toUpperCase();
  const vesselCapacity = Number(data.config.capacity ?? 100);
  const vesselLevel = Number(data.config.currentLevel ?? 0);
  const vesselType = data.config.vesselType ?? "fermentor_conical";
  const vesselFillPct = clamp(
    vesselCapacity > 0 ? vesselLevel / vesselCapacity * 100 : 0,
    0,
    100
  );
  const vesselFluidColor = data.config.temperature && Number(data.config.temperature) >= 78 ? "#fb7185" : "#38bdf8";
  const vesselTemp = Number(data.config.temperature ?? 0);
  const vesselFlow = Number(data.config.flowRate ?? 0);
  const pumpIsOn = data.config.state === "on";
  const valveIsOpen = data.config.position === "open" || data.config.position === "c_to_a" || data.config.position === "c_to_b";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `group relative min-w-[170px] rounded-md border border-white/30 bg-background/65 p-2 text-card-foreground shadow-[0_10px_30px_rgba(0,0,0,0.15)] backdrop-blur-md ${selected ? "ring-2 ring-primary" : ""}`,
      style: {
        borderColor: `${accent}80`,
        boxShadow: `0 0 0 1px ${accent}2e, 0 10px 30px rgba(0,0,0,0.15), 0 0 22px ${accent}26`
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Handle,
          {
            type: "target",
            position: Position.Left,
            id: "data-in",
            style: { background: "#f59e0b" }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pointer-events-none absolute -left-14 top-[48%] rounded bg-amber-100 px-1 py-0.5 text-[10px] text-amber-900 opacity-0 transition-opacity group-hover:opacity-100", children: "Data In" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Handle,
          {
            type: "source",
            position: Position.Right,
            id: "data-out",
            style: { background: "#f59e0b" }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pointer-events-none absolute -right-16 top-[48%] rounded bg-amber-100 px-1 py-0.5 text-[10px] text-amber-900 opacity-0 transition-opacity group-hover:opacity-100", children: "Data Out" }),
        data.widgetType === "vessel" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Handle,
            {
              type: "target",
              position: Position.Left,
              id: "glycol-in",
              style: { top: "64%", background: "#06b6d4" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pointer-events-none absolute -left-16 top-[61%] rounded bg-cyan-100 px-1 py-0.5 text-[10px] text-cyan-900 opacity-0 transition-opacity group-hover:opacity-100", children: "Glycol In" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Handle,
            {
              type: "source",
              position: Position.Right,
              id: "glycol-out",
              style: { top: "64%", background: "#06b6d4" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pointer-events-none absolute -right-16 top-[61%] rounded bg-cyan-100 px-1 py-0.5 text-[10px] text-cyan-900 opacity-0 transition-opacity group-hover:opacity-100", children: "Glycol Out" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Handle,
            {
              type: "target",
              position: Position.Top,
              id: "gas-in",
              style: { left: "72%", background: "#f59e0b" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pointer-events-none absolute left-[72%] top-0 -translate-x-1/2 -translate-y-5 rounded bg-amber-100 px-1 py-0.5 text-[10px] text-amber-900 opacity-0 transition-opacity group-hover:opacity-100", children: "Gas In" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Handle,
            {
              type: "source",
              position: Position.Bottom,
              id: "gas-out",
              style: { left: "72%", background: "#f59e0b" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pointer-events-none absolute bottom-0 left-[72%] -translate-x-1/2 translate-y-5 rounded bg-amber-100 px-1 py-0.5 text-[10px] text-amber-900 opacity-0 transition-opacity group-hover:opacity-100", children: "Gas Out" })
        ] }),
        isThreeWayValve ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Handle,
            {
              type: "target",
              position: Position.Left,
              id: "fluid-in-c",
              style: { top: "30%", background: "#0ea5e9" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pointer-events-none absolute -left-16 top-[28%] rounded bg-sky-100 px-1 py-0.5 text-[10px] text-sky-900 opacity-0 transition-opacity group-hover:opacity-100", children: "Fluid In C" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Handle,
            {
              type: "source",
              position: Position.Top,
              id: "fluid-out-a",
              style: { background: "#0ea5e9" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-5 rounded bg-sky-100 px-1 py-0.5 text-[10px] text-sky-900 opacity-0 transition-opacity group-hover:opacity-100", children: "Fluid Out A" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Handle,
            {
              type: "source",
              position: Position.Bottom,
              id: "fluid-out-b",
              style: { background: "#0ea5e9" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-5 rounded bg-sky-100 px-1 py-0.5 text-[10px] text-sky-900 opacity-0 transition-opacity group-hover:opacity-100", children: "Fluid Out B" })
        ] }) : isFlowType && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Handle,
            {
              type: "target",
              position: Position.Top,
              id: "fluid-in",
              style: { background: "#0ea5e9" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-5 rounded bg-sky-100 px-1 py-0.5 text-[10px] text-sky-900 opacity-0 transition-opacity group-hover:opacity-100", children: "Fluid In" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Handle,
            {
              type: "source",
              position: Position.Bottom,
              id: "fluid-out",
              style: { background: "#0ea5e9" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-5 rounded bg-sky-100 px-1 py-0.5 text-[10px] text-sky-900 opacity-0 transition-opacity group-hover:opacity-100", children: "Fluid Out" })
        ] }),
        (data.widgetType === "pump" || data.widgetType === "heater" || data.widgetType === "pid") && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Handle,
            {
              type: "target",
              position: Position.Left,
              id: "power-in",
              style: { top: "78%", background: "#dc2626" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pointer-events-none absolute -left-16 top-[74%] rounded bg-red-100 px-1 py-0.5 text-[10px] text-red-900 opacity-0 transition-opacity group-hover:opacity-100", children: "Power In" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Handle,
            {
              type: "target",
              position: Position.Left,
              id: "ground-in",
              style: { top: "90%", background: "#111827" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pointer-events-none absolute -left-[4.2rem] top-[88%] rounded bg-slate-200 px-1 py-0.5 text-[10px] text-slate-900 opacity-0 transition-opacity group-hover:opacity-100", children: "Ground In" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-[10px] font-semibold uppercase text-muted-foreground", children: labelByType[data.widgetType] ?? data.widgetType }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-semibold", children: data.label })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded bg-muted/70 px-1.5 py-0.5 text-[10px] uppercase", children: mode })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md border border-white/25 bg-white/20 px-2 py-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-semibold leading-tight", children: primaryValue }) }),
        data.widgetType === "vessel" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 rounded-lg border border-slate-600/70 bg-[#1a2137] p-2 text-slate-100", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 120 96", className: "h-24 w-full", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("defs", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: `tank-glass-${id}`, x1: "0", x2: "0", y1: "0", y2: "1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: "#a5b4fc", stopOpacity: "0.12" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: "#94a3b8", stopOpacity: "0.08" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: `tank-fluid-${id}`, x1: "0", x2: "0", y1: "0", y2: "1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: vesselFluidColor, stopOpacity: "0.92" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: vesselFluidColor, stopOpacity: "0.68" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("clipPath", { id: `tank-clip-${id}`, children: [
                vesselType === "fermentor_conical" && /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M30 16 Q30 10 36 10 L84 10 Q90 10 90 16 L90 62 Q90 66 86 70 L68 86 Q64 90 60 90 Q56 90 52 86 L34 70 Q30 66 30 62 Z" }),
                vesselType === "bright_tank" && /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "24", y: "18", width: "72", height: "56", rx: "20" }),
                vesselType === "mash_tun" && /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M24 24 Q24 16 32 16 L88 16 Q96 16 96 24 L92 72 Q91 80 82 80 L38 80 Q29 80 28 72 Z" }),
                vesselType === "hlt" && /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M28 14 Q28 10 32 10 L88 10 Q92 10 92 14 L92 82 Q92 86 88 86 L32 86 Q28 86 28 82 Z" }),
                vesselType === "brew_kettle" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("ellipse", { cx: "60", cy: "20", rx: "40", ry: "8" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "20", y: "20", width: "80", height: "54" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("ellipse", { cx: "60", cy: "74", rx: "40", ry: "8" })
                ] }),
                vesselType === "generic" && /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "30", y: "10", width: "60", height: "76", rx: "10" })
              ] })
            ] }),
            vesselType === "fermentor_conical" && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "path",
              {
                d: "M30 16 Q30 10 36 10 L84 10 Q90 10 90 16 L90 62 Q90 66 86 70 L68 86 Q64 90 60 90 Q56 90 52 86 L34 70 Q30 66 30 62 Z",
                fill: `url(#tank-glass-${id})`,
                stroke: "#a5b4fc",
                strokeOpacity: "0.7",
                strokeWidth: "1.2"
              }
            ),
            vesselType === "bright_tank" && /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "24", y: "18", width: "72", height: "56", rx: "20", fill: `url(#tank-glass-${id})`, stroke: "#a5b4fc", strokeOpacity: "0.7", strokeWidth: "1.2" }),
            vesselType === "mash_tun" && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "path",
              {
                d: "M24 24 Q24 16 32 16 L88 16 Q96 16 96 24 L92 72 Q91 80 82 80 L38 80 Q29 80 28 72 Z",
                fill: `url(#tank-glass-${id})`,
                stroke: "#a5b4fc",
                strokeOpacity: "0.7",
                strokeWidth: "1.2"
              }
            ),
            vesselType === "hlt" && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "path",
              {
                d: "M28 14 Q28 10 32 10 L88 10 Q92 10 92 14 L92 82 Q92 86 88 86 L32 86 Q28 86 28 82 Z",
                fill: `url(#tank-glass-${id})`,
                stroke: "#a5b4fc",
                strokeOpacity: "0.7",
                strokeWidth: "1.2"
              }
            ),
            vesselType === "brew_kettle" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("ellipse", { cx: "60", cy: "20", rx: "40", ry: "8", fill: `url(#tank-glass-${id})`, stroke: "#a5b4fc", strokeOpacity: "0.7", strokeWidth: "1.2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "20", y1: "20", x2: "20", y2: "74", stroke: "#a5b4fc", strokeOpacity: "0.7", strokeWidth: "1.2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "100", y1: "20", x2: "100", y2: "74", stroke: "#a5b4fc", strokeOpacity: "0.7", strokeWidth: "1.2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("ellipse", { cx: "60", cy: "74", rx: "40", ry: "8", fill: `url(#tank-glass-${id})`, stroke: "#a5b4fc", strokeOpacity: "0.7", strokeWidth: "1.2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M38 84 Q42 88 46 84 Q50 80 54 84 Q58 88 62 84 Q66 80 70 84 Q74 88 78 84 Q82 80 86 84", stroke: "#ef4444", strokeWidth: "1.5", fill: "none" })
            ] }),
            vesselType === "generic" && /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "30", y: "10", width: "60", height: "76", rx: "10", fill: `url(#tank-glass-${id})`, stroke: "#a5b4fc", strokeOpacity: "0.7", strokeWidth: "1.2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("g", { clipPath: `url(#tank-clip-${id})`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "rect",
              {
                x: vesselType === "bright_tank" ? 24 : vesselType === "mash_tun" ? 24 : vesselType === "hlt" ? 28 : vesselType === "brew_kettle" ? 20 : 30,
                y: vesselType === "brew_kettle" ? 82 - 62 * vesselFillPct / 100 : 90 - 78 * vesselFillPct / 100,
                width: vesselType === "bright_tank" ? 72 : vesselType === "mash_tun" ? 72 : vesselType === "hlt" ? 64 : vesselType === "brew_kettle" ? 80 : 60,
                height: vesselType === "brew_kettle" ? 62 * vesselFillPct / 100 : 78 * vesselFillPct / 100,
                fill: `url(#tank-fluid-${id})`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "animate",
                    {
                      attributeName: "y",
                      dur: "0.45s",
                      fill: "freeze",
                      to: String(
                        vesselType === "brew_kettle" ? 82 - 62 * vesselFillPct / 100 : 90 - 78 * vesselFillPct / 100
                      )
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "animate",
                    {
                      attributeName: "height",
                      dur: "0.45s",
                      fill: "freeze",
                      to: String(vesselType === "brew_kettle" ? 62 * vesselFillPct / 100 : 78 * vesselFillPct / 100)
                    }
                  )
                ]
              }
            ) }),
            vesselType !== "bright_tank" && /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "53", y: "4", width: "14", height: "6", rx: "2", fill: "#94a3b8" }),
            vesselType === "mash_tun" && /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "20", y: "24", width: "6", height: "22", rx: "2", fill: "#64748b" }),
            vesselType === "hlt" && /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "80", cy: "30", r: "5", fill: "#f59e0b" }),
            vesselType === "brew_kettle" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "102", y: "34", width: "8", height: "34", rx: "2", fill: "none", stroke: "#a5b4fc", strokeWidth: "1" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "rect",
                {
                  x: "103",
                  y: 68 - 30 * vesselFillPct / 100,
                  width: "6",
                  height: 30 * vesselFillPct / 100,
                  fill: vesselFluidColor,
                  opacity: "0.8"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("text", { x: "60", y: "52", textAnchor: "middle", className: "fill-slate-200 text-[8px] font-semibold", children: [
              Math.round(vesselFillPct),
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 grid grid-cols-3 gap-1 text-center text-[10px]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-400", children: "Temp" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-semibold text-slate-100", children: [
                Number.isFinite(vesselTemp) ? vesselTemp.toFixed(1) : "--",
                unitSuffix || " C"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-400", children: "Level" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-semibold text-slate-100", children: [
                Math.round(vesselFillPct),
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-400", children: "Rate" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-slate-100", children: vesselFlow.toFixed(2) })
            ] })
          ] })
        ] }),
        data.widgetType === "pump" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 rounded-md border border-white/25 bg-white/15 p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 120 64", className: "h-16 w-full", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "42", cy: "32", r: "18", fill: pumpIsOn ? "#93c5fd" : "#e2e8f0", stroke: "#64748b", strokeWidth: "2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M42 20 L49 32 L42 44 L35 32 Z", fill: pumpIsOn ? "#2563eb" : "#94a3b8" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "60", y: "24", width: "26", height: "16", rx: "4", fill: "#e2e8f0", stroke: "#64748b", strokeWidth: "1.6" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "18", y: "28", width: "10", height: "8", rx: "2", fill: "#cbd5e1" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "86", y: "28", width: "10", height: "8", rx: "2", fill: "#cbd5e1" })
        ] }) }),
        data.widgetType === "valve" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 rounded-md border border-white/25 bg-white/15 p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 120 64", className: "h-16 w-full", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "20", y1: "32", x2: "100", y2: "32", stroke: "#94a3b8", strokeWidth: "5", strokeLinecap: "round" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "60", cy: "32", r: "14", fill: valveIsOpen ? "#67e8f9" : "#e2e8f0", stroke: "#64748b", strokeWidth: "2" }),
          isThreeWayValve ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "60", y1: "18", x2: "60", y2: "6", stroke: "#94a3b8", strokeWidth: "4", strokeLinecap: "round" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "line",
              {
                x1: "60",
                y1: "32",
                x2: data.config.position === "c_to_b" ? 68 : 52,
                y2: data.config.position === "c_to_b" ? 40 : 24,
                stroke: "#0f172a",
                strokeWidth: "3",
                strokeLinecap: "round"
              }
            )
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: "50",
              y1: valveIsOpen ? 22 : 18,
              x2: "70",
              y2: valveIsOpen ? 42 : 46,
              stroke: "#0f172a",
              strokeWidth: "3",
              strokeLinecap: "round"
            }
          )
        ] }) }),
        mode === "draft" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-[10px] text-muted-foreground", children: [
          "Device: ",
          data.logicalDeviceId ?? "unbound"
        ] }),
        mode === "published" && data.widgetType === "sensor" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[10px] text-muted-foreground", children: data.config.sensorType ?? "custom" }),
        mode === "published" && data.widgetType === "sensor" && data.config.dummyMode && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            className: "bf-no-pan mt-2 w-full",
            type: "number",
            min: Number(data.config.min ?? 0),
            max: Number(data.config.max ?? 100),
            step: Number(data.config.step ?? 1),
            value: Number(data.config.value ?? data.config.dummyValue ?? 0),
            onChange: (event) => {
              const next = Number(event.target.value);
              onControl(id, "set_value", next);
            }
          }
        ),
        mode === "published" && data.widgetType === "button" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "mt-2 w-full rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground",
            onClick: (event) => {
              event.stopPropagation();
              onControl(id, "trigger", true);
            },
            type: "button",
            children: "Trigger"
          }
        ),
        mode === "published" && data.widgetType === "switch" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "mt-2 w-full rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground",
            onClick: (event) => {
              event.stopPropagation();
              const next = data.config.state === "on" ? "off" : "on";
              onControl(id, "toggle", next);
            },
            type: "button",
            children: data.config.state === "on" ? "Switch Off" : "Switch On"
          }
        ),
        mode === "published" && data.widgetType === "slider" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            className: "bf-no-pan bf-range-thermo mt-2 w-full",
            type: "range",
            min: Number(data.config.min ?? 0),
            max: Number(data.config.max ?? 100),
            step: Number(data.config.step ?? 1),
            value: Number(data.config.value ?? 0),
            onClick: (event) => event.stopPropagation(),
            onPointerDown: (event) => event.stopPropagation(),
            onPointerMove: (event) => event.stopPropagation(),
            onPointerUp: (event) => event.stopPropagation(),
            onMouseDown: (event) => event.stopPropagation(),
            onMouseMove: (event) => event.stopPropagation(),
            onMouseUp: (event) => event.stopPropagation(),
            onTouchStart: (event) => event.stopPropagation(),
            onTouchMove: (event) => event.stopPropagation(),
            onTouchEnd: (event) => event.stopPropagation(),
            onChange: (event) => {
              const next = Number(event.target.value);
              onControl(id, "set_value", next);
            }
          }
        ),
        data.widgetType === "glycol_controller" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 space-y-1 rounded-md border border-sky-200/60 bg-sky-50/40 p-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase text-sky-900/80", children: "Actual" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-base font-semibold text-sky-950", children: [
              Number(data.config.value ?? 0).toFixed(1),
              unitSuffix
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase text-sky-900/80", children: "Target" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-semibold text-sky-950", children: [
              Number(data.config.setpoint ?? ((_m = data.config.glycolController) == null ? void 0 : _m.threshold) ?? 0).toFixed(1),
              unitSuffix
            ] })
          ] }),
          mode === "published" && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              className: "bf-no-pan bf-range-thermo mt-1 w-full",
              type: "range",
              min: Number(data.config.min ?? 32),
              max: Number(data.config.max ?? 80),
              step: Number(data.config.step ?? 0.5),
              value: Number(data.config.setpoint ?? ((_n = data.config.glycolController) == null ? void 0 : _n.threshold) ?? 65),
              onClick: (event) => event.stopPropagation(),
              onPointerDown: (event) => event.stopPropagation(),
              onPointerMove: (event) => event.stopPropagation(),
              onPointerUp: (event) => event.stopPropagation(),
              onMouseDown: (event) => event.stopPropagation(),
              onMouseMove: (event) => event.stopPropagation(),
              onMouseUp: (event) => event.stopPropagation(),
              onTouchStart: (event) => event.stopPropagation(),
              onTouchMove: (event) => event.stopPropagation(),
              onTouchEnd: (event) => event.stopPropagation(),
              onChange: (event) => {
                const next = Number(event.target.value);
                onControl(id, "set_value", next);
              }
            }
          )
        ] }),
        data.widgetType === "hlt_controller" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 space-y-1 rounded-md border border-orange-200/60 bg-orange-50/40 p-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase text-orange-900/80", children: "Actual" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-base font-semibold text-orange-950", children: [
              Number(data.config.value ?? 0).toFixed(1),
              unitSuffix
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase text-orange-900/80", children: "Target" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-semibold text-orange-950", children: [
              Number(data.config.setpoint ?? ((_o = data.config.hltController) == null ? void 0 : _o.threshold) ?? 0).toFixed(1),
              unitSuffix
            ] })
          ] }),
          mode === "published" && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              className: "bf-no-pan bf-range-thermo mt-1 w-full",
              type: "range",
              min: Number(data.config.min ?? 50),
              max: Number(data.config.max ?? 180),
              step: Number(data.config.step ?? 0.5),
              value: Number(data.config.setpoint ?? ((_p = data.config.hltController) == null ? void 0 : _p.threshold) ?? 152),
              onClick: (event) => event.stopPropagation(),
              onPointerDown: (event) => event.stopPropagation(),
              onPointerMove: (event) => event.stopPropagation(),
              onPointerUp: (event) => event.stopPropagation(),
              onMouseDown: (event) => event.stopPropagation(),
              onMouseMove: (event) => event.stopPropagation(),
              onMouseUp: (event) => event.stopPropagation(),
              onTouchStart: (event) => event.stopPropagation(),
              onTouchMove: (event) => event.stopPropagation(),
              onTouchEnd: (event) => event.stopPropagation(),
              onChange: (event) => {
                const next = Number(event.target.value);
                onControl(id, "set_value", next);
              }
            }
          )
        ] }),
        data.widgetType === "co2_controller" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 space-y-1 rounded-md border border-emerald-200/60 bg-emerald-50/40 p-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase text-emerald-900/80", children: "Actual" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-base font-semibold text-emerald-950", children: [
              Number(data.config.value ?? 0).toFixed(1),
              unitSuffix
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase text-emerald-900/80", children: "Target" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-semibold text-emerald-950", children: [
              Number(data.config.setpoint ?? ((_q = data.config.co2Controller) == null ? void 0 : _q.threshold) ?? 0).toFixed(1),
              unitSuffix
            ] })
          ] }),
          mode === "published" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                className: "bf-no-pan bf-range-thermo mt-1 w-full",
                type: "range",
                min: Number(data.config.min ?? 0),
                max: Number(data.config.max ?? 40),
                step: Number(data.config.step ?? 0.1),
                value: Number(data.config.setpoint ?? ((_r = data.config.co2Controller) == null ? void 0 : _r.threshold) ?? 12),
                onClick: (event) => event.stopPropagation(),
                onPointerDown: (event) => event.stopPropagation(),
                onPointerMove: (event) => event.stopPropagation(),
                onPointerUp: (event) => event.stopPropagation(),
                onMouseDown: (event) => event.stopPropagation(),
                onMouseMove: (event) => event.stopPropagation(),
                onMouseUp: (event) => event.stopPropagation(),
                onTouchStart: (event) => event.stopPropagation(),
                onTouchMove: (event) => event.stopPropagation(),
                onTouchEnd: (event) => event.stopPropagation(),
                onChange: (event) => {
                  const next = Number(event.target.value);
                  onControl(id, "set_value", next);
                }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                className: "mt-1 w-full rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white",
                onClick: (event) => {
                  var _a2;
                  event.stopPropagation();
                  onControl(
                    id,
                    "trigger_purge",
                    !(((_a2 = data.config.co2Controller) == null ? void 0 : _a2.purgeActive) ?? false)
                  );
                },
                type: "button",
                children: ((_s = data.config.co2Controller) == null ? void 0 : _s.purgeActive) ?? false ? "Stop Purge" : "Start Purge"
              }
            )
          ] })
        ] }),
        data.widgetType === "transfer_controller" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 space-y-1 rounded-md border border-blue-200/60 bg-blue-50/40 p-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase text-blue-900/80", children: "Pump Mode" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-blue-950", children: String(((_t = data.config.transferController) == null ? void 0 : _t.pumpMode) ?? "fsd").toUpperCase() })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase text-blue-900/80", children: "Speed" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-semibold text-blue-950", children: [
              Number(((_u = data.config.transferController) == null ? void 0 : _u.transferSpeedPct) ?? data.config.value ?? 0).toFixed(0),
              "%"
            ] })
          ] }),
          mode === "published" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                className: "mt-1 w-full rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white",
                onClick: (event) => {
                  var _a2;
                  event.stopPropagation();
                  onControl(
                    id,
                    "trigger_transfer",
                    !(((_a2 = data.config.transferController) == null ? void 0 : _a2.transferActive) ?? false)
                  );
                },
                type: "button",
                children: ((_v = data.config.transferController) == null ? void 0 : _v.transferActive) ?? false ? "Stop Transfer" : "Start Transfer"
              }
            ),
            (((_w = data.config.transferController) == null ? void 0 : _w.pumpMode) ?? "fsd") === "vsd" && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                className: "bf-no-pan bf-range-thermo mt-1 w-full",
                type: "range",
                min: Number(data.config.min ?? 0),
                max: Number(data.config.max ?? 100),
                step: Number(data.config.step ?? 1),
                value: Number(((_x = data.config.transferController) == null ? void 0 : _x.transferSpeedPct) ?? data.config.value ?? 60),
                onClick: (event) => event.stopPropagation(),
                onPointerDown: (event) => event.stopPropagation(),
                onPointerMove: (event) => event.stopPropagation(),
                onPointerUp: (event) => event.stopPropagation(),
                onMouseDown: (event) => event.stopPropagation(),
                onMouseMove: (event) => event.stopPropagation(),
                onMouseUp: (event) => event.stopPropagation(),
                onTouchStart: (event) => event.stopPropagation(),
                onTouchMove: (event) => event.stopPropagation(),
                onTouchEnd: (event) => event.stopPropagation(),
                onChange: (event) => {
                  const next = Number(event.target.value);
                  onControl(id, "set_value", next);
                }
              }
            )
          ] })
        ] }),
        data.widgetType === "recipe_executor" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 space-y-1 rounded-md border border-violet-200/60 bg-violet-50/40 p-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase text-violet-900/80", children: "Recipe" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "max-w-[8rem] truncate text-sm font-semibold text-violet-950", children: String(data.config.recipeName ?? "Unloaded") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase text-violet-900/80", children: "Step" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-semibold text-violet-950", children: [
              Math.min(
                Number(((_y = data.config.recipeExecutor) == null ? void 0 : _y.currentStepIndex) ?? 0) + 1,
                Math.max(1, Number(((_z = data.config.recipeSteps) == null ? void 0 : _z.length) ?? 0))
              ),
              "/",
              Math.max(0, Number(((_A = data.config.recipeSteps) == null ? void 0 : _A.length) ?? 0))
            ] })
          ] }),
          mode === "published" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                className: "mt-1 w-full rounded bg-violet-600 px-2 py-1 text-xs font-medium text-white",
                onClick: (event) => {
                  var _a2;
                  event.stopPropagation();
                  if ((_a2 = data.config.recipeExecutor) == null ? void 0 : _a2.running) {
                    onControl(id, "recipe_stop", true);
                  } else {
                    onControl(id, "recipe_start", true);
                  }
                },
                type: "button",
                children: ((_B = data.config.recipeExecutor) == null ? void 0 : _B.running) ? "Stop Recipe" : "Start Recipe"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 grid grid-cols-2 gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  className: "rounded bg-violet-500 px-2 py-1 text-[11px] font-medium text-white",
                  onClick: (event) => {
                    var _a2;
                    event.stopPropagation();
                    onControl(
                      id,
                      "recipe_pause",
                      !(((_a2 = data.config.recipeExecutor) == null ? void 0 : _a2.paused) ?? false)
                    );
                  },
                  type: "button",
                  children: ((_C = data.config.recipeExecutor) == null ? void 0 : _C.paused) ?? false ? "Resume" : "Pause"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  className: "rounded bg-violet-500 px-2 py-1 text-[11px] font-medium text-white",
                  onClick: (event) => {
                    event.stopPropagation();
                    onControl(id, "recipe_next", true);
                  },
                  type: "button",
                  children: "Next Step"
                }
              )
            ] }),
            (((_D = data.config.recipeExecutor) == null ? void 0 : _D.awaitingConfirm) ?? false) && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                className: "mt-1 w-full rounded bg-amber-500 px-2 py-1 text-xs font-medium text-white",
                onClick: (event) => {
                  event.stopPropagation();
                  onControl(id, "recipe_confirm", true);
                },
                type: "button",
                children: "Confirm Step"
              }
            )
          ] })
        ] }),
        mode === "published" && data.widgetType === "automation" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "mt-2 w-full rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground",
            onClick: (event) => {
              event.stopPropagation();
              onControl(id, "trigger", true);
            },
            type: "button",
            children: "Run Sequence"
          }
        ),
        mode === "draft" && null
      ]
    }
  );
};
const WidgetNode$1 = reactExports.memo(WidgetNode);
const nodeTypes = { widget: WidgetNode$1 };
const widgetOptions = [
  "vessel",
  "pump",
  "valve",
  "valve_3way",
  "sensor",
  "heater",
  "pid",
  "button",
  "switch",
  "slider",
  "glycol_controller",
  "hlt_controller",
  "co2_controller",
  "transfer_controller",
  "recipe_executor",
  "automation",
  "display",
  "note"
];
const widgetOptionLabel = {
  vessel: "Vessel",
  pump: "Pump",
  valve: "Valve (2-way)",
  valve_3way: "Valve (3-way)",
  sensor: "Sensor",
  heater: "Heater",
  pid: "PID",
  button: "Button",
  switch: "Switch",
  slider: "Slider",
  glycol_controller: "Glycol Controller",
  hlt_controller: "HLT Controller",
  co2_controller: "CO2 Controller",
  transfer_controller: "Transfer Controller",
  recipe_executor: "Recipe Executor",
  automation: "Automation",
  display: "Display",
  note: "Note"
};
const widgetAccentColor = {
  vessel: "#0ea5e9",
  pump: "#2563eb",
  valve: "#06b6d4",
  valve_3way: "#06b6d4",
  sensor: "#f59e0b",
  heater: "#ef4444",
  pid: "#8b5cf6",
  button: "#22c55e",
  switch: "#16a34a",
  slider: "#f97316",
  glycol_controller: "#0ea5e9",
  hlt_controller: "#f97316",
  co2_controller: "#22c55e",
  transfer_controller: "#2563eb",
  recipe_executor: "#7c3aed",
  automation: "#6366f1",
  display: "#14b8a6",
  note: "#64748b"
};
const deviceTypeOptions = [
  "vessel",
  "pump",
  "valve",
  "sensor",
  "heater",
  "pid",
  "button",
  "switch",
  "slider",
  "glycol_controller",
  "hlt_controller",
  "co2_controller",
  "transfer_controller",
  "recipe_executor",
  "automation",
  "display",
  "note"
];
const sensorTypeOptions = [
  "temperature",
  "sg",
  "abv",
  "psi",
  "flow",
  "humidity",
  "custom"
];
const parseMaybeNumber = (value) => {
  if (!value) return void 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : void 0;
};
const co2StylePresets = {
  beer: { targetPsi: 12, targetVolumes: 2.4, hysteresis: 0.5, maxPressurePsi: 25 },
  cider: { targetPsi: 10, targetVolumes: 2.6, hysteresis: 0.5, maxPressurePsi: 22 },
  champagne: { targetPsi: 30, targetVolumes: 5.5, hysteresis: 1, maxPressurePsi: 45 },
  wine: { targetPsi: 2, targetVolumes: 1, hysteresis: 0.3, maxPressurePsi: 10 },
  seltzer: { targetPsi: 25, targetVolumes: 4.2, hysteresis: 1, maxPressurePsi: 40 },
  custom: { targetPsi: 12, targetVolumes: 2.4, hysteresis: 0.5, maxPressurePsi: 25 }
};
const normalizeUnit = (value) => String(value ?? "").trim().toLowerCase();
const isFahrenheitUnit = (unit) => {
  const normalized = normalizeUnit(unit);
  return normalized === "f" || normalized === "degf" || normalized === "fahrenheit" || normalized === "°f";
};
const isCelsiusUnit = (unit) => {
  const normalized = normalizeUnit(unit);
  return normalized === "c" || normalized === "degc" || normalized === "celsius" || normalized === "°c";
};
const isTemperatureUnit = (unit) => isFahrenheitUnit(unit) || isCelsiusUnit(unit);
const convertTemperature = (value, fromUnit, toUnit) => {
  if (!Number.isFinite(value)) return value;
  if (!isTemperatureUnit(fromUnit) || !isTemperatureUnit(toUnit)) return value;
  if (isFahrenheitUnit(fromUnit) === isFahrenheitUnit(toUnit)) return value;
  if (isCelsiusUnit(fromUnit) && isFahrenheitUnit(toUnit)) {
    return value * (9 / 5) + 32;
  }
  if (isFahrenheitUnit(fromUnit) && isCelsiusUnit(toUnit)) {
    return (value - 32) * (5 / 9);
  }
  return value;
};
const inferTemperatureUnitForNode = (node) => {
  if (!node) return void 0;
  const candidateUnit = String(node.data.config.unit ?? "").trim();
  if (isTemperatureUnit(candidateUnit)) {
    return candidateUnit;
  }
  if (node.data.widgetType === "hlt_controller" || node.data.widgetType === "glycol_controller") {
    return "F";
  }
  if (node.data.widgetType === "sensor" && node.data.config.sensorType === "temperature") {
    return "F";
  }
  if (node.data.widgetType === "slider" && (node.data.config.setpointType === "temperature" || isTemperatureUnit(candidateUnit))) {
    return candidateUnit || "F";
  }
  return void 0;
};
const toFahrenheit = (value, unit) => {
  return convertTemperature(value, unit, "F");
};
const psiFromVolumesAtF = (volumes, tempF) => {
  const psi = -16.6999 - 0.0101059 * tempF + 116512e-8 * tempF * tempF + 0.173354 * tempF * volumes + 4.24267 * volumes - 0.0684226 * volumes * volumes;
  return Math.max(0, psi);
};
const fluidColorByMedium = {
  product: { active: "#0ea5e9", inactive: "#7dd3fc" },
  glycol: { active: "#06b6d4", inactive: "#67e8f9" },
  co2: { active: "#22c55e", inactive: "#86efac" },
  cip: { active: "#10b981", inactive: "#6ee7b7" },
  water: { active: "#3b82f6", inactive: "#93c5fd" },
  gas: { active: "#f59e0b", inactive: "#fcd34d" }
};
const edgeStyleByKind = {
  fluid: { stroke: "#0ea5e9", strokeWidth: 2.2 },
  data: { stroke: "#f59e0b", strokeWidth: 1.8, filter: "drop-shadow(0 0 2px #f59e0b)" },
  power: { stroke: "#dc2626", strokeWidth: 2.2 },
  ground: { stroke: "#111827", strokeWidth: 2.2 }
};
const isWritableEndpointDirection = (direction) => direction === "output" || direction === "bidirectional";
const isControlWidgetType = (widgetType) => widgetType === "button" || widgetType === "switch" || widgetType === "slider";
const warningSuggestion = (warning) => {
  const text = warning.toLowerCase();
  if (text.includes("no fluid connection")) return "Add at least one fluid line to this widget.";
  if (text.includes("no logical device assigned")) return "Assign a logical device in Widget Config.";
  if (text.includes("missing sensor endpoint binding")) return "Set Sensor Binding to a valid endpoint ID.";
  if (text.includes("missing sensor type")) return "Set sensor type and unit in Widget Config.";
  if (text.includes("missing actuator endpoint binding")) return "Set Actuator Binding to a valid endpoint ID.";
  if (text.includes("no power input line")) return "Connect a red power line into the Power In handle.";
  if (text.includes("no control channel or endpoint mapping")) {
    return "Set Driver Channel, Endpoint Override, or pick from I/O Channel Browser.";
  }
  if (text.includes("no automation steps configured")) return "Open Automation widget config and add at least one step.";
  if (text.includes("simple automation missing source sensor or target device")) {
    return "In Automation (Simple mode), set both Source Sensor and Target Device.";
  }
  if (text.includes("glycol controller missing source sensor")) {
    return "Select a source temperature sensor in Glycol Controller config.";
  }
  if (text.includes("glycol controller missing output")) {
    return "Assign at least one output device (pump, valve, or chiller) in Glycol Controller config.";
  }
  if (text.includes("hlt controller missing source sensor")) {
    return "Select a source temperature sensor in HLT Controller config.";
  }
  if (text.includes("hlt controller missing output")) {
    return "Assign at least one output device (heater or recirc pump) in HLT Controller config.";
  }
  if (text.includes("co2 controller missing source sensor")) {
    return "Select a source pressure sensor in CO2 Controller config.";
  }
  if (text.includes("co2 controller missing output")) {
    return "Assign at least one output valve in CO2 Controller config.";
  }
  if (text.includes("transfer controller missing pump")) {
    return "Assign a pump output in Transfer Controller config.";
  }
  if (text.includes("transfer controller missing valves")) {
    return "Assign at least one source or destination valve in Transfer Controller config.";
  }
  if (text.includes("recipe executor missing recipe steps")) {
    return "Import a recipe file, then load it into Recipe Executor config.";
  }
  if (text.includes("recipe executor missing target mapping")) {
    return "Wire Recipe Executor data-out to a target widget or set Control Mapping target.";
  }
  return "Open widget config and complete missing wiring or bindings.";
};
const coerceAutomationValue = (value) => {
  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (typeof value !== "string") {
    return true;
  }
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;
  return value;
};
const defaultCommandValue = (command, active) => {
  if (command === "set_value") return active ? 1 : 0;
  if (command === "trigger") return true;
  if (command === "route") return active ? "c_to_a" : "c_to_b";
  if (command === "open_close") return active ? "open" : "closed";
  return active ? "on" : "off";
};
const resolveNodeByAutomationRef = (nodes, refId) => {
  if (!refId) return void 0;
  if (refId.startsWith("node:")) {
    const nodeId = refId.slice("node:".length);
    return nodes.find((node) => node.id === nodeId);
  }
  return nodes.find((node) => node.data.logicalDeviceId === refId);
};
const toAutomationRef = (node) => node.data.logicalDeviceId ? node.data.logicalDeviceId : `node:${node.id}`;
const activeRecipeStatuses = ["running", "waiting_confirm", "paused"];
const recipeRuntimeStateFromRun = (status) => {
  if (status === "running") return "running";
  if (status === "waiting_confirm") return "waiting_confirm";
  if (status === "paused") return "paused";
  if (status === "completed") return "completed";
  return "idle";
};
const normalizeRecipeText = (value) => String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
const toFiniteNumber = (value) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : void 0;
};
const stepExpectsTemperatureAdvance = (step) => {
  const trigger = normalizeRecipeText(step.triggerWhen);
  if (trigger.includes("temp_reached") || trigger.includes("temperature_reached")) {
    return true;
  }
  const actionText = `${normalizeRecipeText(step.stage)} ${normalizeRecipeText(
    step.action
  )} ${normalizeRecipeText(step.name)}`;
  return actionText.includes("heat") || actionText.includes("chill") || actionText.includes("cool") || actionText.includes("crash") || actionText.includes("target temp");
};
const stepIsCoolingDirection = (step) => {
  const actionText = `${normalizeRecipeText(step.stage)} ${normalizeRecipeText(
    step.action
  )} ${normalizeRecipeText(step.name)}`;
  return actionText.includes("cool") || actionText.includes("chill") || actionText.includes("cold crash") || actionText.includes("crash");
};
const resolveTelemetryValueForStep = (nodes, step) => {
  var _a, _b;
  const targetRef = String(step.targetDeviceId ?? "").trim();
  if (!targetRef) return null;
  const targetNode = resolveNodeByAutomationRef(nodes, targetRef);
  if (!targetNode) return null;
  if (targetNode.data.widgetType === "sensor") {
    const measured2 = toFiniteNumber(
      targetNode.data.config.value ?? targetNode.data.config.dummyValue
    );
    if (measured2 === void 0) return null;
    const tolerance = Math.max(
      0.1,
      Math.abs(
        toFiniteNumber(targetNode.data.config.step) ?? toFiniteNumber(step.value) ?? 0.5
      )
    );
    return { measured: measured2, tolerance };
  }
  if (targetNode.data.widgetType === "hlt_controller") {
    const measured2 = toFiniteNumber(targetNode.data.config.value);
    if (measured2 === void 0) return null;
    const tolerance = Math.max(
      0.25,
      Math.abs(toFiniteNumber((_a = targetNode.data.config.hltController) == null ? void 0 : _a.hysteresis) ?? 1)
    );
    return { measured: measured2, tolerance };
  }
  if (targetNode.data.widgetType === "glycol_controller") {
    const measured2 = toFiniteNumber(targetNode.data.config.value);
    if (measured2 === void 0) return null;
    const tolerance = Math.max(
      0.25,
      Math.abs(toFiniteNumber((_b = targetNode.data.config.glycolController) == null ? void 0 : _b.hysteresis) ?? 1)
    );
    return { measured: measured2, tolerance };
  }
  const measured = toFiniteNumber(targetNode.data.config.value ?? targetNode.data.config.dummyValue);
  if (measured === void 0) return null;
  return { measured, tolerance: 0.5 };
};
const recipeStepFingerprint = (steps = []) => steps.map(
  (step) => [
    normalizeRecipeText(step.name),
    normalizeRecipeText(step.stage),
    normalizeRecipeText(step.command)
  ].join("|")
).join(">");
const resolveRecipeIdForExecutor = (node, importedRecipes) => {
  const direct = String(node.data.config.recipeId ?? "").trim();
  if (direct) {
    return direct;
  }
  const nodeRecipeName = normalizeRecipeText(node.data.config.recipeName);
  if (nodeRecipeName) {
    const byName = importedRecipes.find(
      (recipe) => normalizeRecipeText(recipe.name) === nodeRecipeName
    ) ?? null;
    if (byName == null ? void 0 : byName.id) {
      return byName.id;
    }
  }
  const nodeSteps = node.data.config.recipeSteps ?? [];
  if (nodeSteps.length > 0) {
    const targetFingerprint = recipeStepFingerprint(nodeSteps);
    const bySteps = importedRecipes.find(
      (recipe) => recipe.steps.length > 0 && recipeStepFingerprint(recipe.steps) === targetFingerprint
    ) ?? null;
    if (bySteps == null ? void 0 : bySteps.id) {
      return bySteps.id;
    }
  }
  return "";
};
const pickRunForExecutor = (runs, recipeId, recipeName) => {
  const candidates = runs.filter((run) => {
    if (recipeId) {
      return run.recipeId === recipeId;
    }
    return recipeName ? run.recipeName === recipeName : false;
  });
  if (candidates.length === 0) {
    return null;
  }
  const active = candidates.find((run) => activeRecipeStatuses.includes(run.status)) ?? null;
  if (active) {
    return active;
  }
  return [...candidates].sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null;
};
const toRecipeExecutorRuleFromRun = (run, currentRule) => {
  const currentIndex = Math.max(-1, Number(run.currentStepIndex ?? -1));
  const activeStep = currentIndex >= 0 && currentIndex < run.steps.length ? run.steps[currentIndex] : void 0;
  const startedMs = (activeStep == null ? void 0 : activeStep.startedAt) ? Date.parse(activeStep.startedAt) : NaN;
  const running = activeRecipeStatuses.includes(run.status);
  return {
    enabled: (currentRule == null ? void 0 : currentRule.enabled) === true,
    running,
    paused: run.status === "paused",
    awaitingConfirm: run.status === "waiting_confirm",
    currentStepIndex: Math.max(0, currentIndex),
    stepStartedAtMs: Number.isFinite(startedMs) ? startedMs : void 0,
    activeStepId: activeStep == null ? void 0 : activeStep.id,
    autoProceedDefault: (currentRule == null ? void 0 : currentRule.autoProceedDefault) === true,
    runtimeState: recipeRuntimeStateFromRun(run.status)
  };
};
const toNodeRedJson = (page) => {
  const outgoing = /* @__PURE__ */ new Map();
  for (const edge of page.edges) {
    const list = outgoing.get(edge.source) ?? [];
    list.push(edge.target);
    outgoing.set(edge.source, list);
  }
  return page.nodes.map((node) => ({
    id: node.id,
    z: page.id,
    type: node.data.widgetType,
    name: node.data.label,
    x: Math.round(node.position.x),
    y: Math.round(node.position.y),
    wires: [outgoing.get(node.id) ?? []],
    bevforge: {
      logicalDeviceId: node.data.logicalDeviceId,
      bindings: node.data.bindings ?? {},
      config: node.data.config ?? {},
      control: node.data.control ?? {}
    }
  }));
};
const nodeRedTypeToWidgetType = (value) => {
  if (!value) return "note";
  if (["vessel", "pump", "valve", "sensor", "heater", "pid", "button", "switch", "slider", "glycol_controller", "hlt_controller", "co2_controller", "transfer_controller", "recipe_executor", "automation", "display", "note"].includes(
    value
  )) {
    return value;
  }
  if (value.includes("pump")) return "pump";
  if (value.includes("valve")) return "valve";
  if (value.includes("temp") || value.includes("sensor")) return "sensor";
  if (value.includes("pid")) return "pid";
  if (value.includes("display")) return "display";
  if (value.includes("vessel") || value.includes("tank")) return "vessel";
  return "note";
};
const fromNodeRedJson = (raw) => {
  var _a;
  if (!Array.isArray(raw)) {
    throw new Error("Node-RED JSON must be an array");
  }
  const nodes = raw.map((item) => {
    var _a2, _b, _c, _d;
    const widgetType = nodeRedTypeToWidgetType(item.type);
    return {
      id: String(item.id ?? makeId("node")),
      type: "widget",
      position: {
        x: parseMaybeNumber(String(item.x)) ?? 100,
        y: parseMaybeNumber(String(item.y)) ?? 100
      },
      data: {
        label: String(item.name ?? widgetType.toUpperCase()),
        widgetType,
        logicalDeviceId: (_a2 = item.bevforge) == null ? void 0 : _a2.logicalDeviceId,
        bindings: ((_b = item.bevforge) == null ? void 0 : _b.bindings) ?? {},
        config: ((_c = item.bevforge) == null ? void 0 : _c.config) ?? {},
        control: ((_d = item.bevforge) == null ? void 0 : _d.control) ?? {}
      }
    };
  });
  const edges = [];
  for (const item of raw) {
    const source = String(item.id);
    const firstOutput = Array.isArray((_a = item.wires) == null ? void 0 : _a[0]) ? item.wires[0] : [];
    for (const target of firstOutput) {
      edges.push({
        id: makeId("edge"),
        source,
        target: String(target),
        type: "smoothstep",
        data: { kind: "fluid" }
      });
    }
  }
  return { nodes, edges };
};
const isExternalFlowWidget = (widgetType) => FLOW_WIDGET_TYPES$1.includes(widgetType);
const CanvasStudioInner = () => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q, _R, _S, _T, _U, _V, _W, _X, _Y, _Z, __, _$, _aa, _ba, _ca, _da, _ea, _fa, _ga, _ha, _ia, _ja, _ka, _la, _ma, _na, _oa, _pa, _qa, _ra, _sa, _ta, _ua, _va, _wa, _xa, _ya, _za, _Aa, _Ba;
  const navigate = useNavigate();
  const { setCenter } = useReactFlow();
  const [project, setProject] = reactExports.useState(null);
  const [devices, setDevices] = reactExports.useState([]);
  const [importedRecipes, setImportedRecipes] = reactExports.useState([]);
  const [selectedImportedRecipeId, setSelectedImportedRecipeId] = reactExports.useState("");
  const [availableControlEndpoints, setAvailableControlEndpoints] = reactExports.useState([]);
  const [activePageId, setActivePageId] = reactExports.useState("");
  const [selectedNodeId, setSelectedNodeId] = reactExports.useState(null);
  const [widgetConfigOpen, setWidgetConfigOpen] = reactExports.useState(false);
  const [warningsOpen, setWarningsOpen] = reactExports.useState(false);
  const [wireDeleteTarget, setWireDeleteTarget] = reactExports.useState(null);
  const [pageDeleteTarget, setPageDeleteTarget] = reactExports.useState(null);
  const [lastUndoAction, setLastUndoAction] = reactExports.useState(null);
  const [contextMenu, setContextMenu] = reactExports.useState(null);
  const [libraryOpen, setLibraryOpen] = reactExports.useState(false);
  const [libraryFilter, setLibraryFilter] = reactExports.useState("");
  const [activeFluidMedium, setActiveFluidMedium] = reactExports.useState("product");
  const [status, setStatus] = reactExports.useState("Loading canvas project...");
  const [co2AlarmEvents, setCo2AlarmEvents] = reactExports.useState([]);
  const [newDeviceName, setNewDeviceName] = reactExports.useState("");
  const [newDeviceType, setNewDeviceType] = reactExports.useState("sensor");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [rawEdges, setRawEdges, onEdgesChange] = useEdgesState([]);
  const nodeRedInputRef = reactExports.useRef(null);
  const activePageIdRef = reactExports.useRef("");
  const simpleAutomationStateRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const glycolControllerStateRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const glycolControllerDispatchStateRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const hltControllerStateRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const hltControllerDispatchStateRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const co2ControllerDispatchStateRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const co2PressureStateRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const co2PurgeStateRef = reactExports.useRef(
    /* @__PURE__ */ new Map()
  );
  const co2AlarmStateRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const transferControllerDispatchStateRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const recipeExecutorDispatchStateRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const recipeExecutorRunIdRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const recipeExecutorAdvanceStateRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const currentPage = reactExports.useMemo(() => {
    if (!project) return null;
    return project.pages.find((page) => page.id === activePageId) ?? null;
  }, [project, activePageId]);
  const currentMode = (currentPage == null ? void 0 : currentPage.mode) ?? "draft";
  reactExports.useEffect(() => {
    activePageIdRef.current = activePageId;
  }, [activePageId]);
  const runtimeControl = reactExports.useCallback(
    async (nodeId, action, value) => {
      var _a2, _b2, _c2, _d2, _e2, _f2, _g2, _h2, _i2, _j2, _k2, _l2, _m2, _n2, _o2;
      const sourceNode = nodes.find((item) => item.id === nodeId);
      if (!sourceNode) {
        return;
      }
      if (sourceNode.data.widgetType === "sensor") {
        setNodes(
          (prev) => prev.map(
            (node) => node.id === sourceNode.id ? {
              ...node,
              data: {
                ...node.data,
                config: {
                  ...node.data.config,
                  value: Number(value),
                  dummyValue: Number(value),
                  sensorSampleAtMs: Date.now()
                }
              }
            } : node
          )
        );
        setStatus(`Sensor value updated: ${sourceNode.data.label}`);
        return;
      }
      if (sourceNode.data.widgetType === "glycol_controller") {
        const nextValue = Number(value);
        if (!Number.isFinite(nextValue)) {
          return;
        }
        setNodes(
          (prev) => prev.map(
            (node) => node.id === sourceNode.id ? {
              ...node,
              data: {
                ...node.data,
                config: {
                  ...node.data.config,
                  setpoint: nextValue,
                  glycolController: {
                    ...node.data.config.glycolController,
                    threshold: nextValue
                  }
                }
              }
            } : node
          )
        );
        setStatus(`Glycol target updated: ${sourceNode.data.label}`);
        return;
      }
      if (sourceNode.data.widgetType === "hlt_controller") {
        const nextValue = Number(value);
        if (!Number.isFinite(nextValue)) {
          return;
        }
        setNodes(
          (prev) => prev.map(
            (node) => node.id === sourceNode.id ? {
              ...node,
              data: {
                ...node.data,
                config: {
                  ...node.data.config,
                  setpoint: nextValue,
                  hltController: {
                    ...node.data.config.hltController,
                    threshold: nextValue
                  }
                }
              }
            } : node
          )
        );
        setStatus(`HLT target updated: ${sourceNode.data.label}`);
        return;
      }
      if (sourceNode.data.widgetType === "co2_controller") {
        if (action === "trigger_purge") {
          const nextActive = Boolean(value);
          setNodes(
            (prev) => prev.map(
              (node) => node.id === sourceNode.id ? {
                ...node,
                data: {
                  ...node.data,
                  config: {
                    ...node.data.config,
                    co2Controller: {
                      ...node.data.config.co2Controller,
                      purgeActive: nextActive
                    }
                  }
                }
              } : node
            )
          );
          setStatus(nextActive ? "CO2 purge started." : "CO2 purge stopped.");
          return;
        }
        const nextValue = Number(value);
        if (!Number.isFinite(nextValue)) {
          return;
        }
        setNodes(
          (prev) => prev.map(
            (node) => node.id === sourceNode.id ? {
              ...node,
              data: {
                ...node.data,
                config: {
                  ...node.data.config,
                  setpoint: nextValue,
                  co2Controller: {
                    ...node.data.config.co2Controller,
                    threshold: nextValue
                  }
                }
              }
            } : node
          )
        );
        setStatus(`CO2 target updated: ${sourceNode.data.label}`);
        return;
      }
      if (sourceNode.data.widgetType === "transfer_controller") {
        if (action === "trigger_transfer") {
          const nextActive = Boolean(value);
          setNodes(
            (prev) => prev.map(
              (node) => node.id === sourceNode.id ? {
                ...node,
                data: {
                  ...node.data,
                  config: {
                    ...node.data.config,
                    transferController: {
                      ...node.data.config.transferController,
                      transferActive: nextActive
                    }
                  }
                }
              } : node
            )
          );
          setStatus(nextActive ? "Transfer started." : "Transfer stopped.");
          return;
        }
        if (action === "set_value") {
          const nextValue = Number(value);
          if (!Number.isFinite(nextValue)) {
            return;
          }
          setNodes(
            (prev) => prev.map(
              (node) => node.id === sourceNode.id ? {
                ...node,
                data: {
                  ...node.data,
                  config: {
                    ...node.data.config,
                    value: nextValue,
                    transferController: {
                      ...node.data.config.transferController,
                      transferSpeedPct: nextValue
                    }
                  }
                }
              } : node
            )
          );
          setStatus(`Transfer speed updated: ${sourceNode.data.label}`);
          return;
        }
      }
      if (sourceNode.data.widgetType === "recipe_executor") {
        const recipeId = resolveRecipeIdForExecutor(sourceNode, importedRecipes);
        const inlineSteps = Array.isArray(sourceNode.data.config.recipeSteps) ? sourceNode.data.config.recipeSteps : [];
        const hasInlineRecipe = inlineSteps.length > 0;
        if (action === "recipe_start" && !recipeId && !hasInlineRecipe) {
          setStatus("Recipe executor has no recipe loaded.");
          return;
        }
        const startAction = action === "recipe_start";
        const endpoint2 = startAction ? "/api/os/recipes/run/start" : (() => {
          const linkedRunId = recipeExecutorRunIdRef.current.get(sourceNode.id);
          if (linkedRunId) {
            return `/api/os/recipes/run/${linkedRunId}/action`;
          }
          return "";
        })();
        if (!startAction && !endpoint2) {
          try {
            const runsResponse = await fetch("/api/os/recipes/runs");
            const runsPayload = await runsResponse.json().catch(() => null);
            const runs = Array.isArray(runsPayload == null ? void 0 : runsPayload.data) ? runsPayload.data : [];
            const matchedRun = pickRunForExecutor(
              runs,
              recipeId,
              sourceNode.data.config.recipeName
            );
            if (matchedRun == null ? void 0 : matchedRun.runId) {
              recipeExecutorRunIdRef.current.set(sourceNode.id, matchedRun.runId);
            } else {
              setStatus("No active recipe run linked to this recipe executor.");
              return;
            }
          } catch (error) {
            console.error("Failed to resolve linked recipe run:", error);
            setStatus("Failed to resolve active recipe run for this executor.");
            return;
          }
        }
        const runId = recipeExecutorRunIdRef.current.get(sourceNode.id);
        if (!startAction && !runId) {
          setStatus("No active recipe run linked to this recipe executor.");
          return;
        }
        const actionMap = {
          recipe_stop: "stop",
          recipe_next: "next",
          recipe_confirm: "confirm"
        };
        if (action === "recipe_pause") {
          actionMap.recipe_pause = Boolean(value) ? "pause" : "resume";
        }
        if (!startAction && !actionMap[action]) {
          setStatus("Unsupported recipe action.");
          return;
        }
        try {
          const inlineRecipeName = String(sourceNode.data.config.recipeName ?? sourceNode.data.label ?? "").trim() || "Canvas Recipe";
          const inlineRecipeFormat = ["bevforge", "beer-json", "beer-xml", "beer-smith-bsmx"].includes(
            String(sourceNode.data.config.recipeFormat ?? "")
          ) ? sourceNode.data.config.recipeFormat : "bevforge";
          const startPayload = recipeId ? {
            recipeId
          } : {
            recipe: {
              id: `inline-${sourceNode.id}`,
              name: inlineRecipeName,
              format: inlineRecipeFormat,
              steps: inlineSteps,
              rawFile: `inline://${sourceNode.id}.json`,
              importedAt: (/* @__PURE__ */ new Date()).toISOString()
            }
          };
          const response = await fetch(
            startAction ? "/api/os/recipes/run/start" : `/api/os/recipes/run/${runId}/action`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(
                startAction ? startPayload : {
                  action: actionMap[action]
                }
              )
            }
          );
          const payload = await response.json().catch(() => null);
          if (!response.ok || !(payload == null ? void 0 : payload.success)) {
            throw new Error((payload == null ? void 0 : payload.error) ?? `Recipe action failed (${response.status})`);
          }
          const run = payload.data;
          if (run == null ? void 0 : run.runId) {
            recipeExecutorRunIdRef.current.set(sourceNode.id, run.runId);
          }
          const completedOrStopped = run.status === "completed" || run.status === "canceled" || run.status === "failed";
          if (completedOrStopped) {
            recipeExecutorDispatchStateRef.current.delete(sourceNode.id);
            recipeExecutorRunIdRef.current.delete(sourceNode.id);
          } else {
            recipeExecutorDispatchStateRef.current.delete(sourceNode.id);
          }
          setNodes(
            (prev) => prev.map((node) => {
              if (node.id !== sourceNode.id) return node;
              const nextRule = toRecipeExecutorRuleFromRun(
                run,
                node.data.config.recipeExecutor
              );
              return {
                ...node,
                data: {
                  ...node.data,
                  config: {
                    ...node.data.config,
                    recipeId: run.recipeId,
                    recipeName: run.recipeName,
                    recipeSteps: run.steps,
                    state: nextRule.running ? "on" : "off",
                    recipeExecutor: nextRule
                  }
                }
              };
            })
          );
          if (action === "recipe_start") {
            setStatus(`Recipe started: ${run.recipeName}`);
          } else if (action === "recipe_stop") {
            setStatus("Recipe stopped.");
          } else if (action === "recipe_pause") {
            setStatus(Boolean(value) ? "Recipe paused." : "Recipe resumed.");
          } else if (action === "recipe_next") {
            setStatus("Moved to next recipe step.");
          } else if (action === "recipe_confirm") {
            setStatus("Recipe step confirmed.");
          }
        } catch (error) {
          console.error("Recipe executor action failed:", error);
          setStatus(error instanceof Error ? error.message : "Recipe action failed.");
        }
        return;
      }
      if (sourceNode.data.widgetType === "automation") {
        void fetch("/api/os/automation/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodeId: sourceNode.id })
        }).catch((error) => {
          console.error("Backend automation run start failed:", error);
        });
        const steps = sourceNode.data.config.automationSteps ?? [];
        if (steps.length === 0) {
          setStatus("Automation has no steps configured.");
          return;
        }
        const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        for (const step of steps) {
          const delayMs = Math.max(0, Number(step.delayMs ?? 0));
          if (delayMs > 0) {
            await wait(delayMs);
          }
          if (!step.targetDeviceId) {
            continue;
          }
          const targetNode2 = nodes.find((node) => node.data.logicalDeviceId === step.targetDeviceId) ?? null;
          if (!targetNode2 || targetNode2.data.widgetType === "automation") {
            continue;
          }
          const targetIsThreeWayValve2 = targetNode2.data.widgetType === "valve" && targetNode2.data.config.valveType === "3way";
          const nextValvePosition = (onValue) => {
            if (targetIsThreeWayValve2) {
              if (typeof onValue === "boolean") return onValue ? "c_to_a" : "c_to_b";
              return targetNode2.data.config.position === "c_to_a" ? "c_to_b" : "c_to_a";
            }
            if (typeof onValue === "boolean") return onValue ? "open" : "closed";
            return targetNode2.data.config.position === "open" ? "closed" : "open";
          };
          let actionValue = coerceAutomationValue(step.value);
          if (step.command === "on_off") {
            if (targetNode2.data.widgetType === "valve") {
              actionValue = typeof actionValue === "boolean" ? nextValvePosition(actionValue) : nextValvePosition();
            } else if (typeof actionValue === "boolean") {
              actionValue = actionValue ? "on" : "off";
            } else if (actionValue === true) {
              actionValue = targetNode2.data.config.state === "on" ? "off" : "on";
            }
          }
          if (step.command === "open_close") {
            if (targetNode2.data.widgetType === "valve") {
              actionValue = typeof actionValue === "boolean" ? nextValvePosition(actionValue) : nextValvePosition();
            } else if (typeof actionValue === "boolean") {
              actionValue = actionValue ? "on" : "off";
            }
          }
          if (step.command === "route") {
            if (targetNode2.data.widgetType === "valve") {
              actionValue = typeof actionValue === "boolean" ? nextValvePosition(actionValue) : nextValvePosition();
            } else if (typeof actionValue === "boolean") {
              actionValue = actionValue ? 1 : 0;
            }
          }
          if (step.command === "set_value" && actionValue === true) {
            actionValue = 1;
          }
          setNodes(
            (prev) => prev.map((node) => {
              if (node.id !== targetNode2.id) return node;
              const patch = node.data.widgetType === "valve" ? { ...node.data.config, position: String(actionValue) } : node.data.widgetType === "slider" ? { ...node.data.config, value: Number(actionValue) } : node.data.widgetType === "pump" && typeof actionValue === "number" ? {
                ...node.data.config,
                value: Number(actionValue),
                state: Number(actionValue) > 0 ? "on" : "off"
              } : node.data.widgetType === "sensor" ? {
                ...node.data.config,
                value: Number(actionValue),
                dummyValue: Number(actionValue),
                sensorSampleAtMs: Date.now()
              } : { ...node.data.config, state: String(actionValue) };
              return {
                ...node,
                data: {
                  ...node.data,
                  config: patch
                }
              };
            })
          );
          let endpoint2 = parseMaybeNumber((_a2 = targetNode2.data.bindings) == null ? void 0 : _a2.actuator);
          if (!endpoint2 && ((_b2 = targetNode2.data.control) == null ? void 0 : _b2.endpointId)) {
            endpoint2 = Number(targetNode2.data.control.endpointId);
          }
          if (!endpoint2 && ((_c2 = sourceNode.data.control) == null ? void 0 : _c2.endpointId)) {
            endpoint2 = Number(sourceNode.data.control.endpointId);
          }
          const channelCandidates2 = [(_d2 = targetNode2.data.control) == null ? void 0 : _d2.channel, (_e2 = sourceNode.data.control) == null ? void 0 : _e2.channel].filter(
            (candidate) => Boolean(candidate)
          );
          if (!endpoint2 && channelCandidates2.length > 0) {
            const matchedLocal = availableControlEndpoints.find(
              (ep) => channelCandidates2.some((channel) => ep.channelId === channel) && isWritableEndpointDirection(ep.direction)
            );
            if (matchedLocal) {
              endpoint2 = matchedLocal.id;
            }
          }
          if (!endpoint2) {
            continue;
          }
          try {
            await fetch("/api/os/command", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                endpointId: endpoint2,
                value: actionValue,
                commandType: "write",
                correlationId: `canvas-automation-${sourceNode.id}-${step.id}-${Date.now()}`
              })
            });
          } catch (error) {
            console.error("Automation runtime command failed:", error);
          }
        }
        setStatus(`Automation executed: ${sourceNode.data.label}`);
        return;
      }
      let targetNode = sourceNode;
      if (isControlWidgetType(sourceNode.data.widgetType)) {
        const targetDeviceId = (_f2 = sourceNode.data.control) == null ? void 0 : _f2.targetDeviceId;
        if (targetDeviceId) {
          targetNode = nodes.find((item) => item.data.logicalDeviceId === targetDeviceId) ?? sourceNode;
        } else {
          const connectedTargetId = (_g2 = rawEdges.find(
            (edge) => {
              var _a3;
              return edge.source === sourceNode.id && (((_a3 = edge.data) == null ? void 0 : _a3.kind) ?? "fluid") === "data";
            }
          )) == null ? void 0 : _g2.target;
          if (connectedTargetId) {
            targetNode = nodes.find((item) => item.id === connectedTargetId) ?? sourceNode;
          }
        }
      }
      const command = ((_h2 = sourceNode.data.control) == null ? void 0 : _h2.command) ?? "trigger";
      const targetIsThreeWayValve = targetNode.data.widgetType === "valve" && targetNode.data.config.valveType === "3way";
      const targetNextValvePosition = (onValue) => {
        if (targetIsThreeWayValve) {
          if (typeof onValue === "boolean") return onValue ? "c_to_a" : "c_to_b";
          return targetNode.data.config.position === "c_to_a" ? "c_to_b" : "c_to_a";
        }
        if (typeof onValue === "boolean") return onValue ? "open" : "closed";
        return targetNode.data.config.position === "open" ? "closed" : "open";
      };
      const mappedValue = (() => {
        if (sourceNode.data.widgetType === "button") {
          if (command === "on_off") {
            if (targetNode.data.widgetType === "valve") return targetNextValvePosition();
            return targetNode.data.config.state === "on" ? "off" : "on";
          }
          if (command === "open_close") {
            if (targetNode.data.widgetType === "valve") return targetNextValvePosition();
            return targetNode.data.config.state === "on" ? "off" : "on";
          }
          if (command === "route") {
            if (targetNode.data.widgetType === "valve") return targetNextValvePosition();
            return true;
          }
          if (command === "set_value") return 1;
          if (targetNode.data.widgetType === "pump" || targetNode.data.widgetType === "heater") {
            return targetNode.data.config.state === "on" ? "off" : "on";
          }
          if (targetNode.data.widgetType === "valve") {
            return targetNextValvePosition();
          }
          return true;
        }
        if (sourceNode.data.widgetType === "switch") {
          if (command === "open_close") {
            if (targetNode.data.widgetType === "valve") return targetNextValvePosition(value === "on");
            return value === "on" ? "on" : "off";
          }
          if (command === "route") {
            if (targetNode.data.widgetType === "valve") return targetNextValvePosition(value === "on");
            return value === "on" ? 1 : 0;
          }
          if (command === "on_off" && targetNode.data.widgetType === "valve") {
            return targetNextValvePosition(value === "on");
          }
          return value === "on" ? "on" : "off";
        }
        return value;
      })();
      const applyNodeValue = (node, nextValue) => {
        const patch = node.data.widgetType === "valve" ? { ...node.data.config, position: String(nextValue) } : node.data.widgetType === "slider" ? { ...node.data.config, value: Number(nextValue) } : node.data.widgetType === "pump" && typeof nextValue === "number" ? {
          ...node.data.config,
          value: Number(nextValue),
          state: Number(nextValue) > 0 ? "on" : "off"
        } : node.data.widgetType === "sensor" ? {
          ...node.data.config,
          value: Number(nextValue),
          dummyValue: Number(nextValue),
          sensorSampleAtMs: Date.now()
        } : { ...node.data.config, state: String(nextValue) };
        return {
          ...node,
          data: {
            ...node.data,
            config: patch
          }
        };
      };
      setNodes(
        (prev) => prev.map((node) => {
          if (node.id === sourceNode.id && isControlWidgetType(sourceNode.data.widgetType)) {
            if (sourceNode.data.widgetType === "switch") {
              return applyNodeValue(node, mappedValue);
            }
            if (sourceNode.data.widgetType === "slider") {
              return applyNodeValue(node, mappedValue);
            }
          }
          if (node.id === targetNode.id) {
            return applyNodeValue(node, mappedValue);
          }
          return node;
        })
      );
      let endpoint = parseMaybeNumber((_i2 = targetNode.data.bindings) == null ? void 0 : _i2.actuator);
      if (!endpoint && ((_j2 = targetNode.data.control) == null ? void 0 : _j2.endpointId)) {
        endpoint = Number(targetNode.data.control.endpointId);
      }
      if (!endpoint && ((_k2 = sourceNode.data.control) == null ? void 0 : _k2.endpointId)) {
        endpoint = Number(sourceNode.data.control.endpointId);
      }
      const channelCandidates = [
        (_l2 = targetNode.data.control) == null ? void 0 : _l2.channel,
        (_m2 = sourceNode.data.control) == null ? void 0 : _m2.channel
      ].filter((candidate) => Boolean(candidate));
      if (sourceNode.data.widgetType === "slider" && sourceNode.id === targetNode.id && !((_n2 = sourceNode.data.control) == null ? void 0 : _n2.targetDeviceId) && channelCandidates.length === 0 && !((_o2 = sourceNode.data.control) == null ? void 0 : _o2.endpointId)) {
        setStatus(`Setpoint updated locally: ${sourceNode.data.label}`);
        return;
      }
      if (!endpoint && channelCandidates.length > 0) {
        const matchedLocal = availableControlEndpoints.find(
          (ep) => channelCandidates.some((channel) => ep.channelId === channel) && isWritableEndpointDirection(ep.direction)
        );
        if (matchedLocal) {
          endpoint = matchedLocal.id;
        } else {
          try {
            const endpointRes = await fetch("/api/os/endpoints?limit=1000");
            const endpointPayload = await endpointRes.json().catch(() => null);
            const endpointRows = Array.isArray(endpointPayload == null ? void 0 : endpointPayload.data) ? endpointPayload.data : [];
            const matched = endpointRows.find(
              (ep) => channelCandidates.some(
                (channel) => String(ep.channelId ?? "") === String(channel)
              ) && isWritableEndpointDirection(ep.direction)
            );
            if (matched == null ? void 0 : matched.id) {
              endpoint = Number(matched.id);
            }
          } catch (error) {
            console.error("Endpoint lookup failed:", error);
          }
        }
      }
      if (!endpoint) {
        setStatus("No endpoint resolved for this control. Set actuator/endpoint/channel binding.");
        return;
      }
      try {
        const response = await fetch("/api/os/command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpointId: endpoint,
            value: mappedValue,
            commandType: "write",
            correlationId: `canvas-runtime-${nodeId}-${Date.now()}`
          })
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.message ?? `Command failed (${response.status})`);
        }
        setStatus(`Command sent to endpoint ${endpoint}.`);
      } catch (error) {
        console.error("Runtime command failed:", error);
      }
    },
    [availableControlEndpoints, importedRecipes, nodes, rawEdges, setNodes]
  );
  reactExports.useEffect(() => {
    if (currentMode !== "published") {
      simpleAutomationStateRef.current.clear();
      return;
    }
    const automationNodes = nodes.filter(
      (node) => node.data.widgetType === "automation" && node.data.config.automationMode === "simple" && node.data.config.simpleAutomation
    );
    const pollingMs = Math.max(
      250,
      Math.min(
        ...automationNodes.map((node) => {
          var _a2;
          return Number(((_a2 = node.data.config.simpleAutomation) == null ? void 0 : _a2.pollMs) ?? 1e3);
        })
      )
    );
    const evaluate = async () => {
      for (const automationNode of automationNodes) {
        const rule = automationNode.data.config.simpleAutomation;
        if (!(rule == null ? void 0 : rule.sourceSensorDeviceId) || !(rule == null ? void 0 : rule.targetDeviceId)) {
          continue;
        }
        const sensorNode = resolveNodeByAutomationRef(nodes, rule.sourceSensorDeviceId);
        const targetNode = resolveNodeByAutomationRef(nodes, rule.targetDeviceId);
        if (!sensorNode || !targetNode) {
          continue;
        }
        const sensorValue = Number(sensorNode.data.config.value ?? sensorNode.data.config.dummyValue);
        if (!Number.isFinite(sensorValue)) {
          continue;
        }
        let baseline = Number(rule.threshold ?? 0);
        if (rule.compareTo === "setpoint_device" && rule.setpointDeviceId) {
          const setpointNode = resolveNodeByAutomationRef(nodes, rule.setpointDeviceId);
          const setpointValue = Number(setpointNode == null ? void 0 : setpointNode.data.config.value);
          if (!Number.isFinite(setpointValue)) {
            continue;
          }
          baseline = setpointValue;
        }
        const operator = rule.operator ?? "gt";
        const hysteresis = Math.max(0, Number(rule.hysteresis ?? 0));
        const wasActive = simpleAutomationStateRef.current.get(automationNode.id) ?? false;
        let isActive = wasActive;
        if (operator === "gt" || operator === "gte") {
          if (!wasActive) {
            isActive = sensorValue >= baseline + hysteresis;
          } else {
            isActive = sensorValue > baseline - hysteresis;
          }
        } else {
          if (!wasActive) {
            isActive = sensorValue <= baseline - hysteresis;
          } else {
            isActive = sensorValue < baseline + hysteresis;
          }
        }
        if (isActive === wasActive) {
          continue;
        }
        simpleAutomationStateRef.current.set(automationNode.id, isActive);
        const command = rule.command ?? "on_off";
        const rawValue = isActive ? rule.onValue : rule.offValue;
        const actionValue = rawValue === void 0 ? defaultCommandValue(command, isActive) : coerceAutomationValue(rawValue);
        await runtimeControl(targetNode.id, command, actionValue);
      }
    };
    const interval = window.setInterval(evaluate, Number.isFinite(pollingMs) ? pollingMs : 1e3);
    void evaluate();
    return () => {
      window.clearInterval(interval);
    };
  }, [currentMode, nodes, runtimeControl]);
  reactExports.useEffect(() => {
    if (currentMode !== "published") {
      glycolControllerStateRef.current.clear();
      glycolControllerDispatchStateRef.current.clear();
      return;
    }
    const controllerNodes = nodes.filter(
      (node) => node.data.widgetType === "glycol_controller" && node.data.config.glycolController
    );
    if (controllerNodes.length === 0) {
      glycolControllerStateRef.current.clear();
      glycolControllerDispatchStateRef.current.clear();
      return;
    }
    const pollingMs = Math.max(
      250,
      Math.min(
        ...controllerNodes.map((node) => {
          var _a2;
          return Number(((_a2 = node.data.config.glycolController) == null ? void 0 : _a2.pollMs) ?? 1e3);
        })
      )
    );
    const evaluate = async () => {
      const telemetryUpdates = /* @__PURE__ */ new Map();
      for (const controllerNode of controllerNodes) {
        const rule = controllerNode.data.config.glycolController;
        if (!(rule == null ? void 0 : rule.sourceSensorDeviceId)) {
          continue;
        }
        const controllerUnit = inferTemperatureUnitForNode(controllerNode) ?? "F";
        const sensorNode = resolveNodeByAutomationRef(nodes, rule.sourceSensorDeviceId);
        if (!sensorNode) {
          continue;
        }
        const rawSensorValue = Number(
          sensorNode.data.config.value ?? sensorNode.data.config.dummyValue
        );
        if (!Number.isFinite(rawSensorValue)) {
          continue;
        }
        const sensorUnit = inferTemperatureUnitForNode(sensorNode) ?? controllerUnit;
        const sensorValue = convertTemperature(
          rawSensorValue,
          sensorUnit,
          controllerUnit
        );
        let baseline = Number(rule.threshold ?? controllerNode.data.config.setpoint ?? 65);
        if (rule.compareTo === "setpoint_device" && rule.setpointDeviceId) {
          const setpointNode = resolveNodeByAutomationRef(nodes, rule.setpointDeviceId);
          const setpointRaw = Number(
            (setpointNode == null ? void 0 : setpointNode.data.config.value) ?? (setpointNode == null ? void 0 : setpointNode.data.config.setpoint)
          );
          if (!Number.isFinite(setpointRaw)) {
            continue;
          }
          const setpointUnit = inferTemperatureUnitForNode(setpointNode) ?? controllerUnit;
          baseline = convertTemperature(setpointRaw, setpointUnit, controllerUnit);
        }
        const hysteresis = Math.max(0, Number(rule.hysteresis ?? 1));
        const wasActive = glycolControllerStateRef.current.get(controllerNode.id) ?? false;
        let isActive = wasActive;
        if (!wasActive) {
          isActive = sensorValue >= baseline + hysteresis;
        } else {
          isActive = sensorValue > baseline - hysteresis;
        }
        telemetryUpdates.set(controllerNode.id, {
          value: sensorValue,
          setpoint: baseline,
          state: isActive ? "on" : "off"
        });
        glycolControllerStateRef.current.set(controllerNode.id, isActive);
        const configTargetRefs = [rule.pumpDeviceId, rule.valveDeviceId, rule.chillerDeviceId].filter(
          (item) => Boolean(item)
        );
        const wiredTargetNodes = rawEdges.filter(
          (edge) => {
            var _a2;
            return (((_a2 = edge.data) == null ? void 0 : _a2.kind) ?? "fluid") === "data" && edge.source === controllerNode.id;
          }
        ).map((edge) => nodes.find((candidate) => candidate.id === edge.target)).filter(
          (targetNode) => Boolean(targetNode) && (targetNode.data.widgetType === "pump" || targetNode.data.widgetType === "valve" || targetNode.data.widgetType === "heater" || targetNode.data.widgetType === "pid")
        );
        const configTargetNodes = configTargetRefs.map((targetRef) => resolveNodeByAutomationRef(nodes, targetRef)).filter(
          (targetNode) => Boolean(targetNode) && (targetNode.data.widgetType === "pump" || targetNode.data.widgetType === "valve" || targetNode.data.widgetType === "heater" || targetNode.data.widgetType === "pid")
        );
        const targetNodeMap = /* @__PURE__ */ new Map();
        for (const targetNode of [...configTargetNodes, ...wiredTargetNodes]) {
          if (targetNode.id === controllerNode.id) continue;
          targetNodeMap.set(targetNode.id, targetNode);
        }
        const targetNodes = Array.from(targetNodeMap.values());
        const targetHash = targetNodes.map((targetNode) => targetNode.id).sort().join("|");
        const dispatchKey = `${isActive ? "1" : "0"}:${targetHash}`;
        const lastDispatchKey = glycolControllerDispatchStateRef.current.get(controllerNode.id);
        if (dispatchKey === lastDispatchKey) {
          continue;
        }
        glycolControllerDispatchStateRef.current.set(controllerNode.id, dispatchKey);
        const outputUpdates = /* @__PURE__ */ new Map();
        for (const targetNode of targetNodes) {
          let command = "on_off";
          let actionValue = isActive ? "on" : "off";
          if (targetNode.data.widgetType === "valve") {
            command = "open_close";
            if (targetNode.data.config.valveType === "3way") {
              actionValue = isActive ? "c_to_a" : "c_to_b";
            } else {
              actionValue = isActive ? "open" : "closed";
            }
          }
          outputUpdates.set(targetNode.id, actionValue);
          await runtimeControl(targetNode.id, command, actionValue);
        }
        if (outputUpdates.size > 0) {
          setNodes(
            (prev) => prev.map((node) => {
              const nextValue = outputUpdates.get(node.id);
              if (nextValue === void 0) return node;
              if (node.data.widgetType === "valve") {
                if (String(node.data.config.position ?? "") === String(nextValue)) return node;
                return {
                  ...node,
                  data: {
                    ...node.data,
                    config: {
                      ...node.data.config,
                      position: String(nextValue)
                    }
                  }
                };
              }
              if (String(node.data.config.state ?? "") === String(nextValue)) return node;
              return {
                ...node,
                data: {
                  ...node.data,
                  config: {
                    ...node.data.config,
                    state: String(nextValue)
                  }
                }
              };
            })
          );
        }
      }
      if (telemetryUpdates.size > 0) {
        setNodes((prev) => {
          let hasVisualStateChanges = false;
          const next = prev.map((node) => {
            var _a2, _b2, _c2;
            const update = telemetryUpdates.get(node.id);
            if (!update) return node;
            const currentValue = Number(node.data.config.value ?? NaN);
            const currentSetpoint = Number(node.data.config.setpoint ?? NaN);
            const currentState = String(node.data.config.state ?? "off");
            const nextThreshold = (((_a2 = node.data.config.glycolController) == null ? void 0 : _a2.compareTo) ?? "threshold") === "threshold" ? update.setpoint : (_b2 = node.data.config.glycolController) == null ? void 0 : _b2.threshold;
            const currentThreshold = (_c2 = node.data.config.glycolController) == null ? void 0 : _c2.threshold;
            if (currentValue === update.value && currentSetpoint === update.setpoint && currentState === update.state && currentThreshold === nextThreshold) {
              return node;
            }
            hasVisualStateChanges = true;
            return {
              ...node,
              data: {
                ...node.data,
                config: {
                  ...node.data.config,
                  value: update.value,
                  setpoint: update.setpoint,
                  state: update.state,
                  glycolController: {
                    ...node.data.config.glycolController,
                    threshold: nextThreshold
                  }
                }
              }
            };
          });
          return hasVisualStateChanges ? next : prev;
        });
      }
    };
    const interval = window.setInterval(evaluate, Number.isFinite(pollingMs) ? pollingMs : 1e3);
    void evaluate();
    return () => {
      window.clearInterval(interval);
    };
  }, [currentMode, nodes, rawEdges, runtimeControl, setNodes]);
  reactExports.useEffect(() => {
    if (currentMode !== "published") {
      transferControllerDispatchStateRef.current.clear();
      return;
    }
    const controllerNodes = nodes.filter(
      (node) => node.data.widgetType === "transfer_controller" && node.data.config.transferController
    );
    if (controllerNodes.length === 0) {
      transferControllerDispatchStateRef.current.clear();
      return;
    }
    const pollingMs = Math.max(
      250,
      Math.min(
        ...controllerNodes.map((node) => {
          var _a2;
          return Number(((_a2 = node.data.config.transferController) == null ? void 0 : _a2.pollMs) ?? 500);
        })
      )
    );
    const evaluate = async () => {
      const controllerUpdates = /* @__PURE__ */ new Map();
      const outputUpdates = /* @__PURE__ */ new Map();
      for (const controllerNode of controllerNodes) {
        const rule = controllerNode.data.config.transferController;
        if (!rule) {
          continue;
        }
        const wiredTargets = rawEdges.filter(
          (edge) => {
            var _a2;
            return (((_a2 = edge.data) == null ? void 0 : _a2.kind) ?? "fluid") === "data" && edge.source === controllerNode.id;
          }
        ).map((edge) => nodes.find((candidate) => candidate.id === edge.target)).filter((targetNode) => Boolean(targetNode));
        const wiredPump = wiredTargets.find((target) => target.data.widgetType === "pump");
        const wiredValves = wiredTargets.filter((target) => target.data.widgetType === "valve");
        const configPump = rule.pumpDeviceId ? resolveNodeByAutomationRef(nodes, rule.pumpDeviceId) : void 0;
        const pumpNode = (configPump && configPump.data.widgetType === "pump" ? configPump : void 0) ?? wiredPump;
        const sourceRefNodes = (rule.sourceValveDeviceIds ?? []).map((ref) => resolveNodeByAutomationRef(nodes, ref)).filter(
          (node) => Boolean(node) && node.data.widgetType === "valve"
        );
        const destinationRefNodes = (rule.destinationValveDeviceIds ?? []).map((ref) => resolveNodeByAutomationRef(nodes, ref)).filter(
          (node) => Boolean(node) && node.data.widgetType === "valve"
        );
        const useAuto = rule.autoMapWiring !== false;
        let sourceValves = sourceRefNodes;
        let destinationValves = destinationRefNodes;
        if (useAuto && sourceValves.length === 0 && destinationValves.length === 0) {
          const split = Math.ceil(wiredValves.length / 2);
          sourceValves = wiredValves.slice(0, split);
          destinationValves = wiredValves.slice(split);
        }
        const enabled = rule.enabled === true;
        const active = enabled && rule.transferActive === true;
        const runtimeState = !enabled ? "disabled" : active ? "running" : "idle";
        const speedPct = Math.max(
          0,
          Math.min(100, Number(rule.transferSpeedPct ?? controllerNode.data.config.value ?? 60))
        );
        const pumpMode = rule.pumpMode ?? "fsd";
        controllerUpdates.set(controllerNode.id, {
          state: runtimeState === "running" ? "on" : "off",
          runtimeState,
          speedPct
        });
        const sourceIds = sourceValves.map((valve) => valve.id).sort().join("|");
        const destinationIds = destinationValves.map((valve) => valve.id).sort().join("|");
        const dispatchKey = `${runtimeState}:${pumpMode}:${speedPct}:${(pumpNode == null ? void 0 : pumpNode.id) ?? ""}:${sourceIds}:${destinationIds}`;
        const lastDispatchKey = transferControllerDispatchStateRef.current.get(controllerNode.id);
        if (dispatchKey === lastDispatchKey) {
          continue;
        }
        transferControllerDispatchStateRef.current.set(controllerNode.id, dispatchKey);
        for (const valve of sourceValves) {
          const nextPosition = runtimeState === "running" ? valve.data.config.valveType === "3way" ? "c_to_a" : "open" : valve.data.config.valveType === "3way" ? "c_to_b" : "closed";
          outputUpdates.set(valve.id, nextPosition);
          await runtimeControl(valve.id, "open_close", nextPosition);
        }
        for (const valve of destinationValves) {
          const nextPosition = runtimeState === "running" ? valve.data.config.valveType === "3way" ? "c_to_b" : "open" : valve.data.config.valveType === "3way" ? "c_to_a" : "closed";
          outputUpdates.set(valve.id, nextPosition);
          await runtimeControl(valve.id, "open_close", nextPosition);
        }
        if (pumpNode) {
          const pumpValue = runtimeState === "running" ? pumpMode === "vsd" ? speedPct : "on" : pumpMode === "vsd" ? 0 : "off";
          outputUpdates.set(pumpNode.id, pumpValue);
          await runtimeControl(
            pumpNode.id,
            typeof pumpValue === "number" ? "set_value" : "on_off",
            pumpValue
          );
        }
      }
      if (outputUpdates.size > 0) {
        setNodes(
          (prev) => prev.map((node) => {
            const nextValue = outputUpdates.get(node.id);
            if (nextValue === void 0) return node;
            if (node.data.widgetType === "valve") {
              if (String(node.data.config.position ?? "") === String(nextValue)) return node;
              return {
                ...node,
                data: {
                  ...node.data,
                  config: {
                    ...node.data.config,
                    position: String(nextValue)
                  }
                }
              };
            }
            if (node.data.widgetType === "pump" && typeof nextValue === "number") {
              if (Number(node.data.config.value ?? NaN) === nextValue && String(node.data.config.state ?? "") === (nextValue > 0 ? "on" : "off")) {
                return node;
              }
              return {
                ...node,
                data: {
                  ...node.data,
                  config: {
                    ...node.data.config,
                    value: nextValue,
                    state: nextValue > 0 ? "on" : "off"
                  }
                }
              };
            }
            if (String(node.data.config.state ?? "") === String(nextValue)) return node;
            return {
              ...node,
              data: {
                ...node.data,
                config: {
                  ...node.data.config,
                  state: String(nextValue)
                }
              }
            };
          })
        );
      }
      if (controllerUpdates.size > 0) {
        setNodes((prev) => {
          let changed = false;
          const next = prev.map((node) => {
            var _a2, _b2;
            const update = controllerUpdates.get(node.id);
            if (!update) return node;
            if (String(node.data.config.state ?? "off") === update.state && ((_a2 = node.data.config.transferController) == null ? void 0 : _a2.runtimeState) === update.runtimeState && Number(((_b2 = node.data.config.transferController) == null ? void 0 : _b2.transferSpeedPct) ?? NaN) === update.speedPct && Number(node.data.config.value ?? NaN) === update.speedPct) {
              return node;
            }
            changed = true;
            return {
              ...node,
              data: {
                ...node.data,
                config: {
                  ...node.data.config,
                  state: update.state,
                  value: update.speedPct,
                  transferController: {
                    ...node.data.config.transferController,
                    transferSpeedPct: update.speedPct,
                    runtimeState: update.runtimeState
                  }
                }
              }
            };
          });
          return changed ? next : prev;
        });
      }
    };
    const interval = window.setInterval(evaluate, Number.isFinite(pollingMs) ? pollingMs : 500);
    void evaluate();
    return () => {
      window.clearInterval(interval);
    };
  }, [currentMode, nodes, rawEdges, runtimeControl, setNodes]);
  reactExports.useEffect(() => {
    if (currentMode !== "published") {
      recipeExecutorDispatchStateRef.current.clear();
      recipeExecutorRunIdRef.current.clear();
      recipeExecutorAdvanceStateRef.current.clear();
      return;
    }
    const executorNodes = nodes.filter(
      (node) => node.data.widgetType === "recipe_executor" && node.data.config.recipeExecutor
    );
    if (executorNodes.length === 0) {
      recipeExecutorDispatchStateRef.current.clear();
      recipeExecutorRunIdRef.current.clear();
      recipeExecutorAdvanceStateRef.current.clear();
      return;
    }
    const evaluate = async () => {
      var _a2, _b2;
      let runs = [];
      try {
        const response = await fetch("/api/os/recipes/runs");
        const payload = await response.json().catch(() => null);
        if (!response.ok || !(payload == null ? void 0 : payload.success)) {
          throw new Error((payload == null ? void 0 : payload.error) ?? "Failed to load recipe runs");
        }
        runs = Array.isArray(payload.data) ? payload.data : [];
      } catch (error) {
        console.error("Failed to poll recipe runs for canvas executor:", error);
        return;
      }
      const controllerUpdates = /* @__PURE__ */ new Map();
      for (const controllerNode of executorNodes) {
        const recipeId = resolveRecipeIdForExecutor(controllerNode, importedRecipes);
        const linkedRunId = recipeExecutorRunIdRef.current.get(controllerNode.id);
        let run = runs.find((candidate) => candidate.runId === linkedRunId) ?? pickRunForExecutor(runs, recipeId, controllerNode.data.config.recipeName) ?? null;
        if (!run) {
          recipeExecutorDispatchStateRef.current.delete(controllerNode.id);
          recipeExecutorRunIdRef.current.delete(controllerNode.id);
          recipeExecutorAdvanceStateRef.current.delete(controllerNode.id);
          const currentRule = controllerNode.data.config.recipeExecutor ?? {};
          const idleRule = {
            enabled: currentRule.enabled === true,
            running: false,
            paused: false,
            awaitingConfirm: false,
            currentStepIndex: 0,
            stepStartedAtMs: void 0,
            activeStepId: void 0,
            autoProceedDefault: currentRule.autoProceedDefault === true,
            runtimeState: currentRule.enabled === true ? "idle" : "disabled"
          };
          controllerUpdates.set(controllerNode.id, {
            state: "off",
            recipeId,
            recipeName: controllerNode.data.config.recipeName ?? "",
            recipeSteps: controllerNode.data.config.recipeSteps ?? [],
            recipeExecutor: idleRule
          });
          continue;
        }
        recipeExecutorRunIdRef.current.set(controllerNode.id, run.runId);
        const nextRule = toRecipeExecutorRuleFromRun(
          run,
          controllerNode.data.config.recipeExecutor
        );
        const state = nextRule.running ? "on" : "off";
        const runSteps = run.steps;
        if (!nextRule.running || run.status === "completed" || run.status === "canceled" || run.status === "failed") {
          recipeExecutorDispatchStateRef.current.delete(controllerNode.id);
          recipeExecutorAdvanceStateRef.current.delete(controllerNode.id);
          if (run.status === "completed" || run.status === "canceled" || run.status === "failed") {
            recipeExecutorRunIdRef.current.delete(controllerNode.id);
          }
        }
        const activeStep = run.currentStepIndex >= 0 && run.currentStepIndex < run.steps.length ? run.steps[run.currentStepIndex] : void 0;
        if (nextRule.running && activeStep && activeStep.status !== "completed" && activeStep.status !== "failed" && activeStep.status !== "skipped") {
          const activeAdvanceKey = `${run.runId}:${activeStep.id}`;
          const lastAdvanceKey = recipeExecutorAdvanceStateRef.current.get(
            controllerNode.id
          );
          if (lastAdvanceKey && lastAdvanceKey !== activeAdvanceKey) {
            recipeExecutorAdvanceStateRef.current.delete(controllerNode.id);
          }
          const stepMeta = activeStep;
          const targetRef = stepMeta.targetDeviceId ?? ((_a2 = controllerNode.data.control) == null ? void 0 : _a2.targetDeviceId);
          let resolvedTargetNode;
          const rawCommand = stepMeta.command ?? ((_b2 = controllerNode.data.control) == null ? void 0 : _b2.command) ?? void 0;
          const command = ["on_off", "open_close", "route", "set_value", "trigger"].includes(
            String(rawCommand)
          ) ? rawCommand : void 0;
          if (targetRef && command) {
            const targetNode = resolveNodeByAutomationRef(nodes, targetRef);
            if (targetNode) {
              resolvedTargetNode = targetNode;
            }
            if (targetNode && targetNode.id !== controllerNode.id) {
              const fallbackValue = command === "set_value" && Number.isFinite(Number(activeStep.temperatureC)) ? Number(activeStep.temperatureC) : defaultCommandValue(command, true);
              let actionValue = stepMeta.value === void 0 ? fallbackValue : coerceAutomationValue(stepMeta.value);
              if (command === "set_value" && typeof actionValue === "number" && (toFiniteNumber(stepMeta.temperatureC) !== void 0 || stepExpectsTemperatureAdvance(activeStep))) {
                const targetUnit = inferTemperatureUnitForNode(targetNode);
                if (isTemperatureUnit(targetUnit)) {
                  actionValue = convertTemperature(actionValue, "C", targetUnit);
                }
              }
              const dispatchKey = `${run.runId}:${activeStep.id}:${targetNode.id}:${command}:${String(
                actionValue
              )}`;
              const lastDispatch = recipeExecutorDispatchStateRef.current.get(controllerNode.id);
              if (dispatchKey !== lastDispatch) {
                recipeExecutorDispatchStateRef.current.set(
                  controllerNode.id,
                  dispatchKey
                );
                await runtimeControl(targetNode.id, command, actionValue);
              }
            }
          }
          let targetTemperature = toFiniteNumber(
            stepMeta.temperatureC ?? stepMeta.value
          );
          const telemetryTargetNode = resolvedTargetNode ?? (targetRef ? resolveNodeByAutomationRef(nodes, targetRef) : void 0);
          if (targetTemperature !== void 0) {
            const targetUnit = inferTemperatureUnitForNode(telemetryTargetNode);
            if (isTemperatureUnit(targetUnit)) {
              targetTemperature = convertTemperature(
                targetTemperature,
                "C",
                targetUnit
              );
            }
          }
          const stepStatus = String(activeStep.status ?? "pending");
          const canAutoAdvance = stepStatus === "running" || stepStatus === "waiting_confirm";
          if (canAutoAdvance && targetTemperature !== void 0 && stepExpectsTemperatureAdvance(activeStep)) {
            const telemetry = resolveTelemetryValueForStep(nodes, {
              ...activeStep,
              targetDeviceId: targetRef
            });
            if (telemetry) {
              const reached = stepIsCoolingDirection(activeStep) ? telemetry.measured <= targetTemperature + telemetry.tolerance : telemetry.measured >= targetTemperature - telemetry.tolerance;
              if (reached) {
                if (recipeExecutorAdvanceStateRef.current.get(controllerNode.id) !== activeAdvanceKey) {
                  recipeExecutorAdvanceStateRef.current.set(
                    controllerNode.id,
                    activeAdvanceKey
                  );
                  try {
                    const response = await fetch(
                      `/api/os/recipes/run/${run.runId}/action`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "next" })
                      }
                    );
                    const payload = await response.json().catch(() => null);
                    if (!response.ok || !(payload == null ? void 0 : payload.success)) {
                      throw new Error(
                        (payload == null ? void 0 : payload.error) ?? "Failed to advance recipe step on temperature target."
                      );
                    }
                    setStatus(
                      `Recipe step complete (target reached): ${activeStep.name}`
                    );
                  } catch (error) {
                    console.error(
                      "Failed to auto-advance recipe step after target reached:",
                      error
                    );
                    recipeExecutorAdvanceStateRef.current.delete(
                      controllerNode.id
                    );
                  }
                }
              } else if (recipeExecutorAdvanceStateRef.current.get(controllerNode.id) === activeAdvanceKey) {
                recipeExecutorAdvanceStateRef.current.delete(controllerNode.id);
              }
            }
          }
        }
        controllerUpdates.set(controllerNode.id, {
          state,
          recipeId: run.recipeId,
          recipeName: run.recipeName,
          recipeSteps: runSteps,
          recipeExecutor: nextRule
        });
      }
      if (controllerUpdates.size > 0) {
        setNodes((prev) => {
          let changed = false;
          const next = prev.map((node) => {
            const update = controllerUpdates.get(node.id);
            if (!update) return node;
            if (String(node.data.config.state ?? "off") === update.state && String(node.data.config.recipeId ?? "") === String(update.recipeId ?? "") && String(node.data.config.recipeName ?? "") === String(update.recipeName ?? "") && JSON.stringify(node.data.config.recipeSteps ?? []) === JSON.stringify(update.recipeSteps ?? []) && JSON.stringify(node.data.config.recipeExecutor ?? {}) === JSON.stringify(update.recipeExecutor)) {
              return node;
            }
            changed = true;
            return {
              ...node,
              data: {
                ...node.data,
                config: {
                  ...node.data.config,
                  recipeId: update.recipeId,
                  recipeName: update.recipeName,
                  recipeSteps: update.recipeSteps,
                  state: update.state,
                  recipeExecutor: update.recipeExecutor
                }
              }
            };
          });
          return changed ? next : prev;
        });
      }
    };
    const interval = window.setInterval(evaluate, 500);
    void evaluate();
    return () => {
      window.clearInterval(interval);
    };
  }, [currentMode, importedRecipes, nodes, runtimeControl, setNodes]);
  reactExports.useEffect(() => {
    if (currentMode !== "published") {
      co2ControllerDispatchStateRef.current.clear();
      co2PressureStateRef.current.clear();
      co2PurgeStateRef.current.clear();
      co2AlarmStateRef.current.clear();
      return;
    }
    const controllerNodes = nodes.filter(
      (node) => node.data.widgetType === "co2_controller" && node.data.config.co2Controller
    );
    if (controllerNodes.length === 0) {
      co2ControllerDispatchStateRef.current.clear();
      co2PressureStateRef.current.clear();
      co2PurgeStateRef.current.clear();
      co2AlarmStateRef.current.clear();
      return;
    }
    const pollingMs = Math.max(
      250,
      Math.min(
        ...controllerNodes.map((node) => {
          var _a2;
          return Number(((_a2 = node.data.config.co2Controller) == null ? void 0 : _a2.pollMs) ?? 1e3);
        })
      )
    );
    const evaluate = async () => {
      var _a2, _b2;
      const controllerUpdates = /* @__PURE__ */ new Map();
      const now = Date.now();
      for (const controllerNode of controllerNodes) {
        const rule = controllerNode.data.config.co2Controller;
        if (!(rule == null ? void 0 : rule.sourceSensorDeviceId)) {
          continue;
        }
        const sensorNode = resolveNodeByAutomationRef(nodes, rule.sourceSensorDeviceId);
        if (!sensorNode) {
          continue;
        }
        const pressurePsi = Number(sensorNode.data.config.value ?? sensorNode.data.config.dummyValue);
        if (!Number.isFinite(pressurePsi)) {
          continue;
        }
        let baseline = Number(rule.threshold ?? controllerNode.data.config.setpoint ?? 12);
        let co2Patch = {};
        if (rule.compareTo === "setpoint_device" && rule.setpointDeviceId) {
          const setpointNode = resolveNodeByAutomationRef(nodes, rule.setpointDeviceId);
          const setpointValue = Number((setpointNode == null ? void 0 : setpointNode.data.config.value) ?? (setpointNode == null ? void 0 : setpointNode.data.config.setpoint));
          if (!Number.isFinite(setpointValue)) {
            continue;
          }
          baseline = setpointValue;
        } else if ((rule.targetMode ?? "psi") === "volumes") {
          let beverageTempF = Number(rule.beverageTempF ?? 38);
          if (rule.beverageTempSensorDeviceId) {
            const tempNode = resolveNodeByAutomationRef(nodes, rule.beverageTempSensorDeviceId);
            const rawTemp = Number((tempNode == null ? void 0 : tempNode.data.config.value) ?? (tempNode == null ? void 0 : tempNode.data.config.dummyValue));
            if (Number.isFinite(rawTemp)) {
              beverageTempF = toFahrenheit(rawTemp, String((tempNode == null ? void 0 : tempNode.data.config.unit) ?? "F"));
            }
          }
          const targetVolumes = Math.max(0, Number(rule.targetVolumes ?? 2.4));
          baseline = psiFromVolumesAtF(targetVolumes, beverageTempF);
          co2Patch = {
            ...co2Patch,
            threshold: baseline,
            beverageTempF
          };
        }
        const enabled = rule.enabled === true;
        const hysteresis = Math.max(0, Number(rule.hysteresis ?? 0.5));
        const maxPressurePsi = Number(rule.maxPressurePsi ?? 25);
        const sampleTimeoutMs = Math.max(0, Number(rule.sampleTimeoutMs ?? 0));
        const maxRisePsiPerMin = Math.max(0, Number(rule.maxPressureRisePsiPerMin ?? 0));
        const sensorSampleAtMs = Number(sensorNode.data.config.sensorSampleAtMs ?? 0);
        const staleTelemetry = enabled && sampleTimeoutMs > 0 && sensorSampleAtMs > 0 && now - sensorSampleAtMs > sampleTimeoutMs;
        let riseRateExceeded = false;
        const prevPressure = co2PressureStateRef.current.get(controllerNode.id);
        if (prevPressure && now > prevPressure.at) {
          const risePsiPerMin = (pressurePsi - prevPressure.value) / (now - prevPressure.at) * 6e4;
          if (maxRisePsiPerMin > 0 && risePsiPerMin > maxRisePsiPerMin) {
            riseRateExceeded = true;
          }
        }
        co2PressureStateRef.current.set(controllerNode.id, { value: pressurePsi, at: now });
        let alarmReason;
        let runtimeState = "disabled";
        if (enabled) {
          const purgeInjectMs = Math.max(200, Number(rule.purgeInjectMs ?? 4e3));
          const purgeVentMs = Math.max(200, Number(rule.purgeVentMs ?? 2e3));
          const purgeCycles = Math.max(1, Math.floor(Number(rule.purgeCycles ?? 3)));
          const purgeEnabled = rule.purgeActive === true;
          if (purgeEnabled) {
            let purgeState = co2PurgeStateRef.current.get(controllerNode.id);
            if (!purgeState) {
              purgeState = { phase: "inject", cycle: 1, phaseStartedAt: now };
            } else {
              const phaseDuration = purgeState.phase === "inject" ? purgeInjectMs : purgeVentMs;
              if (now - purgeState.phaseStartedAt >= phaseDuration) {
                if (purgeState.phase === "inject") {
                  purgeState = { ...purgeState, phase: "vent", phaseStartedAt: now };
                } else if (purgeState.cycle >= purgeCycles) {
                  purgeState = void 0;
                  co2Patch = { ...co2Patch, purgeActive: false };
                } else {
                  purgeState = {
                    phase: "inject",
                    cycle: purgeState.cycle + 1,
                    phaseStartedAt: now
                  };
                }
              }
            }
            if (purgeState) {
              co2PurgeStateRef.current.set(controllerNode.id, purgeState);
              runtimeState = purgeState.phase === "inject" ? "pressurizing" : "venting";
            } else {
              co2PurgeStateRef.current.delete(controllerNode.id);
            }
          } else {
            co2PurgeStateRef.current.delete(controllerNode.id);
          }
          if (staleTelemetry || riseRateExceeded) {
            runtimeState = "safety_stop";
            co2Patch = { ...co2Patch, purgeActive: false };
            alarmReason = staleTelemetry ? "Pressure sensor telemetry stale." : "Pressure rising too fast.";
            co2PurgeStateRef.current.delete(controllerNode.id);
          } else if (Number.isFinite(maxPressurePsi) && pressurePsi >= maxPressurePsi) {
            runtimeState = "safety_stop";
            co2Patch = { ...co2Patch, purgeActive: false };
            alarmReason = `Pressure exceeded max (${maxPressurePsi.toFixed(1)} PSI).`;
            co2PurgeStateRef.current.delete(controllerNode.id);
          } else if (runtimeState !== "pressurizing" && runtimeState !== "venting") {
            if (pressurePsi <= baseline - hysteresis) {
              runtimeState = "pressurizing";
            } else if (pressurePsi >= baseline + hysteresis) {
              runtimeState = "venting";
            } else {
              runtimeState = "idle";
            }
          }
        } else {
          co2PurgeStateRef.current.delete(controllerNode.id);
        }
        const isActive = runtimeState === "pressurizing" || runtimeState === "venting";
        controllerUpdates.set(controllerNode.id, {
          value: pressurePsi,
          setpoint: baseline,
          state: isActive ? "on" : "off",
          runtimeState,
          alarmReason,
          co2Patch
        });
        const configTargetRefs = [rule.inletValveDeviceId, rule.ventValveDeviceId].filter(
          (item) => Boolean(item)
        );
        const wiredValves = rawEdges.filter(
          (edge) => {
            var _a3;
            return (((_a3 = edge.data) == null ? void 0 : _a3.kind) ?? "fluid") === "data" && edge.source === controllerNode.id;
          }
        ).map((edge) => nodes.find((candidate) => candidate.id === edge.target)).filter(
          (targetNode) => Boolean(targetNode) && targetNode.data.widgetType === "valve"
        );
        const configValves = configTargetRefs.map((targetRef) => resolveNodeByAutomationRef(nodes, targetRef)).filter(
          (targetNode) => Boolean(targetNode) && targetNode.data.widgetType === "valve"
        );
        const valveById = /* @__PURE__ */ new Map();
        for (const valve of [...configValves, ...wiredValves]) {
          if (valve.id === controllerNode.id) continue;
          valveById.set(valve.id, valve);
        }
        const valves = Array.from(valveById.values());
        const inletValve = rule.inletValveDeviceId && resolveNodeByAutomationRef(nodes, rule.inletValveDeviceId) || valves[0];
        const ventValve = rule.ventValveDeviceId && resolveNodeByAutomationRef(nodes, rule.ventValveDeviceId) || valves.find((valve) => valve.id !== (inletValve == null ? void 0 : inletValve.id));
        const alarmTarget = rule.alarmOutputDeviceId ? resolveNodeByAutomationRef(nodes, rule.alarmOutputDeviceId) : void 0;
        const hasAlarm = runtimeState === "safety_stop";
        const dispatchKey = `${runtimeState}:${(inletValve == null ? void 0 : inletValve.id) ?? ""}:${(ventValve == null ? void 0 : ventValve.id) ?? ""}:${(alarmTarget == null ? void 0 : alarmTarget.id) ?? ""}:${hasAlarm ? "1" : "0"}`;
        const lastDispatchKey = co2ControllerDispatchStateRef.current.get(controllerNode.id);
        if (dispatchKey === lastDispatchKey) {
          continue;
        }
        co2ControllerDispatchStateRef.current.set(controllerNode.id, dispatchKey);
        const outputUpdates = /* @__PURE__ */ new Map();
        if (inletValve && inletValve.data.widgetType === "valve") {
          const inletValue = runtimeState === "pressurizing" ? inletValve.data.config.valveType === "3way" ? "c_to_a" : "open" : runtimeState === "safety_stop" ? inletValve.data.config.valveType === "3way" ? "c_to_b" : "closed" : inletValve.data.config.valveType === "3way" ? "c_to_b" : "closed";
          outputUpdates.set(inletValve.id, inletValue);
          await runtimeControl(inletValve.id, "open_close", inletValue);
        }
        if (ventValve && ventValve.data.widgetType === "valve") {
          const ventValue = runtimeState === "venting" || runtimeState === "safety_stop" ? ventValve.data.config.valveType === "3way" ? "c_to_a" : "open" : ventValve.data.config.valveType === "3way" ? "c_to_b" : "closed";
          outputUpdates.set(ventValve.id, ventValue);
          await runtimeControl(ventValve.id, "open_close", ventValue);
        }
        if (alarmTarget && alarmTarget.id !== controllerNode.id && alarmTarget.data.widgetType !== "sensor" && alarmTarget.data.widgetType !== "display" && alarmTarget.data.widgetType !== "note") {
          const alarmValue = alarmTarget.data.widgetType === "valve" ? hasAlarm ? alarmTarget.data.config.valveType === "3way" ? "c_to_a" : "open" : alarmTarget.data.config.valveType === "3way" ? "c_to_b" : "closed" : hasAlarm ? "on" : "off";
          outputUpdates.set(alarmTarget.id, alarmValue);
          await runtimeControl(
            alarmTarget.id,
            alarmTarget.data.widgetType === "valve" ? "open_close" : "on_off",
            alarmValue
          );
        }
        if (outputUpdates.size > 0) {
          setNodes(
            (prev) => prev.map((node) => {
              const nextValue = outputUpdates.get(node.id);
              if (nextValue === void 0) return node;
              if (node.data.widgetType === "valve") {
                if (String(node.data.config.position ?? "") === String(nextValue)) return node;
                return {
                  ...node,
                  data: {
                    ...node.data,
                    config: {
                      ...node.data.config,
                      position: String(nextValue)
                    }
                  }
                };
              }
              if (String(node.data.config.state ?? "") === String(nextValue)) return node;
              return {
                ...node,
                data: {
                  ...node.data,
                  config: {
                    ...node.data.config,
                    state: String(nextValue)
                  }
                }
              };
            })
          );
        }
      }
      if (controllerUpdates.size > 0) {
        setNodes((prev) => {
          let changed = false;
          const next = prev.map((node) => {
            var _a3, _b3, _c2, _d2;
            const update = controllerUpdates.get(node.id);
            if (!update) return node;
            const currentRuntime = ((_a3 = node.data.config.co2Controller) == null ? void 0 : _a3.runtimeState) ?? "disabled";
            const nextThreshold = (((_b3 = node.data.config.co2Controller) == null ? void 0 : _b3.compareTo) ?? "threshold") === "threshold" ? update.setpoint : (_c2 = node.data.config.co2Controller) == null ? void 0 : _c2.threshold;
            const currentPatch = node.data.config.co2Controller ?? {};
            const nextPatch = {
              ...currentPatch,
              ...update.co2Patch ?? {},
              lastAlarmReason: update.alarmReason
            };
            if (Number(node.data.config.value ?? NaN) === update.value && Number(node.data.config.setpoint ?? NaN) === update.setpoint && String(node.data.config.state ?? "off") === update.state && currentRuntime === update.runtimeState && ((_d2 = node.data.config.co2Controller) == null ? void 0 : _d2.threshold) === nextThreshold && currentPatch.purgeActive === nextPatch.purgeActive && currentPatch.lastAlarmReason === nextPatch.lastAlarmReason) {
              return node;
            }
            changed = true;
            return {
              ...node,
              data: {
                ...node.data,
                config: {
                  ...node.data.config,
                  value: update.value,
                  setpoint: update.setpoint,
                  state: update.state,
                  co2Controller: {
                    ...nextPatch,
                    runtimeState: update.runtimeState,
                    threshold: nextThreshold
                  }
                }
              }
            };
          });
          return changed ? next : prev;
        });
        const eventsToAdd = [];
        for (const controllerNode of controllerNodes) {
          const update = controllerUpdates.get(controllerNode.id);
          if (!update) continue;
          const previousReason = co2AlarmStateRef.current.get(controllerNode.id);
          const nextReason = update.alarmReason;
          if (nextReason && previousReason !== nextReason) {
            if (((_a2 = controllerNode.data.config.co2Controller) == null ? void 0 : _a2.emitAlarmEvents) !== false) {
              eventsToAdd.push({
                id: makeId("co2-alarm"),
                controllerId: controllerNode.id,
                controllerLabel: controllerNode.data.label,
                severity: "critical",
                message: nextReason,
                at: (/* @__PURE__ */ new Date()).toISOString()
              });
            }
            setStatus(`CO2 alarm: ${controllerNode.data.label} - ${nextReason}`);
          } else if (!nextReason && previousReason) {
            if (((_b2 = controllerNode.data.config.co2Controller) == null ? void 0 : _b2.emitAlarmEvents) !== false) {
              eventsToAdd.push({
                id: makeId("co2-alarm-clear"),
                controllerId: controllerNode.id,
                controllerLabel: controllerNode.data.label,
                severity: "info",
                message: "CO2 alarm cleared.",
                at: (/* @__PURE__ */ new Date()).toISOString()
              });
            }
          }
          if (nextReason) {
            co2AlarmStateRef.current.set(controllerNode.id, nextReason);
          } else {
            co2AlarmStateRef.current.delete(controllerNode.id);
          }
        }
        if (eventsToAdd.length > 0) {
          setCo2AlarmEvents((prev) => [...eventsToAdd, ...prev].slice(0, 40));
        }
      }
    };
    const interval = window.setInterval(evaluate, Number.isFinite(pollingMs) ? pollingMs : 1e3);
    void evaluate();
    return () => {
      window.clearInterval(interval);
    };
  }, [currentMode, nodes, rawEdges, runtimeControl, setNodes]);
  reactExports.useEffect(() => {
    if (currentMode !== "published") {
      hltControllerStateRef.current.clear();
      hltControllerDispatchStateRef.current.clear();
      return;
    }
    const controllerNodes = nodes.filter(
      (node) => node.data.widgetType === "hlt_controller" && node.data.config.hltController
    );
    if (controllerNodes.length === 0) {
      hltControllerStateRef.current.clear();
      hltControllerDispatchStateRef.current.clear();
      return;
    }
    const pollingMs = Math.max(
      250,
      Math.min(
        ...controllerNodes.map((node) => {
          var _a2;
          return Number(((_a2 = node.data.config.hltController) == null ? void 0 : _a2.pollMs) ?? 1e3);
        })
      )
    );
    const evaluate = async () => {
      const telemetryUpdates = /* @__PURE__ */ new Map();
      for (const controllerNode of controllerNodes) {
        const rule = controllerNode.data.config.hltController;
        if (!(rule == null ? void 0 : rule.sourceSensorDeviceId)) {
          continue;
        }
        const controllerUnit = inferTemperatureUnitForNode(controllerNode) ?? "F";
        const sensorNode = resolveNodeByAutomationRef(nodes, rule.sourceSensorDeviceId);
        if (!sensorNode) {
          continue;
        }
        const rawSensorValue = Number(
          sensorNode.data.config.value ?? sensorNode.data.config.dummyValue
        );
        if (!Number.isFinite(rawSensorValue)) {
          continue;
        }
        const sensorUnit = inferTemperatureUnitForNode(sensorNode) ?? controllerUnit;
        const sensorValue = convertTemperature(
          rawSensorValue,
          sensorUnit,
          controllerUnit
        );
        let baseline = Number(rule.threshold ?? controllerNode.data.config.setpoint ?? 152);
        if (rule.compareTo === "setpoint_device" && rule.setpointDeviceId) {
          const setpointNode = resolveNodeByAutomationRef(nodes, rule.setpointDeviceId);
          const setpointRaw = Number(
            (setpointNode == null ? void 0 : setpointNode.data.config.value) ?? (setpointNode == null ? void 0 : setpointNode.data.config.setpoint)
          );
          if (!Number.isFinite(setpointRaw)) {
            continue;
          }
          const setpointUnit = inferTemperatureUnitForNode(setpointNode) ?? controllerUnit;
          baseline = convertTemperature(setpointRaw, setpointUnit, controllerUnit);
        }
        const enabled = rule.enabled === true;
        const hysteresis = Math.max(0, Number(rule.hysteresis ?? 1));
        const wasActive = hltControllerStateRef.current.get(controllerNode.id) ?? false;
        let isActive = false;
        if (enabled) {
          if (!wasActive) {
            isActive = sensorValue <= baseline - hysteresis;
          } else {
            isActive = sensorValue < baseline + hysteresis;
          }
        }
        telemetryUpdates.set(controllerNode.id, {
          value: sensorValue,
          setpoint: baseline,
          state: isActive ? "on" : "off"
        });
        hltControllerStateRef.current.set(controllerNode.id, isActive);
        const configTargetRefs = [rule.heaterDeviceId, rule.recircPumpDeviceId].filter(
          (item) => Boolean(item)
        );
        const wiredTargetNodes = rawEdges.filter(
          (edge) => {
            var _a2;
            return (((_a2 = edge.data) == null ? void 0 : _a2.kind) ?? "fluid") === "data" && edge.source === controllerNode.id;
          }
        ).map((edge) => nodes.find((candidate) => candidate.id === edge.target)).filter(
          (targetNode) => Boolean(targetNode) && (targetNode.data.widgetType === "heater" || targetNode.data.widgetType === "pump")
        );
        const configTargetNodes = configTargetRefs.map((targetRef) => resolveNodeByAutomationRef(nodes, targetRef)).filter(
          (targetNode) => Boolean(targetNode) && (targetNode.data.widgetType === "heater" || targetNode.data.widgetType === "pump")
        );
        const targetNodeMap = /* @__PURE__ */ new Map();
        for (const targetNode of [...configTargetNodes, ...wiredTargetNodes]) {
          if (targetNode.id === controllerNode.id) continue;
          targetNodeMap.set(targetNode.id, targetNode);
        }
        const targetNodes = Array.from(targetNodeMap.values());
        const targetHash = targetNodes.map((targetNode) => targetNode.id).sort().join("|");
        const dispatchKey = `${enabled ? "1" : "0"}:${isActive ? "1" : "0"}:${targetHash}`;
        const lastDispatchKey = hltControllerDispatchStateRef.current.get(controllerNode.id);
        if (dispatchKey === lastDispatchKey) {
          continue;
        }
        hltControllerDispatchStateRef.current.set(controllerNode.id, dispatchKey);
        const outputUpdates = /* @__PURE__ */ new Map();
        for (const targetNode of targetNodes) {
          const actionValue = isActive ? "on" : "off";
          outputUpdates.set(targetNode.id, actionValue);
          await runtimeControl(targetNode.id, "on_off", actionValue);
        }
        if (outputUpdates.size > 0) {
          setNodes(
            (prev) => prev.map((node) => {
              const nextValue = outputUpdates.get(node.id);
              if (nextValue === void 0) return node;
              if (String(node.data.config.state ?? "") === String(nextValue)) return node;
              return {
                ...node,
                data: {
                  ...node.data,
                  config: {
                    ...node.data.config,
                    state: String(nextValue)
                  }
                }
              };
            })
          );
        }
      }
      if (telemetryUpdates.size > 0) {
        setNodes((prev) => {
          let hasVisualStateChanges = false;
          const next = prev.map((node) => {
            var _a2, _b2, _c2;
            const update = telemetryUpdates.get(node.id);
            if (!update) return node;
            const currentValue = Number(node.data.config.value ?? NaN);
            const currentSetpoint = Number(node.data.config.setpoint ?? NaN);
            const currentState = String(node.data.config.state ?? "off");
            const nextThreshold = (((_a2 = node.data.config.hltController) == null ? void 0 : _a2.compareTo) ?? "threshold") === "threshold" ? update.setpoint : (_b2 = node.data.config.hltController) == null ? void 0 : _b2.threshold;
            const currentThreshold = (_c2 = node.data.config.hltController) == null ? void 0 : _c2.threshold;
            if (currentValue === update.value && currentSetpoint === update.setpoint && currentState === update.state && currentThreshold === nextThreshold) {
              return node;
            }
            hasVisualStateChanges = true;
            return {
              ...node,
              data: {
                ...node.data,
                config: {
                  ...node.data.config,
                  value: update.value,
                  setpoint: update.setpoint,
                  state: update.state,
                  hltController: {
                    ...node.data.config.hltController,
                    threshold: nextThreshold
                  }
                }
              }
            };
          });
          return hasVisualStateChanges ? next : prev;
        });
      }
    };
    const interval = window.setInterval(evaluate, Number.isFinite(pollingMs) ? pollingMs : 1e3);
    void evaluate();
    return () => {
      window.clearInterval(interval);
    };
  }, [currentMode, nodes, rawEdges, runtimeControl, setNodes]);
  const writableControlEndpoints = reactExports.useMemo(
    () => availableControlEndpoints.filter((endpoint) => isWritableEndpointDirection(endpoint.direction)),
    [availableControlEndpoints]
  );
  const displayedEdges = reactExports.useMemo(
    () => annotateFluidEdges(nodes, rawEdges).map((edge) => {
      var _a2, _b2, _c2;
      const kind = ((_a2 = edge.data) == null ? void 0 : _a2.kind) ?? "fluid";
      if (kind === "fluid") {
        const medium = ((_b2 = edge.data) == null ? void 0 : _b2.medium) ?? "product";
        const mediumColor = ((_c2 = fluidColorByMedium[medium]) == null ? void 0 : _c2.active) ?? fluidColorByMedium.product.active;
        return {
          ...edge,
          type: "step",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: mediumColor,
            width: 16,
            height: 16
          }
        };
      }
      return {
        ...edge,
        type: "default",
        animated: true,
        style: edgeStyleByKind[kind],
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: kind === "data" ? "#f59e0b" : kind === "power" ? "#dc2626" : "#111827",
          width: 14,
          height: 14
        }
      };
    }),
    [nodes, rawEdges]
  );
  const selectedNode = reactExports.useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );
  const selectedImportedRecipe = reactExports.useMemo(
    () => importedRecipes.find((recipe) => recipe.id === selectedImportedRecipeId) ?? importedRecipes[0] ?? null,
    [importedRecipes, selectedImportedRecipeId]
  );
  const applyProjectToEditor = reactExports.useCallback((incomingProject) => {
    const firstPage = incomingProject.pages[0];
    const pageId = activePageIdRef.current || (firstPage == null ? void 0 : firstPage.id) || "";
    const page = incomingProject.pages.find((candidate) => candidate.id === pageId) ?? firstPage ?? createPage("Master Layout");
    setActivePageId(page.id);
    setNodes(page.nodes ?? []);
    setRawEdges(page.edges ?? []);
  }, [setNodes, setRawEdges]);
  const loadProject = reactExports.useCallback(async () => {
    try {
      setStatus("Loading commissioning project from disk...");
      const [projectRes, devicesRes, endpointsRes, recipesRes] = await Promise.all([
        fetch("/api/os/canvas/project"),
        fetch("/api/os/registry/devices"),
        fetch("/api/os/endpoints?limit=1000"),
        fetch("/api/os/recipes")
      ]);
      if (!projectRes.ok || !devicesRes.ok) {
        throw new Error(`API unavailable (${projectRes.status}/${devicesRes.status})`);
      }
      const projectPayload = await projectRes.json().catch(() => null);
      const devicePayload = await devicesRes.json().catch(() => null);
      const endpointsPayload = endpointsRes.ok ? await endpointsRes.json().catch(() => null) : null;
      const recipesPayload = recipesRes.ok ? await recipesRes.json().catch(() => null) : null;
      const loadedProject = (projectPayload == null ? void 0 : projectPayload.data) && projectPayload.success ? projectPayload.data : createDefaultProject();
      const loadedDevices = (devicePayload == null ? void 0 : devicePayload.data) && devicePayload.success ? devicePayload.data : [];
      const loadedRecipes = (recipesPayload == null ? void 0 : recipesPayload.data) && recipesPayload.success ? recipesPayload.data : [];
      setProject(loadedProject);
      setDevices(loadedDevices);
      setImportedRecipes(loadedRecipes);
      setSelectedImportedRecipeId(
        (current) => {
          var _a2;
          return current && loadedRecipes.some((recipe) => recipe.id === current) ? current : ((_a2 = loadedRecipes[0]) == null ? void 0 : _a2.id) ?? "";
        }
      );
      setAvailableControlEndpoints(
        Array.isArray(endpointsPayload == null ? void 0 : endpointsPayload.data) ? endpointsPayload.data.filter(
          (ep) => typeof (ep == null ? void 0 : ep.id) === "number" && typeof (ep == null ? void 0 : ep.channelId) === "string" && typeof (ep == null ? void 0 : ep.endpointKind) === "string" && typeof (ep == null ? void 0 : ep.direction) === "string"
        ).map((ep) => ({
          id: ep.id,
          channelId: ep.channelId,
          endpointKind: ep.endpointKind,
          direction: ep.direction
        })) : []
      );
      applyProjectToEditor(loadedProject);
      setStatus("Canvas project loaded.");
    } catch (error) {
      console.error("Failed to load canvas project:", error);
      const fallback = createDefaultProject();
      setProject(fallback);
      setDevices([]);
      setImportedRecipes([]);
      setSelectedImportedRecipeId("");
      setAvailableControlEndpoints([]);
      applyProjectToEditor(fallback);
      setStatus("Loaded fallback project (API unavailable).");
    }
  }, [applyProjectToEditor]);
  reactExports.useEffect(() => {
    loadProject();
  }, [loadProject]);
  reactExports.useEffect(() => {
    if (!currentPage) return;
    setNodes(currentPage.nodes ?? []);
    setRawEdges(currentPage.edges ?? []);
    setSelectedNodeId(null);
  }, [currentPage, setNodes, setRawEdges]);
  reactExports.useEffect(() => {
    var _a2;
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const inboundDataByTarget = /* @__PURE__ */ new Map();
    const outboundDataBySource = /* @__PURE__ */ new Map();
    for (const edge of rawEdges) {
      if ((((_a2 = edge.data) == null ? void 0 : _a2.kind) ?? "fluid") !== "data") continue;
      const sourceNode = nodeById.get(edge.source);
      const targetNode = nodeById.get(edge.target);
      if (!sourceNode || !targetNode) continue;
      const inbound = inboundDataByTarget.get(edge.target) ?? [];
      inbound.push(sourceNode);
      inboundDataByTarget.set(edge.target, inbound);
      const outbound = outboundDataBySource.get(edge.source) ?? [];
      outbound.push(targetNode);
      outboundDataBySource.set(edge.source, outbound);
    }
    let changedAny = false;
    const nextNodes = nodes.map((node) => {
      var _a3, _b2, _c2;
      if (node.data.widgetType !== "glycol_controller" && node.data.widgetType !== "hlt_controller" && node.data.widgetType !== "co2_controller" && node.data.widgetType !== "transfer_controller" && node.data.widgetType !== "recipe_executor") {
        return node;
      }
      const inbound = inboundDataByTarget.get(node.id) ?? [];
      const outbound = outboundDataBySource.get(node.id) ?? [];
      const sourceSensor = inbound.find((source) => source.data.widgetType === "sensor");
      const pumpTarget = outbound.find((target) => target.data.widgetType === "pump");
      const valveTarget = outbound.find((target) => target.data.widgetType === "valve");
      const controlTarget = outbound.find(
        (target) => target.data.widgetType !== "sensor" && target.data.widgetType !== "display" && target.data.widgetType !== "note"
      );
      const chillerTarget = outbound.find(
        (target) => target.data.widgetType === "heater" || target.data.widgetType === "pid"
      );
      const heaterTarget = outbound.find((target) => target.data.widgetType === "heater");
      const valveTargets = outbound.filter((target) => target.data.widgetType === "valve");
      const nextSourceSensorDeviceId = sourceSensor ? toAutomationRef(sourceSensor) : void 0;
      const nextPumpDeviceId = pumpTarget ? toAutomationRef(pumpTarget) : void 0;
      const nextValveDeviceId = valveTarget ? toAutomationRef(valveTarget) : void 0;
      const nextChillerDeviceId = chillerTarget ? toAutomationRef(chillerTarget) : void 0;
      if (node.data.widgetType === "glycol_controller") {
        const current2 = node.data.config.glycolController ?? {};
        if (current2.sourceSensorDeviceId === nextSourceSensorDeviceId && current2.pumpDeviceId === nextPumpDeviceId && current2.valveDeviceId === nextValveDeviceId && current2.chillerDeviceId === nextChillerDeviceId) {
          return node;
        }
        changedAny = true;
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              glycolController: {
                ...current2,
                sourceSensorDeviceId: nextSourceSensorDeviceId,
                pumpDeviceId: nextPumpDeviceId,
                valveDeviceId: nextValveDeviceId,
                chillerDeviceId: nextChillerDeviceId
              }
            }
          }
        };
      }
      const nextHeaterDeviceId = heaterTarget ? toAutomationRef(heaterTarget) : void 0;
      const nextRecircPumpDeviceId = nextPumpDeviceId;
      const nextInletValveDeviceId = valveTargets[0] ? toAutomationRef(valveTargets[0]) : void 0;
      const nextVentValveDeviceId = valveTargets[1] ? toAutomationRef(valveTargets[1]) : void 0;
      const nextSourceValveRefs = valveTargets.slice(0, Math.ceil(valveTargets.length / 2)).map((valve) => toAutomationRef(valve));
      const nextDestinationValveRefs = valveTargets.slice(Math.ceil(valveTargets.length / 2)).map((valve) => toAutomationRef(valve));
      if (node.data.widgetType === "co2_controller") {
        const current2 = node.data.config.co2Controller ?? {};
        if (current2.sourceSensorDeviceId === nextSourceSensorDeviceId && current2.inletValveDeviceId === nextInletValveDeviceId && current2.ventValveDeviceId === nextVentValveDeviceId) {
          return node;
        }
        changedAny = true;
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              co2Controller: {
                ...current2,
                sourceSensorDeviceId: nextSourceSensorDeviceId,
                inletValveDeviceId: nextInletValveDeviceId,
                ventValveDeviceId: nextVentValveDeviceId
              }
            }
          }
        };
      }
      if (node.data.widgetType === "transfer_controller") {
        const current2 = node.data.config.transferController ?? {};
        const autoMap = current2.autoMapWiring !== false;
        const currentSource = current2.sourceValveDeviceIds ?? [];
        const currentDestination = current2.destinationValveDeviceIds ?? [];
        const nextSource = autoMap ? nextSourceValveRefs : currentSource;
        const nextDestination = autoMap ? nextDestinationValveRefs : currentDestination;
        const sourceSame = currentSource.length === nextSource.length && currentSource.every((ref, idx) => ref === nextSource[idx]);
        const destinationSame = currentDestination.length === nextDestination.length && currentDestination.every((ref, idx) => ref === nextDestination[idx]);
        if (current2.pumpDeviceId === nextPumpDeviceId && sourceSame && destinationSame) {
          return node;
        }
        changedAny = true;
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              transferController: {
                ...current2,
                pumpDeviceId: nextPumpDeviceId,
                sourceValveDeviceIds: nextSource,
                destinationValveDeviceIds: nextDestination
              }
            }
          }
        };
      }
      if (node.data.widgetType === "recipe_executor") {
        const nextTargetDeviceId = controlTarget ? toAutomationRef(controlTarget) : void 0;
        const inferredCommand = (controlTarget == null ? void 0 : controlTarget.data.widgetType) === "valve" ? "open_close" : (controlTarget == null ? void 0 : controlTarget.data.widgetType) === "slider" ? "set_value" : (controlTarget == null ? void 0 : controlTarget.data.widgetType) === "pump" ? "on_off" : ((_a3 = node.data.control) == null ? void 0 : _a3.command) ?? "trigger";
        if (((_b2 = node.data.control) == null ? void 0 : _b2.targetDeviceId) === nextTargetDeviceId && ((_c2 = node.data.control) == null ? void 0 : _c2.command) === inferredCommand) {
          return node;
        }
        changedAny = true;
        return {
          ...node,
          data: {
            ...node.data,
            control: {
              ...node.data.control,
              targetDeviceId: nextTargetDeviceId,
              command: inferredCommand
            }
          }
        };
      }
      const current = node.data.config.hltController ?? {};
      if (current.sourceSensorDeviceId === nextSourceSensorDeviceId && current.heaterDeviceId === nextHeaterDeviceId && current.recircPumpDeviceId === nextRecircPumpDeviceId) {
        return node;
      }
      changedAny = true;
      return {
        ...node,
        data: {
          ...node.data,
          config: {
            ...node.data.config,
            hltController: {
              ...current,
              sourceSensorDeviceId: nextSourceSensorDeviceId,
              heaterDeviceId: nextHeaterDeviceId,
              recircPumpDeviceId: nextRecircPumpDeviceId
            }
          }
        }
      };
    });
    if (changedAny) {
      setNodes(nextNodes);
      setStatus("Auto-configured controller outputs from data wiring.");
    }
  }, [nodes, rawEdges, setNodes]);
  reactExports.useEffect(() => {
    const dataEdges = rawEdges.filter((edge) => {
      var _a2;
      return (((_a2 = edge.data) == null ? void 0 : _a2.kind) ?? "fluid") === "data";
    });
    if (dataEdges.length === 0) return;
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const incomingByTarget = /* @__PURE__ */ new Map();
    for (const edge of dataEdges) {
      const source = nodeById.get(edge.source);
      if (!source || source.data.widgetType !== "sensor") continue;
      const list = incomingByTarget.get(edge.target) ?? [];
      list.push(source);
      incomingByTarget.set(edge.target, list);
    }
    if (incomingByTarget.size === 0) return;
    setNodes((prev) => {
      let changed = false;
      const next = prev.map((node) => {
        const sensorSources = incomingByTarget.get(node.id) ?? [];
        if (sensorSources.length === 0) return node;
        const tempSensor = sensorSources.find(
          (sensor) => sensor.data.config.sensorType === "temperature"
        );
        const firstSensor = sensorSources[0];
        if (node.data.widgetType === "vessel") {
          const source = tempSensor ?? firstSensor;
          const numeric = Number(source.data.config.value ?? source.data.config.dummyValue);
          if (!Number.isFinite(numeric)) return node;
          if (Number(node.data.config.temperature) === numeric) return node;
          changed = true;
          return {
            ...node,
            data: {
              ...node.data,
              config: {
                ...node.data.config,
                temperature: numeric
              }
            }
          };
        }
        if (node.data.widgetType === "display") {
          const source = tempSensor ?? firstSensor;
          const value = source.data.config.value ?? source.data.config.dummyValue ?? "--";
          if (String(node.data.config.value ?? "--") === String(value)) return node;
          changed = true;
          return {
            ...node,
            data: {
              ...node.data,
              config: {
                ...node.data.config,
                value
              }
            }
          };
        }
        return node;
      });
      return changed ? next : prev;
    });
  }, [nodes, rawEdges, setNodes]);
  const stripRuntimeData = (node) => {
    const persistedData = node.data;
    return {
      id: node.id,
      type: node.type ?? "widget",
      position: node.position,
      data: persistedData
    };
  };
  const commitProject = reactExports.useCallback(
    (baseProject) => {
      if (!baseProject) return null;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const updatedPages = baseProject.pages.map((page) => {
        if (page.id !== activePageId) return page;
        return {
          ...page,
          nodes: nodes.map((node) => stripRuntimeData(node)),
          edges: rawEdges.map((edge) => {
            var _a2, _b2, _c2;
            return {
              id: edge.id,
              source: edge.source,
              target: edge.target,
              sourceHandle: edge.sourceHandle,
              targetHandle: edge.targetHandle,
              type: edge.type ?? "smoothstep",
              data: (((_a2 = edge.data) == null ? void 0 : _a2.kind) ?? "fluid") === "fluid" ? { kind: "fluid", medium: ((_b2 = edge.data) == null ? void 0 : _b2.medium) ?? "product" } : { kind: ((_c2 = edge.data) == null ? void 0 : _c2.kind) ?? "fluid" }
            };
          }),
          updatedAt: now
        };
      });
      return {
        ...baseProject,
        pages: updatedPages,
        updatedAt: now
      };
    },
    [activePageId, nodes, rawEdges]
  );
  const persistAll = reactExports.useCallback(
    async (nextProject, nextDevices) => {
      setStatus("Saving to commissioning JSON files...");
      const [projectRes, devicesRes] = await Promise.all([
        fetch("/api/os/canvas/project", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextProject)
        }),
        fetch("/api/os/registry/devices", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextDevices)
        })
      ]);
      if (!projectRes.ok || !devicesRes.ok) {
        throw new Error(`Save failed (${projectRes.status}/${devicesRes.status})`);
      }
      setStatus("Saved.");
    },
    []
  );
  const handleSave = reactExports.useCallback(async () => {
    try {
      const nextProject = commitProject(project);
      if (!nextProject) return;
      setProject(nextProject);
      await persistAll(nextProject, devices);
    } catch (error) {
      console.error("Save failed:", error);
      setStatus("Save failed.");
    }
  }, [commitProject, project, devices, persistAll]);
  const upsertDeviceForNode = reactExports.useCallback(
    (node) => {
      if (!isExternalFlowWidget(node.data.widgetType)) {
        return node;
      }
      const logicalDeviceId = node.data.logicalDeviceId ?? `dev-${node.id}`;
      setDevices((prev) => {
        if (prev.some((device) => device.id === logicalDeviceId)) {
          return prev;
        }
        return [
          ...prev,
          createRegisteredDevice(node.data.label, node.data.widgetType, logicalDeviceId)
        ];
      });
      return {
        ...node,
        data: {
          ...node.data,
          logicalDeviceId
        }
      };
    },
    []
  );
  const handleAddNode = reactExports.useCallback(
    (widgetOption, logicalDeviceId) => {
      const mode = (currentPage == null ? void 0 : currentPage.mode) ?? "draft";
      const position = { x: 120 + nodes.length * 18, y: 120 + nodes.length * 14 };
      const widgetType = widgetOption === "valve_3way" ? "valve" : widgetOption;
      let nextNode = createNode(widgetType, position);
      if (widgetOption === "valve_3way") {
        nextNode = {
          ...nextNode,
          data: {
            ...nextNode.data,
            label: `VALVE 3-WAY ${nextNode.id.slice(-4)}`,
            config: {
              ...nextNode.data.config,
              valveType: "3way",
              position: "c_to_a"
            }
          }
        };
      }
      if (widgetType === "button" || widgetType === "switch" || widgetType === "slider" || widgetType === "pump" || widgetType === "valve" || widgetType === "heater") {
        nextNode = {
          ...nextNode,
          data: {
            ...nextNode.data,
            control: {
              command: widgetType === "slider" ? "set_value" : widgetType === "valve" ? "open_close" : "on_off",
              driverType: "dummy"
            }
          }
        };
      }
      if (logicalDeviceId) {
        nextNode = {
          ...nextNode,
          data: {
            ...nextNode.data,
            logicalDeviceId
          }
        };
      }
      nextNode = upsertDeviceForNode(nextNode);
      const nextNodes = [...nodes, nextNode];
      setNodes(nextNodes);
      setSelectedNodeId(nextNode.id);
      setTimeout(() => {
        setCenter(nextNode.position.x, nextNode.position.y, {
          zoom: 1,
          duration: 250
        });
      }, 0);
      if (mode !== "draft" && project && currentPage) {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        setProject({
          ...project,
          pages: project.pages.map(
            (page) => page.id === currentPage.id ? {
              ...page,
              mode: "draft",
              nodes: nextNodes,
              edges: rawEdges,
              updatedAt: now
            } : page
          ),
          updatedAt: now
        });
        setStatus(
          `Switched to Draft and added ${widgetOptionLabel[widgetOption]} widget. Nodes: ${nextNodes.length}`
        );
      } else {
        setStatus(
          `Added ${widgetOptionLabel[widgetOption]} widget. Nodes: ${nextNodes.length}`
        );
      }
    },
    [currentPage, nodes, project, rawEdges, setCenter, setNodes, upsertDeviceForNode]
  );
  const handleConnect = reactExports.useCallback(
    (connection) => {
      if (!connection.source || !connection.target) {
        return;
      }
      const sourceNode = nodes.find((node) => node.id === connection.source);
      const targetNode = nodes.find((node) => node.id === connection.target);
      const sourcePort = resolveNodePort(sourceNode, connection.sourceHandle);
      const targetPort = resolveNodePort(targetNode, connection.targetHandle);
      if (!sourcePort || !targetPort) {
        setStatus("Invalid connection handles.");
        return;
      }
      const compatibility = resolveConnectionCompatibility({
        sourcePort,
        targetPort,
        activeFluidMedium
      });
      if (!compatibility.ok) {
        setStatus(compatibility.reason);
        return;
      }
      const medium = compatibility.kind === "fluid" ? compatibility.medium : void 0;
      const next = createEdge(connection.source, connection.target, compatibility.kind, medium);
      setRawEdges((prev) => [
        ...prev,
        {
          ...next,
          sourceHandle: connection.sourceHandle ?? void 0,
          targetHandle: connection.targetHandle ?? void 0,
          style: compatibility.kind === "fluid" ? {
            stroke: fluidColorByMedium[medium ?? "product"].active,
            strokeWidth: 2.2
          } : edgeStyleByKind[compatibility.kind]
        }
      ]);
      setStatus(
        compatibility.kind === "fluid" ? `Connected ${medium ?? "product"} flow line.` : `Connected ${compatibility.kind} line.`
      );
    },
    [activeFluidMedium, nodes, setRawEdges]
  );
  const confirmDeleteWire = reactExports.useCallback(() => {
    if (!wireDeleteTarget) return;
    setLastUndoAction({ type: "wire", edge: wireDeleteTarget });
    setRawEdges((prev) => prev.filter((edge) => edge.id !== wireDeleteTarget.id));
    setStatus("Wire deleted.");
    setWireDeleteTarget(null);
  }, [setRawEdges, wireDeleteTarget]);
  const updateSelectedNode = reactExports.useCallback(
    (partial) => {
      if (!selectedNodeId) return;
      setNodes(
        (prev) => prev.map(
          (node) => node.id === selectedNodeId ? {
            ...node,
            data: {
              ...node.data,
              ...partial
            }
          } : node
        )
      );
    },
    [selectedNodeId, setNodes]
  );
  const deleteSelectedNode = reactExports.useCallback(() => {
    if (!selectedNodeId) return;
    const nodeToDelete = nodes.find((node) => node.id === selectedNodeId);
    if (!nodeToDelete) return;
    const edgesToDelete = rawEdges.filter(
      (edge) => edge.source === selectedNodeId || edge.target === selectedNodeId
    );
    setLastUndoAction({ type: "widget", node: nodeToDelete, edges: edgesToDelete });
    setNodes((prev) => prev.filter((node) => node.id !== selectedNodeId));
    setRawEdges(
      (prev) => prev.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId)
    );
    setSelectedNodeId(null);
    setStatus("Widget deleted.");
  }, [nodes, rawEdges, selectedNodeId, setNodes, setRawEdges]);
  const duplicateNodeById = reactExports.useCallback(
    (nodeId) => {
      const source = nodes.find((node) => node.id === nodeId);
      if (!source) return;
      const duplicated = {
        ...source,
        id: makeId(source.data.widgetType),
        position: {
          x: source.position.x + 40,
          y: source.position.y + 40
        },
        data: {
          ...source.data,
          label: `${source.data.label} Copy`,
          logicalDeviceId: void 0,
          bindings: {}
        }
      };
      setNodes((prev) => [...prev, duplicated]);
      setSelectedNodeId(duplicated.id);
      setStatus("Widget duplicated (unbound).");
    },
    [nodes, setNodes]
  );
  reactExports.useEffect(() => {
    const onKeyDown = (event) => {
      var _a2;
      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }
      if (!selectedNodeId) {
        return;
      }
      const target = event.target;
      const tag = (_a2 = target == null ? void 0 : target.tagName) == null ? void 0 : _a2.toLowerCase();
      if (tag === "input" || tag === "textarea") {
        return;
      }
      event.preventDefault();
      deleteSelectedNode();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteSelectedNode, selectedNodeId]);
  reactExports.useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);
  const switchPage = (pageId) => {
    const committed = commitProject(project);
    if (!committed) return;
    setProject(committed);
    setActivePageId(pageId);
    const next = committed.pages.find((page) => page.id === pageId);
    if (next) {
      setNodes(next.nodes);
      setRawEdges(next.edges);
      setSelectedNodeId(null);
    }
  };
  const handleAddPage = () => {
    if (!project) return;
    const committed = commitProject(project) ?? project;
    const page = createPage(`Page ${committed.pages.length + 1}`);
    const nextProject = {
      ...committed,
      pages: [...committed.pages, page],
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    setProject(nextProject);
    setActivePageId(page.id);
    setNodes([]);
    setRawEdges([]);
  };
  const requestDeletePage = () => {
    if (!project || !currentPage || project.pages.length <= 1) return;
    setPageDeleteTarget(currentPage);
  };
  const confirmDeletePage = () => {
    if (!project || !currentPage || project.pages.length <= 1 || !pageDeleteTarget) return;
    const committed = commitProject(project) ?? project;
    const removedIndex = committed.pages.findIndex((page) => page.id === pageDeleteTarget.id);
    if (removedIndex >= 0) {
      setLastUndoAction({
        type: "page",
        page: committed.pages[removedIndex],
        index: removedIndex
      });
    }
    const remaining = committed.pages.filter((page) => page.id !== pageDeleteTarget.id);
    if (remaining.length === 0) {
      setPageDeleteTarget(null);
      return;
    }
    const nextProject = {
      ...committed,
      pages: remaining,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    setProject(nextProject);
    setActivePageId(remaining[0].id);
    setNodes(remaining[0].nodes);
    setRawEdges(remaining[0].edges);
    setSelectedNodeId(null);
    setPageDeleteTarget(null);
  };
  const handleUndoLastDelete = reactExports.useCallback(() => {
    if (!lastUndoAction) return;
    if (lastUndoAction.type === "wire") {
      setRawEdges(
        (prev) => prev.some((edge) => edge.id === lastUndoAction.edge.id) ? prev : [...prev, lastUndoAction.edge]
      );
      setStatus("Restored deleted wire.");
      setLastUndoAction(null);
      return;
    }
    if (lastUndoAction.type === "widget") {
      setNodes(
        (prev) => prev.some((node) => node.id === lastUndoAction.node.id) ? prev : [...prev, lastUndoAction.node]
      );
      setRawEdges((prev) => {
        const existingIds = new Set(prev.map((edge) => edge.id));
        const restored = lastUndoAction.edges.filter((edge) => !existingIds.has(edge.id));
        return restored.length > 0 ? [...prev, ...restored] : prev;
      });
      setSelectedNodeId(lastUndoAction.node.id);
      setStatus("Restored deleted widget.");
      setLastUndoAction(null);
      return;
    }
    if (!project) return;
    const committed = commitProject(project) ?? project;
    if (committed.pages.some((page) => page.id === lastUndoAction.page.id)) {
      setLastUndoAction(null);
      return;
    }
    const insertIndex = Math.max(0, Math.min(lastUndoAction.index, committed.pages.length));
    const restoredPages = [...committed.pages];
    restoredPages.splice(insertIndex, 0, lastUndoAction.page);
    const nextProject = {
      ...committed,
      pages: restoredPages,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    setProject(nextProject);
    setActivePageId(lastUndoAction.page.id);
    setNodes(lastUndoAction.page.nodes);
    setRawEdges(lastUndoAction.page.edges);
    setSelectedNodeId(null);
    setStatus(`Restored deleted page "${lastUndoAction.page.name}".`);
    setLastUndoAction(null);
  }, [commitProject, lastUndoAction, project, setNodes, setRawEdges]);
  const setPageMode = (mode) => {
    if (!project || !currentPage) return;
    const committed = commitProject(project) ?? project;
    const nextProject = {
      ...committed,
      pages: committed.pages.map(
        (page) => page.id === currentPage.id ? { ...page, mode, updatedAt: (/* @__PURE__ */ new Date()).toISOString() } : page
      ),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    setProject(nextProject);
  };
  const handleCreateDevice = () => {
    if (!newDeviceName.trim()) return;
    const name = newDeviceName.trim();
    setDevices((prev) => [
      ...prev,
      createRegisteredDevice(name, newDeviceType)
    ]);
    setNewDeviceName("");
    setStatus(`Registered device: ${name}`);
  };
  const handleNodeRedExport = () => {
    if (!currentPage) return;
    const page = {
      ...currentPage,
      nodes: nodes.map((node) => stripRuntimeData(node)),
      edges: rawEdges
    };
    const json = JSON.stringify(toNodeRedJson(page), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${page.name.replace(/\s+/g, "-").toLowerCase()}-nodered.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const handleNodeRedImport = async (event) => {
    var _a2;
    const file = (_a2 = event.target.files) == null ? void 0 : _a2[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const imported = fromNodeRedJson(parsed);
      setNodes(imported.nodes.map((node) => upsertDeviceForNode(node)));
      setRawEdges(imported.edges);
      setStatus(`Imported Node-RED flow: ${file.name}`);
    } catch (error) {
      console.error("Failed to import Node-RED JSON:", error);
      setStatus("Node-RED import failed.");
    } finally {
      event.target.value = "";
    }
  };
  const normalizedLibraryFilter = libraryFilter.trim().toLowerCase();
  const filteredWidgetOptions = widgetOptions.filter(
    (widget) => `${widget} ${widgetOptionLabel[widget]}`.toLowerCase().includes(normalizedLibraryFilter)
  );
  const filteredDevices = devices.filter((device) => {
    if (!normalizedLibraryFilter) return true;
    const haystack = `${device.name} ${device.id} ${device.type} ${device.driver}`.toLowerCase();
    return haystack.includes(normalizedLibraryFilter);
  });
  const automationDeviceOptions = reactExports.useMemo(() => {
    const options = [];
    const seen = /* @__PURE__ */ new Set();
    for (const node of nodes) {
      const value = node.data.logicalDeviceId ? node.data.logicalDeviceId : `node:${node.id}`;
      if (seen.has(value)) continue;
      seen.add(value);
      options.push({
        value,
        label: `${node.data.label} (${node.data.widgetType})`,
        type: node.data.widgetType
      });
    }
    for (const device of devices) {
      if (seen.has(device.id)) continue;
      seen.add(device.id);
      options.push({
        value: device.id,
        label: `${device.name} (${device.type})`,
        type: device.type
      });
    }
    return options;
  }, [devices, nodes]);
  const simulationSensors = reactExports.useMemo(
    () => nodes.filter((node) => node.data.widgetType === "sensor").map((node) => ({
      id: node.id,
      label: node.data.label,
      value: Number(node.data.config.value ?? node.data.config.dummyValue ?? 0),
      min: Number(node.data.config.min ?? 0),
      max: Number(node.data.config.max ?? 100),
      step: Number(node.data.config.step ?? 1),
      unit: String(node.data.config.unit ?? ""),
      dummyMode: Boolean(node.data.config.dummyMode)
    })),
    [nodes]
  );
  const setSimulationSensorValue = reactExports.useCallback(
    (nodeId, value) => {
      setNodes(
        (prev) => prev.map(
          (node) => node.id === nodeId ? {
            ...node,
            data: {
              ...node.data,
              config: {
                ...node.data.config,
                value,
                dummyValue: value,
                dummyMode: true,
                sensorSampleAtMs: Date.now()
              }
            }
          } : node
        )
      );
      setStatus(`Simulation value updated for sensor ${nodeId}.`);
    },
    [setNodes]
  );
  const buildWarnings = reactExports.useMemo(() => {
    var _a2, _b2, _c2, _d2, _e2, _f2, _g2, _h2, _i2, _j2;
    const warnings = [];
    const edgeByNode = /* @__PURE__ */ new Map();
    for (const edge of rawEdges) {
      const src = edgeByNode.get(edge.source) ?? [];
      src.push(edge);
      edgeByNode.set(edge.source, src);
      const dst = edgeByNode.get(edge.target) ?? [];
      dst.push(edge);
      edgeByNode.set(edge.target, dst);
    }
    for (const node of nodes) {
      const edgesForNode = edgeByNode.get(node.id) ?? [];
      const fluidEdges = edgesForNode.filter((e) => {
        var _a3;
        return (((_a3 = e.data) == null ? void 0 : _a3.kind) ?? "fluid") === "fluid";
      });
      const outboundDataEdges = edgesForNode.filter(
        (e) => {
          var _a3;
          return e.source === node.id && (((_a3 = e.data) == null ? void 0 : _a3.kind) ?? "fluid") === "data";
        }
      );
      const powerInEdges = edgesForNode.filter(
        (e) => e.target === node.id && e.targetHandle === "power-in"
      );
      const hasLogical = Boolean(node.data.logicalDeviceId);
      const driverType = String(((_a2 = node.data.control) == null ? void 0 : _a2.driverType) ?? "dummy").trim().toLowerCase();
      const requiresHardwareBinding = driverType !== "dummy";
      if (isExternalFlowWidget(node.data.widgetType) && node.data.widgetType !== "sensor" && fluidEdges.length === 0) {
        warnings.push(`${node.data.label}: no fluid connection.`);
      }
      if ((node.data.widgetType === "pump" || node.data.widgetType === "valve" || node.data.widgetType === "sensor" || node.data.widgetType === "heater" || node.data.widgetType === "pid") && !hasLogical) {
        warnings.push(`${node.data.label}: no logical device assigned.`);
      }
      if (node.data.widgetType === "sensor" && node.data.config.dummyMode !== true && !((_b2 = node.data.bindings) == null ? void 0 : _b2.sensor)) {
        warnings.push(`${node.data.label}: missing sensor endpoint binding.`);
      }
      if (node.data.widgetType === "sensor" && !node.data.config.sensorType) {
        warnings.push(`${node.data.label}: missing sensor type.`);
      }
      if ((node.data.widgetType === "pump" || node.data.widgetType === "valve" || node.data.widgetType === "heater") && requiresHardwareBinding && !((_c2 = node.data.bindings) == null ? void 0 : _c2.actuator)) {
        warnings.push(`${node.data.label}: missing actuator endpoint binding.`);
      }
      if ((node.data.widgetType === "pump" || node.data.widgetType === "heater" || node.data.widgetType === "pid") && requiresHardwareBinding && powerInEdges.length === 0) {
        warnings.push(`${node.data.label}: no power input line.`);
      }
      if ((node.data.widgetType === "button" || node.data.widgetType === "switch" || node.data.widgetType === "slider") && !((_d2 = node.data.control) == null ? void 0 : _d2.channel) && !((_e2 = node.data.control) == null ? void 0 : _e2.endpointId) && !((_f2 = node.data.control) == null ? void 0 : _f2.targetDeviceId) && outboundDataEdges.length === 0) {
        warnings.push(`${node.data.label}: no control channel or endpoint mapping.`);
      }
      if (node.data.widgetType === "automation" && (!node.data.config.automationSteps || node.data.config.automationSteps.length === 0)) {
        if ((node.data.config.automationMode ?? "simple") === "advanced") {
          warnings.push(`${node.data.label}: no automation steps configured.`);
        }
      }
      if (node.data.widgetType === "automation" && (node.data.config.automationMode ?? "simple") === "simple") {
        const rule = node.data.config.simpleAutomation;
        if (!(rule == null ? void 0 : rule.sourceSensorDeviceId) || !(rule == null ? void 0 : rule.targetDeviceId)) {
          warnings.push(`${node.data.label}: simple automation missing source sensor or target device.`);
        }
      }
      if (node.data.widgetType === "glycol_controller") {
        const glycol = node.data.config.glycolController;
        if (!(glycol == null ? void 0 : glycol.sourceSensorDeviceId)) {
          warnings.push(`${node.data.label}: glycol controller missing source sensor.`);
        }
        if (!(glycol == null ? void 0 : glycol.pumpDeviceId) && !(glycol == null ? void 0 : glycol.valveDeviceId) && !(glycol == null ? void 0 : glycol.chillerDeviceId)) {
          warnings.push(`${node.data.label}: glycol controller missing output.`);
        }
      }
      if (node.data.widgetType === "hlt_controller") {
        const hlt = node.data.config.hltController;
        if ((hlt == null ? void 0 : hlt.enabled) !== true) {
          continue;
        }
        if (!hlt.sourceSensorDeviceId) {
          warnings.push(`${node.data.label}: hlt controller missing source sensor.`);
        }
        if (!hlt.heaterDeviceId && !hlt.recircPumpDeviceId) {
          warnings.push(`${node.data.label}: hlt controller missing output.`);
        }
      }
      if (node.data.widgetType === "co2_controller") {
        const co2 = node.data.config.co2Controller;
        if ((co2 == null ? void 0 : co2.enabled) !== true) {
          continue;
        }
        if (!co2.sourceSensorDeviceId) {
          warnings.push(`${node.data.label}: co2 controller missing source sensor.`);
        }
        if (!co2.inletValveDeviceId && !co2.ventValveDeviceId) {
          warnings.push(`${node.data.label}: co2 controller missing output.`);
        }
      }
      if (node.data.widgetType === "transfer_controller") {
        const transfer = node.data.config.transferController;
        if ((transfer == null ? void 0 : transfer.enabled) !== true) {
          continue;
        }
        if (!transfer.pumpDeviceId) {
          warnings.push(`${node.data.label}: transfer controller missing pump.`);
        }
        const sourceCount = ((_g2 = transfer.sourceValveDeviceIds) == null ? void 0 : _g2.filter(Boolean).length) ?? 0;
        const destinationCount = ((_h2 = transfer.destinationValveDeviceIds) == null ? void 0 : _h2.filter(Boolean).length) ?? 0;
        if (sourceCount + destinationCount === 0) {
          warnings.push(`${node.data.label}: transfer controller missing valves.`);
        }
      }
      if (node.data.widgetType === "recipe_executor") {
        const recipe = node.data.config.recipeExecutor;
        if ((recipe == null ? void 0 : recipe.enabled) !== true) {
          continue;
        }
        const stepCount = ((_i2 = node.data.config.recipeSteps) == null ? void 0 : _i2.length) ?? 0;
        if (stepCount === 0) {
          warnings.push(`${node.data.label}: recipe executor missing recipe steps.`);
        }
        if (stepCount > 0) {
          const hasFallbackTarget = Boolean((_j2 = node.data.control) == null ? void 0 : _j2.targetDeviceId);
          const hasStepTarget = (node.data.config.recipeSteps ?? []).some((step) => {
            const stepMeta = step;
            return Boolean(stepMeta.targetDeviceId);
          });
          if (!hasFallbackTarget && !hasStepTarget) {
            warnings.push(`${node.data.label}: recipe executor missing target mapping.`);
          }
        }
      }
    }
    return warnings;
  }, [nodes, rawEdges]);
  const pageViewport = (currentPage == null ? void 0 : currentPage.viewport) ?? { x: 0, y: 0, zoom: 1 };
  const handleConfigureNode = reactExports.useCallback((nodeId) => {
    setSelectedNodeId(nodeId);
  }, []);
  const runtimeContextValue = reactExports.useMemo(
    () => ({
      mode: currentMode,
      onConfigure: handleConfigureNode,
      onControl: runtimeControl
    }),
    [currentMode, handleConfigureNode, runtimeControl]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-[calc(100vh-4rem)] flex-col gap-4 p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex flex-wrap items-center gap-2 p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: activePageId, onValueChange: switchPage, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-[220px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select page" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: ((project == null ? void 0 : project.pages) ?? []).map((page) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: page.id, children: [
          page.name,
          " (",
          page.mode,
          ")"
        ] }, page.id)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: handleAddPage, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-2 h-4 w-4" }),
        "Add Page"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: requestDeletePage, children: "Delete Page" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: currentMode, onValueChange: (value) => setPageMode(value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-[160px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Mode" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "draft", children: "Draft" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "published", children: "Published" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => {
        var _a2;
        return (_a2 = nodeRedInputRef.current) == null ? void 0 : _a2.click();
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "mr-2 h-4 w-4" }),
        "Import Node-RED"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: handleNodeRedExport, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "mr-2 h-4 w-4" }),
        "Export Node-RED"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleSave, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-2 h-4 w-4" }),
        "Save"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => navigate("/os/recipe-execution"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FlaskConical, { className: "mr-2 h-4 w-4" }),
        "Open Recipe Execution"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-auto text-xs text-muted-foreground", children: status }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "outline",
          size: "sm",
          className: "h-7 px-2",
          onClick: handleUndoLastDelete,
          disabled: !lastUndoAction,
          title: "Restore last delete action",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "mr-1 h-3.5 w-3.5" }),
            "Undo Delete"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          className: "h-7 px-2 text-amber-700",
          onClick: () => setWarningsOpen(true),
          title: "Open build warnings",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "mr-1 h-3.5 w-3.5" }),
            "Warnings: ",
            buildWarnings.length
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
        "Nodes: ",
        nodes.length
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-h-0 flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "h-full p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CanvasRuntimeProvider, { value: runtimeContextValue, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        index,
        {
          nodes,
          edges: displayedEdges,
          onNodesChange,
          onEdgesChange,
          onConnect: handleConnect,
          nodeTypes,
          onEdgeClick: (event, edge) => {
            event.preventDefault();
            if (currentMode !== "draft") {
              setStatus("Switch to Draft mode to delete wires.");
              return;
            }
            setWireDeleteTarget(edge);
          },
          onNodeClick: (_, node) => {
            setSelectedNodeId(node.id);
            if (currentMode === "draft") {
              setWidgetConfigOpen(true);
            }
          },
          onNodeDoubleClick: (_, node) => {
            setSelectedNodeId(node.id);
            setLibraryOpen(true);
          },
          onNodeContextMenu: (event, node) => {
            event.preventDefault();
            setSelectedNodeId(node.id);
            setContextMenu({
              x: event.clientX,
              y: event.clientY,
              nodeId: node.id
            });
          },
          onPaneClick: () => {
            setSelectedNodeId(null);
            setWidgetConfigOpen(false);
            setContextMenu(null);
          },
          fitView: true,
          defaultViewport: pageViewport,
          nodesDraggable: currentMode === "draft",
          nodesConnectable: currentMode === "draft",
          panOnDrag: true,
          noPanClassName: "bf-no-pan",
          elementsSelectable: true,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Background, { gap: 16 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(MiniMap, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Controls, {})
          ]
        }
      ) }) }) }),
      contextMenu && currentMode === "draft" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "fixed z-50 min-w-[160px] rounded-md border border-border bg-popover p-1 shadow-lg",
          style: { left: contextMenu.x, top: contextMenu.y },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                className: "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent",
                onClick: () => {
                  setSelectedNodeId(contextMenu.nodeId);
                  setWidgetConfigOpen(true);
                  setContextMenu(null);
                },
                children: "Configure"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                className: "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent",
                onClick: () => {
                  duplicateNodeById(contextMenu.nodeId);
                  setContextMenu(null);
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3.5 w-3.5" }),
                  "Duplicate"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                className: "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50",
                onClick: () => {
                  setSelectedNodeId(contextMenu.nodeId);
                  deleteSelectedNode();
                  setContextMenu(null);
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }),
                  "Delete"
                ]
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Sheet, { open: libraryOpen, onOpenChange: setLibraryOpen, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            size: "sm",
            className: "absolute right-0 top-1/2 z-20 h-14 -translate-y-1/2 rounded-l-md rounded-r-none px-2",
            title: "Open Canvas Panel",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(PanelLeft, { className: "h-4 w-4 rotate-180" })
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetContent, { side: "right", className: "w-[340px] p-0 sm:w-[420px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetHeader, { className: "border-b border-border p-4 text-left", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTitle, { children: "Canvas Panel" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SheetDescription, { children: "Widgets, devices, selected widget config, and recipe import in one slideout." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-border p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: libraryFilter,
                onChange: (event) => setLibraryFilter(event.target.value),
                placeholder: "Search widgets or devices"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-xs text-muted-foreground", children: [
              "Current page mode: ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: currentMode })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap gap-1 text-[10px]", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-sky-100 px-1 text-sky-800", children: "Fluid" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-amber-100 px-1 text-amber-800", children: "Data" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-red-100 px-1 text-red-800", children: "Power" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-slate-200 px-1 text-slate-800", children: "Ground" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Connect OUT -> IN only" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] uppercase text-muted-foreground", children: "Fluid Medium" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: activeFluidMedium, onValueChange: (value) => setActiveFluidMedium(value), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "product", children: "Product" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "glycol", children: "Glycol" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "co2", children: "CO2" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "cip", children: "CIP" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "water", children: "Water" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "gas", children: "Gas" })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "h-[calc(100vh-13rem)] p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 pr-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Add Widget" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-2", children: [
                filteredWidgetOptions.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    variant: "outline",
                    className: "justify-between border-l-4",
                    style: { borderLeftColor: widgetAccentColor[option] },
                    onClick: () => handleAddNode(option),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "span",
                          {
                            className: "h-2 w-2 rounded-full",
                            style: { backgroundColor: widgetAccentColor[option] }
                          }
                        ),
                        widgetOptionLabel[option]
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "Add" })
                    ]
                  },
                  `widget-option-${option}`
                )),
                filteredWidgetOptions.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "No widgets match this filter." })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Device Widgets" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                filteredDevices.map((device) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    className: "w-full rounded-md border border-border bg-card px-3 py-2 text-left hover:bg-accent/30 disabled:cursor-not-allowed disabled:opacity-60",
                    style: { borderLeftWidth: 4, borderLeftColor: widgetAccentColor[device.type] },
                    onClick: () => handleAddNode(device.type, device.id),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: device.name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                        device.type,
                        " · ",
                        device.driver,
                        " · ",
                        device.id
                      ] })
                    ]
                  },
                  device.id
                )),
                filteredDevices.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "No devices match this filter." })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Simulation Panel" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 rounded-md border border-border p-3", children: simulationSensors.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Add sensor widgets to simulate values." }) : simulationSensors.map((sensor) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium", children: sensor.label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] text-muted-foreground", children: [
                    sensor.value,
                    sensor.unit ? ` ${sensor.unit}` : "",
                    sensor.dummyMode ? " (dummy)" : ""
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    className: "w-full",
                    type: "range",
                    min: sensor.min,
                    max: sensor.max,
                    step: sensor.step,
                    value: sensor.value,
                    onChange: (event) => setSimulationSensorValue(sensor.id, Number(event.target.value))
                  }
                )
              ] }, `sim-${sensor.id}`)) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Register Device" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded-md border border-border p-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    value: newDeviceName,
                    onChange: (event) => setNewDeviceName(event.target.value),
                    placeholder: "Brew Pump A"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: newDeviceType,
                    onValueChange: (value) => setNewDeviceType(value),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Device type" }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: deviceTypeOptions.map((type) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: type, children: type }, `library-device-type-${type}`)) })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "w-full", variant: "outline", onClick: handleCreateDevice, children: "Add Device" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "CO2 Alarm Events" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 rounded-md border border-border p-3", children: co2AlarmEvents.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "No CO2 alarm events yet." }) : co2AlarmEvents.slice(0, 8).map((event) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: `rounded border p-2 text-xs ${event.severity === "critical" ? "border-red-300 bg-red-50 text-red-900" : event.severity === "warning" ? "border-amber-300 bg-amber-50 text-amber-900" : "border-slate-200 bg-slate-50 text-slate-900"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: event.controllerLabel }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: event.message }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] opacity-80", children: new Date(event.at).toLocaleString() })
                  ]
                },
                event.id
              )) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Widget Config" }),
              selectedNode ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 rounded-md border border-border p-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Double-click a widget to open this config." }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      variant: "destructive",
                      size: "sm",
                      onClick: deleteSelectedNode,
                      disabled: currentMode !== "draft",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "mr-1 h-3.5 w-3.5" }),
                        "Delete"
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "widget-label", children: "Label" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "widget-label",
                      value: selectedNode.data.label,
                      disabled: currentMode !== "draft",
                      onChange: (event) => updateSelectedNode({
                        label: event.target.value
                      })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Logical Device" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Select,
                    {
                      value: selectedNode.data.logicalDeviceId ?? "__none",
                      onValueChange: (value) => updateSelectedNode({
                        logicalDeviceId: value === "__none" ? void 0 : value
                      }),
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select device" }) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "Unbound" }),
                          devices.map((device) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: device.id, children: [
                            device.name,
                            " (",
                            device.type,
                            ")"
                          ] }, device.id))
                        ] })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "binding-sensor", children: "Sensor Binding" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "binding-sensor",
                      value: ((_a = selectedNode.data.bindings) == null ? void 0 : _a.sensor) ?? "",
                      disabled: currentMode !== "draft",
                      onChange: (event) => updateSelectedNode({
                        bindings: {
                          ...selectedNode.data.bindings ?? {},
                          sensor: event.target.value || void 0
                        }
                      }),
                      placeholder: "Endpoint ID"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "binding-actuator", children: "Actuator Binding" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "binding-actuator",
                      value: ((_b = selectedNode.data.bindings) == null ? void 0 : _b.actuator) ?? "",
                      disabled: currentMode !== "draft",
                      onChange: (event) => updateSelectedNode({
                        bindings: {
                          ...selectedNode.data.bindings ?? {},
                          actuator: event.target.value || void 0
                        }
                      }),
                      placeholder: "Endpoint ID"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "binding-feedback", children: "Feedback Binding" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "binding-feedback",
                      value: ((_c = selectedNode.data.bindings) == null ? void 0 : _c.feedback) ?? "",
                      disabled: currentMode !== "draft",
                      onChange: (event) => updateSelectedNode({
                        bindings: {
                          ...selectedNode.data.bindings ?? {},
                          feedback: event.target.value || void 0
                        }
                      }),
                      placeholder: "Endpoint ID"
                    }
                  )
                ] }),
                selectedNode.data.widgetType === "vessel" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "cfg-capacity", children: "Capacity (L)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        id: "cfg-capacity",
                        type: "number",
                        value: String(selectedNode.data.config.capacity ?? ""),
                        disabled: currentMode !== "draft",
                        onChange: (event) => updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            capacity: parseMaybeNumber(event.target.value)
                          }
                        })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "cfg-level", children: "Current Level (L)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        id: "cfg-level",
                        type: "number",
                        value: String(selectedNode.data.config.currentLevel ?? ""),
                        disabled: currentMode !== "draft",
                        onChange: (event) => updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            currentLevel: parseMaybeNumber(event.target.value)
                          }
                        })
                      }
                    )
                  ] })
                ] }),
                selectedNode.data.widgetType === "sensor" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "cfg-sensor-value", children: "Display Value" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "cfg-sensor-value",
                      value: String(selectedNode.data.config.value ?? ""),
                      disabled: currentMode !== "draft",
                      onChange: (event) => updateSelectedNode({
                        config: {
                          ...selectedNode.data.config,
                          value: parseMaybeNumber(event.target.value) ?? event.target.value,
                          sensorSampleAtMs: Date.now()
                        }
                      })
                    }
                  )
                ] }),
                selectedNode.data.widgetType === "heater" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "cfg-setpoint", children: "Setpoint (C)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "cfg-setpoint",
                      type: "number",
                      value: String(selectedNode.data.config.setpoint ?? ""),
                      disabled: currentMode !== "draft",
                      onChange: (event) => updateSelectedNode({
                        config: {
                          ...selectedNode.data.config,
                          setpoint: parseMaybeNumber(event.target.value)
                        }
                      })
                    }
                  )
                ] }),
                selectedNode.data.widgetType === "pid" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "cfg-pid-setpoint", children: "Target Setpoint" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        id: "cfg-pid-setpoint",
                        type: "number",
                        value: String(selectedNode.data.config.setpoint ?? ""),
                        disabled: currentMode !== "draft",
                        onChange: (event) => updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            setpoint: parseMaybeNumber(event.target.value)
                          }
                        })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground", children: "In automation mode, recipes can require confirmation per step." })
                ] })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Select a widget on canvas to configure it." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-2 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Recipe Execution" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  variant: "outline",
                  className: "w-full justify-start",
                  onClick: () => navigate("/os/recipe-execution"),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(FlaskConical, { className: "mr-2 h-4 w-4" }),
                    "Open Recipe Execution"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Recipe import and run controls are handled on the dedicated execution page." }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border border-border p-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-medium text-foreground", children: [
                  "Imported recipes available: ",
                  importedRecipes.length
                ] }),
                selectedImportedRecipe ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                  "Latest: ",
                  selectedImportedRecipe.name
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "No imported recipes available yet." })
              ] })
            ] })
          ] }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: widgetConfigOpen, onOpenChange: setWidgetConfigOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-h-[85vh] overflow-auto sm:max-w-[560px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Widget Config" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Edit-mode popup for selected widget." })
      ] }),
      selectedNode ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: selectedNode.data.widgetType }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              variant: "destructive",
              size: "sm",
              onClick: () => {
                deleteSelectedNode();
                setWidgetConfigOpen(false);
              },
              disabled: currentMode !== "draft",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "mr-1 h-3.5 w-3.5" }),
                "Delete"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "popup-widget-label", children: "Label" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "popup-widget-label",
              value: selectedNode.data.label,
              disabled: currentMode !== "draft",
              onChange: (event) => updateSelectedNode({
                label: event.target.value
              })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Logical Device" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Select,
            {
              value: selectedNode.data.logicalDeviceId ?? "__none",
              onValueChange: (value) => updateSelectedNode({
                logicalDeviceId: value === "__none" ? void 0 : value
              }),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select device" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "Unbound" }),
                  devices.map((device) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: device.id, children: [
                    device.name,
                    " (",
                    device.type,
                    ")"
                  ] }, device.id))
                ] })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-border p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 text-xs font-medium text-muted-foreground", children: "Control Mapping" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Target Device" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_d = selectedNode.data.control) == null ? void 0 : _d.targetDeviceId) ?? "__none",
                  onValueChange: (value) => updateSelectedNode({
                    control: {
                      ...selectedNode.data.control ?? {},
                      targetDeviceId: value === "__none" ? void 0 : value
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select target device" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                      devices.map((device) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: device.id, children: [
                        device.name,
                        " (",
                        device.type,
                        ")"
                      ] }, `ctrl-dev-${device.id}`))
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Command" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_e = selectedNode.data.control) == null ? void 0 : _e.command) ?? "trigger",
                  onValueChange: (value) => updateSelectedNode({
                    control: {
                      ...selectedNode.data.control ?? {},
                      command: value
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "trigger", children: "Trigger" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "on_off", children: "On/Off" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "open_close", children: "Open/Close" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "route", children: "Route A/B" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "set_value", children: "Set Value" })
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Driver" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_f = selectedNode.data.control) == null ? void 0 : _f.driverType) ?? "dummy",
                  onValueChange: (value) => updateSelectedNode({
                    control: {
                      ...selectedNode.data.control ?? {},
                      driverType: value
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "dummy", children: "dummy" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "usb_relay", children: "usb_relay" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "gpio", children: "gpio" })
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "I/O Channel Browser" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: String(((_g = selectedNode.data.control) == null ? void 0 : _g.endpointId) ?? "__none"),
                  onValueChange: (value) => {
                    var _a2;
                    const selectedEndpoint = value === "__none" ? null : writableControlEndpoints.find((endpoint) => String(endpoint.id) === value) ?? null;
                    updateSelectedNode({
                      control: {
                        ...selectedNode.data.control ?? {},
                        endpointId: selectedEndpoint == null ? void 0 : selectedEndpoint.id,
                        channel: (selectedEndpoint == null ? void 0 : selectedEndpoint.channelId) ?? ((_a2 = selectedNode.data.control) == null ? void 0 : _a2.channel)
                      }
                    });
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select discovered endpoint" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "Manual channel only" }),
                      writableControlEndpoints.map((endpoint) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: String(endpoint.id), children: [
                        "#",
                        endpoint.id,
                        " · ",
                        endpoint.channelId,
                        " · ",
                        endpoint.endpointKind,
                        " · ",
                        endpoint.direction
                      ] }, `ctrl-ep-${endpoint.id}`))
                    ] })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground", children: "Pick a discovered endpoint or use manual channel/endpoint fields below." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "popup-control-channel", children: "Driver Channel" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "popup-control-channel",
                  value: ((_h = selectedNode.data.control) == null ? void 0 : _h.channel) ?? "",
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    control: {
                      ...selectedNode.data.control ?? {},
                      channel: event.target.value || void 0
                    }
                  }),
                  placeholder: "usb:3 or gpio:17"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "popup-control-endpoint", children: "Endpoint Override (optional)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "popup-control-endpoint",
                  type: "number",
                  value: String(((_i = selectedNode.data.control) == null ? void 0 : _i.endpointId) ?? ""),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    control: {
                      ...selectedNode.data.control ?? {},
                      endpointId: parseMaybeNumber(event.target.value)
                    }
                  }),
                  placeholder: "Endpoint ID"
                }
              )
            ] })
          ] })
        ] }),
        (selectedNode.data.widgetType === "sensor" || selectedNode.data.widgetType === "display" || selectedNode.data.widgetType === "vessel") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "popup-binding-sensor", children: "Sensor Binding" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "popup-binding-sensor",
              value: ((_j = selectedNode.data.bindings) == null ? void 0 : _j.sensor) ?? "",
              disabled: currentMode !== "draft",
              onChange: (event) => updateSelectedNode({
                bindings: {
                  ...selectedNode.data.bindings ?? {},
                  sensor: event.target.value || void 0
                }
              }),
              placeholder: "Endpoint ID"
            }
          )
        ] }),
        (selectedNode.data.widgetType === "pump" || selectedNode.data.widgetType === "valve" || selectedNode.data.widgetType === "heater" || selectedNode.data.widgetType === "button" || selectedNode.data.widgetType === "pid") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "popup-binding-actuator", children: "Actuator Binding" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "popup-binding-actuator",
              value: ((_k = selectedNode.data.bindings) == null ? void 0 : _k.actuator) ?? "",
              disabled: currentMode !== "draft",
              onChange: (event) => updateSelectedNode({
                bindings: {
                  ...selectedNode.data.bindings ?? {},
                  actuator: event.target.value || void 0
                }
              }),
              placeholder: "Endpoint ID"
            }
          )
        ] }),
        (selectedNode.data.widgetType === "pump" || selectedNode.data.widgetType === "valve" || selectedNode.data.widgetType === "heater" || selectedNode.data.widgetType === "pid") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "popup-binding-feedback", children: "Feedback Binding" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "popup-binding-feedback",
              value: ((_l = selectedNode.data.bindings) == null ? void 0 : _l.feedback) ?? "",
              disabled: currentMode !== "draft",
              onChange: (event) => updateSelectedNode({
                bindings: {
                  ...selectedNode.data.bindings ?? {},
                  feedback: event.target.value || void 0
                }
              }),
              placeholder: "Endpoint ID"
            }
          )
        ] }),
        selectedNode.data.widgetType === "vessel" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Vessel Type" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: String(selectedNode.data.config.vesselType ?? "fermentor_conical"),
                onValueChange: (value) => updateSelectedNode({
                  config: {
                    ...selectedNode.data.config,
                    vesselType: value
                  }
                }),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "fermentor_conical", children: "Fermentor (Conical)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "bright_tank", children: "Bright Tank" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "mash_tun", children: "Mash Tun" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "hlt", children: "Hot Liquor Tank" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "brew_kettle", children: "Brew Kettle" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "generic", children: "Generic Vessel" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "popup-cfg-capacity", children: "Capacity (L)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "popup-cfg-capacity",
                type: "number",
                value: String(selectedNode.data.config.capacity ?? ""),
                disabled: currentMode !== "draft",
                onChange: (event) => updateSelectedNode({
                  config: {
                    ...selectedNode.data.config,
                    capacity: parseMaybeNumber(event.target.value)
                  }
                })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "popup-cfg-level", children: "Current Level (L)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "popup-cfg-level",
                type: "number",
                value: String(selectedNode.data.config.currentLevel ?? ""),
                disabled: currentMode !== "draft",
                onChange: (event) => updateSelectedNode({
                  config: {
                    ...selectedNode.data.config,
                    currentLevel: parseMaybeNumber(event.target.value)
                  }
                })
              }
            )
          ] })
        ] }),
        selectedNode.data.widgetType === "pump" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "popup-cfg-flow-rate", children: "Nominal Flow Rate (L/min)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "popup-cfg-flow-rate",
              type: "number",
              value: String(selectedNode.data.config.flowRate ?? ""),
              disabled: currentMode !== "draft",
              onChange: (event) => updateSelectedNode({
                config: {
                  ...selectedNode.data.config,
                  flowRate: parseMaybeNumber(event.target.value)
                }
              })
            }
          )
        ] }),
        selectedNode.data.widgetType === "valve" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Valve Type" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: String(selectedNode.data.config.valveType ?? "2way"),
                onValueChange: (value) => updateSelectedNode({
                  config: {
                    ...selectedNode.data.config,
                    valveType: value,
                    position: value === "3way" ? "c_to_a" : "closed"
                  }
                }),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "2way", children: "2-way" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "3way", children: "3-way" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Default Position" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: String(
                  selectedNode.data.config.position ?? (selectedNode.data.config.valveType === "3way" ? "c_to_a" : "closed")
                ),
                onValueChange: (value) => updateSelectedNode({
                  config: {
                    ...selectedNode.data.config,
                    position: value
                  }
                }),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: selectedNode.data.config.valveType === "3way" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "c_to_a", children: "C to A" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "c_to_b", children: "C to B" })
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "closed", children: "Closed" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "open", children: "Open" })
                  ] }) })
                ]
              }
            )
          ] })
        ] }),
        selectedNode.data.widgetType === "sensor" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded-md border border-border p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Sensor Type" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: selectedNode.data.config.sensorType ?? "temperature",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      sensorType: value
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: sensorTypeOptions.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option, children: option }, `sensor-type-${option}`)) })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "popup-cfg-sensor-unit", children: "Unit" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "popup-cfg-sensor-unit",
                  value: String(selectedNode.data.config.unit ?? ""),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      unit: event.target.value
                    }
                  }),
                  placeholder: "F, C, SG, PSI, %"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "popup-cfg-sensor-min", children: "Min" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "popup-cfg-sensor-min",
                  type: "number",
                  value: String(selectedNode.data.config.min ?? ""),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      min: parseMaybeNumber(event.target.value)
                    }
                  })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "popup-cfg-sensor-max", children: "Max" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "popup-cfg-sensor-max",
                  type: "number",
                  value: String(selectedNode.data.config.max ?? ""),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      max: parseMaybeNumber(event.target.value)
                    }
                  })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "popup-cfg-sensor-step", children: "Step" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "popup-cfg-sensor-step",
                  type: "number",
                  value: String(selectedNode.data.config.step ?? ""),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      step: parseMaybeNumber(event.target.value)
                    }
                  })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "popup-cfg-sensor-value", children: "Sensor Value (live or dummy)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "popup-cfg-sensor-value",
                type: "number",
                value: String(selectedNode.data.config.value ?? selectedNode.data.config.dummyValue ?? ""),
                disabled: currentMode !== "draft",
                onChange: (event) => {
                  const next = parseMaybeNumber(event.target.value) ?? 0;
                  updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      value: next,
                      dummyValue: next,
                      sensorSampleAtMs: Date.now()
                    }
                  });
                }
              }
            )
          ] })
        ] }),
        selectedNode.data.widgetType === "slider" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded-md border border-border p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Setpoint Type" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: selectedNode.data.config.setpointType ?? "temperature",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      setpointType: value
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: sensorTypeOptions.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option, children: option }, `setpoint-type-${option}`)) })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "popup-cfg-slider-unit", children: "Unit" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "popup-cfg-slider-unit",
                  value: String(selectedNode.data.config.unit ?? ""),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      unit: event.target.value
                    }
                  }),
                  placeholder: "F, C, SG, PSI, %"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "popup-cfg-slider-min", children: "Min" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "popup-cfg-slider-min",
                  type: "number",
                  value: String(selectedNode.data.config.min ?? ""),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      min: parseMaybeNumber(event.target.value)
                    }
                  })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "popup-cfg-slider-max", children: "Max" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "popup-cfg-slider-max",
                  type: "number",
                  value: String(selectedNode.data.config.max ?? ""),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      max: parseMaybeNumber(event.target.value)
                    }
                  })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "popup-cfg-slider-step", children: "Step" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "popup-cfg-slider-step",
                  type: "number",
                  value: String(selectedNode.data.config.step ?? ""),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      step: parseMaybeNumber(event.target.value)
                    }
                  })
                }
              )
            ] })
          ] })
        ] }),
        selectedNode.data.widgetType === "glycol_controller" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded-md border border-border p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Thermostat-style glycol control. Uses sensor + setpoint to drive pump/valve/chiller outputs." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Controller" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_m = selectedNode.data.config.hltController) == null ? void 0 : _m.enabled) ? "enabled" : "disabled",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      hltController: {
                        ...selectedNode.data.config.hltController ?? {},
                        enabled: value === "enabled"
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "disabled", children: "Disabled" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "enabled", children: "Enabled" })
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Unit" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: String(selectedNode.data.config.unit ?? "F"),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      unit: event.target.value
                    }
                  })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Compare To" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_n = selectedNode.data.config.glycolController) == null ? void 0 : _n.compareTo) ?? "threshold",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      glycolController: {
                        ...selectedNode.data.config.glycolController ?? {},
                        compareTo: value
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "threshold", children: "Local Target" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "setpoint_device", children: "Setpoint Device" })
                    ] })
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Min" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  value: String(selectedNode.data.config.min ?? 32),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      min: parseMaybeNumber(event.target.value) ?? 32
                    }
                  })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Max" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  value: String(selectedNode.data.config.max ?? 80),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      max: parseMaybeNumber(event.target.value) ?? 80
                    }
                  })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Step" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  value: String(selectedNode.data.config.step ?? 0.5),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      step: parseMaybeNumber(event.target.value) ?? 0.5
                    }
                  })
                }
              )
            ] })
          ] }),
          (((_o = selectedNode.data.config.glycolController) == null ? void 0 : _o.compareTo) ?? "threshold") === "threshold" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Target Setpoint" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                value: String(
                  selectedNode.data.config.setpoint ?? ((_p = selectedNode.data.config.glycolController) == null ? void 0 : _p.threshold) ?? 65
                ),
                disabled: currentMode !== "draft",
                onChange: (event) => {
                  const next = parseMaybeNumber(event.target.value) ?? 65;
                  updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      setpoint: next,
                      glycolController: {
                        ...selectedNode.data.config.glycolController ?? {},
                        threshold: next
                      }
                    }
                  });
                }
              }
            )
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Setpoint Device (slider/sensor)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: ((_q = selectedNode.data.config.glycolController) == null ? void 0 : _q.setpointDeviceId) ?? "__none",
                onValueChange: (value) => updateSelectedNode({
                  config: {
                    ...selectedNode.data.config,
                    glycolController: {
                      ...selectedNode.data.config.glycolController ?? {},
                      setpointDeviceId: value === "__none" ? void 0 : value
                    }
                  }
                }),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select setpoint device" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                    automationDeviceOptions.filter((device) => device.type === "slider" || device.type === "sensor").map((device) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: device.value, children: device.label }, `glycol-setpoint-${device.value}`))
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Source Sensor" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_r = selectedNode.data.config.glycolController) == null ? void 0 : _r.sourceSensorDeviceId) ?? "__none",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      glycolController: {
                        ...selectedNode.data.config.glycolController ?? {},
                        sourceSensorDeviceId: value === "__none" ? void 0 : value
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select source sensor" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                      automationDeviceOptions.filter((device) => device.type === "sensor").map((device) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: device.value, children: device.label }, `glycol-source-${device.value}`))
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Hysteresis" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  value: String(((_s = selectedNode.data.config.glycolController) == null ? void 0 : _s.hysteresis) ?? 1),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      glycolController: {
                        ...selectedNode.data.config.glycolController ?? {},
                        hysteresis: parseMaybeNumber(event.target.value) ?? 1
                      }
                    }
                  })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Poll Interval (ms)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                value: String(((_t = selectedNode.data.config.glycolController) == null ? void 0 : _t.pollMs) ?? 1e3),
                disabled: currentMode !== "draft",
                onChange: (event) => updateSelectedNode({
                  config: {
                    ...selectedNode.data.config,
                    glycolController: {
                      ...selectedNode.data.config.glycolController ?? {},
                      pollMs: parseMaybeNumber(event.target.value) ?? 1e3
                    }
                  }
                })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Pump Output" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_u = selectedNode.data.config.glycolController) == null ? void 0 : _u.pumpDeviceId) ?? "__none",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      glycolController: {
                        ...selectedNode.data.config.glycolController ?? {},
                        pumpDeviceId: value === "__none" ? void 0 : value
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select pump target" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                      automationDeviceOptions.filter((device) => device.type === "pump").map((device) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: device.value, children: device.label }, `glycol-pump-${device.value}`))
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Valve Output" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_v = selectedNode.data.config.glycolController) == null ? void 0 : _v.valveDeviceId) ?? "__none",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      glycolController: {
                        ...selectedNode.data.config.glycolController ?? {},
                        valveDeviceId: value === "__none" ? void 0 : value
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select valve target" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                      automationDeviceOptions.filter((device) => device.type === "valve").map((device) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: device.value, children: device.label }, `glycol-valve-${device.value}`))
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Chiller Output" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_w = selectedNode.data.config.glycolController) == null ? void 0 : _w.chillerDeviceId) ?? "__none",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      glycolController: {
                        ...selectedNode.data.config.glycolController ?? {},
                        chillerDeviceId: value === "__none" ? void 0 : value
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select chiller target" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                      automationDeviceOptions.filter((device) => device.type === "pump" || device.type === "heater").map((device) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: device.value, children: device.label }, `glycol-chiller-${device.value}`))
                    ] })
                  ]
                }
              )
            ] })
          ] })
        ] }),
        selectedNode.data.widgetType === "hlt_controller" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded-md border border-border p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Thermostat-style HLT heat control. Uses source temperature to drive heater and recirc pump." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Unit" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: String(selectedNode.data.config.unit ?? "F"),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      unit: event.target.value
                    }
                  })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Compare To" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_x = selectedNode.data.config.hltController) == null ? void 0 : _x.compareTo) ?? "threshold",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      hltController: {
                        ...selectedNode.data.config.hltController ?? {},
                        compareTo: value
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "threshold", children: "Local Target" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "setpoint_device", children: "Setpoint Device" })
                    ] })
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Min" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  value: String(selectedNode.data.config.min ?? 50),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      min: parseMaybeNumber(event.target.value) ?? 50
                    }
                  })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Max" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  value: String(selectedNode.data.config.max ?? 180),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      max: parseMaybeNumber(event.target.value) ?? 180
                    }
                  })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Step" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  value: String(selectedNode.data.config.step ?? 0.5),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      step: parseMaybeNumber(event.target.value) ?? 0.5
                    }
                  })
                }
              )
            ] })
          ] }),
          (((_y = selectedNode.data.config.hltController) == null ? void 0 : _y.compareTo) ?? "threshold") === "threshold" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Target Setpoint" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                value: String(
                  selectedNode.data.config.setpoint ?? ((_z = selectedNode.data.config.hltController) == null ? void 0 : _z.threshold) ?? 152
                ),
                disabled: currentMode !== "draft",
                onChange: (event) => {
                  const next = parseMaybeNumber(event.target.value) ?? 152;
                  updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      setpoint: next,
                      hltController: {
                        ...selectedNode.data.config.hltController ?? {},
                        threshold: next
                      }
                    }
                  });
                }
              }
            )
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Setpoint Device (slider/sensor)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: ((_A = selectedNode.data.config.hltController) == null ? void 0 : _A.setpointDeviceId) ?? "__none",
                onValueChange: (value) => updateSelectedNode({
                  config: {
                    ...selectedNode.data.config,
                    hltController: {
                      ...selectedNode.data.config.hltController ?? {},
                      setpointDeviceId: value === "__none" ? void 0 : value
                    }
                  }
                }),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select setpoint device" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                    automationDeviceOptions.filter((device) => device.type === "slider" || device.type === "sensor").map((device) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: device.value, children: device.label }, `hlt-setpoint-${device.value}`))
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Source Sensor" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_B = selectedNode.data.config.hltController) == null ? void 0 : _B.sourceSensorDeviceId) ?? "__none",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      hltController: {
                        ...selectedNode.data.config.hltController ?? {},
                        sourceSensorDeviceId: value === "__none" ? void 0 : value
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select source sensor" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                      automationDeviceOptions.filter((device) => device.type === "sensor").map((device) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: device.value, children: device.label }, `hlt-source-${device.value}`))
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Hysteresis" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  value: String(((_C = selectedNode.data.config.hltController) == null ? void 0 : _C.hysteresis) ?? 1),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      hltController: {
                        ...selectedNode.data.config.hltController ?? {},
                        hysteresis: parseMaybeNumber(event.target.value) ?? 1
                      }
                    }
                  })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Poll Interval (ms)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                value: String(((_D = selectedNode.data.config.hltController) == null ? void 0 : _D.pollMs) ?? 1e3),
                disabled: currentMode !== "draft",
                onChange: (event) => updateSelectedNode({
                  config: {
                    ...selectedNode.data.config,
                    hltController: {
                      ...selectedNode.data.config.hltController ?? {},
                      pollMs: parseMaybeNumber(event.target.value) ?? 1e3
                    }
                  }
                })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Heater Output" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_E = selectedNode.data.config.hltController) == null ? void 0 : _E.heaterDeviceId) ?? "__none",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      hltController: {
                        ...selectedNode.data.config.hltController ?? {},
                        heaterDeviceId: value === "__none" ? void 0 : value
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select heater target" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                      automationDeviceOptions.filter((device) => device.type === "heater").map((device) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: device.value, children: device.label }, `hlt-heater-${device.value}`))
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Recirc Pump Output" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_F = selectedNode.data.config.hltController) == null ? void 0 : _F.recircPumpDeviceId) ?? "__none",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      hltController: {
                        ...selectedNode.data.config.hltController ?? {},
                        recircPumpDeviceId: value === "__none" ? void 0 : value
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select recirc pump target" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                      automationDeviceOptions.filter((device) => device.type === "pump").map((device) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: device.value, children: device.label }, `hlt-pump-${device.value}`))
                    ] })
                  ]
                }
              )
            ] })
          ] })
        ] }),
        selectedNode.data.widgetType === "co2_controller" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded-md border border-border p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "CO2 pressure control with beverage style presets and optional vent control." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Controller" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_G = selectedNode.data.config.co2Controller) == null ? void 0 : _G.enabled) ? "enabled" : "disabled",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      co2Controller: {
                        ...selectedNode.data.config.co2Controller ?? {},
                        enabled: value === "enabled",
                        runtimeState: value === "enabled" ? "idle" : "disabled"
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "disabled", children: "Disabled" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "enabled", children: "Enabled" })
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Style" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_H = selectedNode.data.config.co2Controller) == null ? void 0 : _H.beverageStyle) ?? "beer",
                  onValueChange: (value) => {
                    const style = value;
                    const preset = co2StylePresets[style];
                    updateSelectedNode({
                      config: {
                        ...selectedNode.data.config,
                        setpoint: preset.targetPsi,
                        co2Controller: {
                          ...selectedNode.data.config.co2Controller ?? {},
                          beverageStyle: style,
                          threshold: preset.targetPsi,
                          targetVolumes: preset.targetVolumes,
                          hysteresis: preset.hysteresis,
                          maxPressurePsi: preset.maxPressurePsi
                        }
                      }
                    });
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "beer", children: "Beer" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "cider", children: "Cider" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "champagne", children: "Champagne" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "wine", children: "Wine" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "seltzer", children: "Seltzer" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "custom", children: "Custom" })
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Unit" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: String(selectedNode.data.config.unit ?? "PSI"),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      unit: event.target.value
                    }
                  })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Compare To" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_I = selectedNode.data.config.co2Controller) == null ? void 0 : _I.compareTo) ?? "threshold",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      co2Controller: {
                        ...selectedNode.data.config.co2Controller ?? {},
                        compareTo: value
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "threshold", children: "Local Target" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "setpoint_device", children: "Setpoint Device" })
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Target Mode" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_J = selectedNode.data.config.co2Controller) == null ? void 0 : _J.targetMode) ?? "psi",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      co2Controller: {
                        ...selectedNode.data.config.co2Controller ?? {},
                        targetMode: value
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "psi", children: "PSI" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "volumes", children: "CO2 Volumes" })
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Source Sensor" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_K = selectedNode.data.config.co2Controller) == null ? void 0 : _K.sourceSensorDeviceId) ?? "__none",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      co2Controller: {
                        ...selectedNode.data.config.co2Controller ?? {},
                        sourceSensorDeviceId: value === "__none" ? void 0 : value
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select pressure sensor" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                      automationDeviceOptions.filter((device) => device.type === "sensor").map((device) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: device.value, children: device.label }, `co2-source-${device.value}`))
                    ] })
                  ]
                }
              )
            ] })
          ] }),
          (((_L = selectedNode.data.config.co2Controller) == null ? void 0 : _L.compareTo) ?? "threshold") === "threshold" ? (((_M = selectedNode.data.config.co2Controller) == null ? void 0 : _M.targetMode) ?? "psi") === "volumes" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Target Volumes" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "number",
                    value: String(((_N = selectedNode.data.config.co2Controller) == null ? void 0 : _N.targetVolumes) ?? 2.4),
                    disabled: currentMode !== "draft",
                    onChange: (event) => {
                      const next = parseMaybeNumber(event.target.value) ?? 2.4;
                      updateSelectedNode({
                        config: {
                          ...selectedNode.data.config,
                          co2Controller: {
                            ...selectedNode.data.config.co2Controller ?? {},
                            targetVolumes: next
                          }
                        }
                      });
                    }
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Beverage Temp (F)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "number",
                    value: String(((_O = selectedNode.data.config.co2Controller) == null ? void 0 : _O.beverageTempF) ?? 38),
                    disabled: currentMode !== "draft",
                    onChange: (event) => {
                      const next = parseMaybeNumber(event.target.value) ?? 38;
                      updateSelectedNode({
                        config: {
                          ...selectedNode.data.config,
                          co2Controller: {
                            ...selectedNode.data.config.co2Controller ?? {},
                            beverageTempF: next
                          }
                        }
                      });
                    }
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Beverage Temp Sensor (optional)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_P = selectedNode.data.config.co2Controller) == null ? void 0 : _P.beverageTempSensorDeviceId) ?? "__none",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      co2Controller: {
                        ...selectedNode.data.config.co2Controller ?? {},
                        beverageTempSensorDeviceId: value === "__none" ? void 0 : value
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select temp sensor" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                      automationDeviceOptions.filter((device) => device.type === "sensor").map((device) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: device.value, children: device.label }, `co2-temp-src-${device.value}`))
                    ] })
                  ]
                }
              )
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Target Pressure" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                value: String(
                  selectedNode.data.config.setpoint ?? ((_Q = selectedNode.data.config.co2Controller) == null ? void 0 : _Q.threshold) ?? 12
                ),
                disabled: currentMode !== "draft",
                onChange: (event) => {
                  const next = parseMaybeNumber(event.target.value) ?? 12;
                  updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      setpoint: next,
                      co2Controller: {
                        ...selectedNode.data.config.co2Controller ?? {},
                        threshold: next
                      }
                    }
                  });
                }
              }
            )
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Setpoint Device (slider/sensor)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: ((_R = selectedNode.data.config.co2Controller) == null ? void 0 : _R.setpointDeviceId) ?? "__none",
                onValueChange: (value) => updateSelectedNode({
                  config: {
                    ...selectedNode.data.config,
                    co2Controller: {
                      ...selectedNode.data.config.co2Controller ?? {},
                      setpointDeviceId: value === "__none" ? void 0 : value
                    }
                  }
                }),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select setpoint device" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                    automationDeviceOptions.filter((device) => device.type === "slider" || device.type === "sensor").map((device) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: device.value, children: device.label }, `co2-setpoint-${device.value}`))
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Hysteresis" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  value: String(((_S = selectedNode.data.config.co2Controller) == null ? void 0 : _S.hysteresis) ?? 0.5),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      co2Controller: {
                        ...selectedNode.data.config.co2Controller ?? {},
                        hysteresis: parseMaybeNumber(event.target.value) ?? 0.5
                      }
                    }
                  })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Max Pressure" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  value: String(((_T = selectedNode.data.config.co2Controller) == null ? void 0 : _T.maxPressurePsi) ?? 25),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      co2Controller: {
                        ...selectedNode.data.config.co2Controller ?? {},
                        maxPressurePsi: parseMaybeNumber(event.target.value) ?? 25
                      }
                    }
                  })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Poll Interval (ms)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  value: String(((_U = selectedNode.data.config.co2Controller) == null ? void 0 : _U.pollMs) ?? 1e3),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      co2Controller: {
                        ...selectedNode.data.config.co2Controller ?? {},
                        pollMs: parseMaybeNumber(event.target.value) ?? 1e3
                      }
                    }
                  })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Sensor Timeout (ms)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  value: String(((_V = selectedNode.data.config.co2Controller) == null ? void 0 : _V.sampleTimeoutMs) ?? 0),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      co2Controller: {
                        ...selectedNode.data.config.co2Controller ?? {},
                        sampleTimeoutMs: parseMaybeNumber(event.target.value) ?? 0
                      }
                    }
                  })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Max Rise (PSI/min)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  value: String(((_W = selectedNode.data.config.co2Controller) == null ? void 0 : _W.maxPressureRisePsiPerMin) ?? 0),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      co2Controller: {
                        ...selectedNode.data.config.co2Controller ?? {},
                        maxPressureRisePsiPerMin: parseMaybeNumber(event.target.value) ?? 0
                      }
                    }
                  })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground", children: "Set timeout/rise to 0 to disable those safety filters." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Alarm Output Device" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_X = selectedNode.data.config.co2Controller) == null ? void 0 : _X.alarmOutputDeviceId) ?? "__none",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      co2Controller: {
                        ...selectedNode.data.config.co2Controller ?? {},
                        alarmOutputDeviceId: value === "__none" ? void 0 : value
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select alarm output" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                      automationDeviceOptions.filter(
                        (device) => device.type !== "sensor" && device.type !== "vessel" && device.type !== "display" && device.type !== "note" && device.type !== "automation"
                      ).map((device) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: device.value, children: device.label }, `co2-alarm-output-${device.value}`))
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Emit Alarm Events" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_Y = selectedNode.data.config.co2Controller) == null ? void 0 : _Y.emitAlarmEvents) === false ? "off" : "on",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      co2Controller: {
                        ...selectedNode.data.config.co2Controller ?? {},
                        emitAlarmEvents: value === "on"
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "on", children: "On" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "off", children: "Off" })
                    ] })
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border border-border/70 p-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Purge" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: ((_Z = selectedNode.data.config.co2Controller) == null ? void 0 : _Z.purgeActive) ? "on" : "off",
                    onValueChange: (value) => updateSelectedNode({
                      config: {
                        ...selectedNode.data.config,
                        co2Controller: {
                          ...selectedNode.data.config.co2Controller ?? {},
                          purgeActive: value === "on"
                        }
                      }
                    }),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "off", children: "Off" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "on", children: "On" })
                      ] })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Purge Cycles" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "number",
                    value: String(((__ = selectedNode.data.config.co2Controller) == null ? void 0 : __.purgeCycles) ?? 3),
                    disabled: currentMode !== "draft",
                    onChange: (event) => updateSelectedNode({
                      config: {
                        ...selectedNode.data.config,
                        co2Controller: {
                          ...selectedNode.data.config.co2Controller ?? {},
                          purgeCycles: parseMaybeNumber(event.target.value) ?? 3
                        }
                      }
                    })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Inject (ms)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "number",
                    value: String(((_$ = selectedNode.data.config.co2Controller) == null ? void 0 : _$.purgeInjectMs) ?? 4e3),
                    disabled: currentMode !== "draft",
                    onChange: (event) => updateSelectedNode({
                      config: {
                        ...selectedNode.data.config,
                        co2Controller: {
                          ...selectedNode.data.config.co2Controller ?? {},
                          purgeInjectMs: parseMaybeNumber(event.target.value) ?? 4e3
                        }
                      }
                    })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Vent (ms)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "number",
                    value: String(((_aa = selectedNode.data.config.co2Controller) == null ? void 0 : _aa.purgeVentMs) ?? 2e3),
                    disabled: currentMode !== "draft",
                    onChange: (event) => updateSelectedNode({
                      config: {
                        ...selectedNode.data.config,
                        co2Controller: {
                          ...selectedNode.data.config.co2Controller ?? {},
                          purgeVentMs: parseMaybeNumber(event.target.value) ?? 2e3
                        }
                      }
                    })
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Inlet Valve" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_ba = selectedNode.data.config.co2Controller) == null ? void 0 : _ba.inletValveDeviceId) ?? "__none",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      co2Controller: {
                        ...selectedNode.data.config.co2Controller ?? {},
                        inletValveDeviceId: value === "__none" ? void 0 : value
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select inlet valve" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                      automationDeviceOptions.filter((device) => device.type === "valve").map((device) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: device.value, children: device.label }, `co2-inlet-${device.value}`))
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Vent Valve" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_ca = selectedNode.data.config.co2Controller) == null ? void 0 : _ca.ventValveDeviceId) ?? "__none",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      co2Controller: {
                        ...selectedNode.data.config.co2Controller ?? {},
                        ventValveDeviceId: value === "__none" ? void 0 : value
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select vent valve" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                      automationDeviceOptions.filter((device) => device.type === "valve").map((device) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: device.value, children: device.label }, `co2-vent-${device.value}`))
                    ] })
                  ]
                }
              )
            ] })
          ] })
        ] }),
        selectedNode.data.widgetType === "transfer_controller" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded-md border border-border p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Transfer route control for multi-valve paths with FSD or VSD pump support." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Controller" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_da = selectedNode.data.config.transferController) == null ? void 0 : _da.enabled) ? "enabled" : "disabled",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      transferController: {
                        ...selectedNode.data.config.transferController ?? {},
                        enabled: value === "enabled",
                        runtimeState: value === "enabled" ? "idle" : "disabled"
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "disabled", children: "Disabled" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "enabled", children: "Enabled" })
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Auto-map Wiring" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_ea = selectedNode.data.config.transferController) == null ? void 0 : _ea.autoMapWiring) === false ? "off" : "on",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      transferController: {
                        ...selectedNode.data.config.transferController ?? {},
                        autoMapWiring: value === "on"
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "on", children: "On" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "off", children: "Off" })
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Pump Mode" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_fa = selectedNode.data.config.transferController) == null ? void 0 : _fa.pumpMode) ?? "fsd",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      transferController: {
                        ...selectedNode.data.config.transferController ?? {},
                        pumpMode: value
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "fsd", children: "FSD (On/Off)" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "vsd", children: "VSD (Speed)" })
                    ] })
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Speed (%)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  value: String(((_ga = selectedNode.data.config.transferController) == null ? void 0 : _ga.transferSpeedPct) ?? 60),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      value: parseMaybeNumber(event.target.value) ?? 60,
                      transferController: {
                        ...selectedNode.data.config.transferController ?? {},
                        transferSpeedPct: parseMaybeNumber(event.target.value) ?? 60
                      }
                    }
                  })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Ramp (sec)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  value: String(((_ha = selectedNode.data.config.transferController) == null ? void 0 : _ha.rampSeconds) ?? 5),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      transferController: {
                        ...selectedNode.data.config.transferController ?? {},
                        rampSeconds: parseMaybeNumber(event.target.value) ?? 5
                      }
                    }
                  })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Poll Interval (ms)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  value: String(((_ia = selectedNode.data.config.transferController) == null ? void 0 : _ia.pollMs) ?? 500),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      transferController: {
                        ...selectedNode.data.config.transferController ?? {},
                        pollMs: parseMaybeNumber(event.target.value) ?? 500
                      }
                    }
                  })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Pump Output" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: ((_ja = selectedNode.data.config.transferController) == null ? void 0 : _ja.pumpDeviceId) ?? "__none",
                onValueChange: (value) => updateSelectedNode({
                  config: {
                    ...selectedNode.data.config,
                    transferController: {
                      ...selectedNode.data.config.transferController ?? {},
                      pumpDeviceId: value === "__none" ? void 0 : value
                    }
                  }
                }),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select pump target" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                    automationDeviceOptions.filter((device) => device.type === "pump").map((device) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: device.value, children: device.label }, `transfer-pump-${device.value}`))
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Source Valves" }),
              [0, 1, 2].map((slot) => {
                var _a2;
                const values = ((_a2 = selectedNode.data.config.transferController) == null ? void 0 : _a2.sourceValveDeviceIds) ?? [];
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: values[slot] ?? "__none",
                    onValueChange: (value) => {
                      const next = [...values];
                      next[slot] = value === "__none" ? "" : value;
                      const compact = next.filter(Boolean);
                      updateSelectedNode({
                        config: {
                          ...selectedNode.data.config,
                          transferController: {
                            ...selectedNode.data.config.transferController ?? {},
                            sourceValveDeviceIds: compact
                          }
                        }
                      });
                    },
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: `Source Valve ${slot + 1}` }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                        automationDeviceOptions.filter((device) => device.type === "valve").map((device) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: device.value, children: device.label }, `transfer-source-opt-${slot}-${device.value}`))
                      ] })
                    ]
                  },
                  `transfer-source-${slot}`
                );
              })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Destination Valves" }),
              [0, 1, 2].map((slot) => {
                var _a2;
                const values = ((_a2 = selectedNode.data.config.transferController) == null ? void 0 : _a2.destinationValveDeviceIds) ?? [];
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: values[slot] ?? "__none",
                    onValueChange: (value) => {
                      const next = [...values];
                      next[slot] = value === "__none" ? "" : value;
                      const compact = next.filter(Boolean);
                      updateSelectedNode({
                        config: {
                          ...selectedNode.data.config,
                          transferController: {
                            ...selectedNode.data.config.transferController ?? {},
                            destinationValveDeviceIds: compact
                          }
                        }
                      });
                    },
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: `Destination Valve ${slot + 1}` }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                        automationDeviceOptions.filter((device) => device.type === "valve").map((device) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: device.value, children: device.label }, `transfer-dest-opt-${slot}-${device.value}`))
                      ] })
                    ]
                  },
                  `transfer-dest-${slot}`
                );
              })
            ] })
          ] })
        ] }),
        selectedNode.data.widgetType === "recipe_executor" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded-md border border-border p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Executes imported recipe steps with optional confirmation gates and target dispatch." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Controller" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_ka = selectedNode.data.config.recipeExecutor) == null ? void 0 : _ka.enabled) ? "enabled" : "disabled",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      recipeExecutor: {
                        ...selectedNode.data.config.recipeExecutor ?? {},
                        enabled: value === "enabled",
                        runtimeState: value === "enabled" ? "idle" : "disabled"
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "disabled", children: "Disabled" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "enabled", children: "Enabled" })
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Default Step Mode" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_la = selectedNode.data.config.recipeExecutor) == null ? void 0 : _la.autoProceedDefault) ? "auto" : "confirm",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      recipeExecutor: {
                        ...selectedNode.data.config.recipeExecutor ?? {},
                        autoProceedDefault: value === "auto"
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "confirm", children: "Confirm Required" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "auto", children: "Auto Proceed" })
                    ] })
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded border border-border/70 p-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-foreground", children: selectedNode.data.config.recipeName || "No recipe loaded" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground", children: selectedNode.data.config.recipeFormat ? `Format: ${selectedNode.data.config.recipeFormat}` : "Load from imported recipes on the execution page." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  size: "sm",
                  variant: "outline",
                  disabled: currentMode !== "draft" || !selectedImportedRecipe,
                  onClick: () => {
                    var _a2;
                    if (!selectedImportedRecipe) return;
                    updateSelectedNode({
                      config: {
                        ...selectedNode.data.config,
                        recipeId: selectedImportedRecipe.id,
                        recipeName: selectedImportedRecipe.name,
                        recipeFormat: selectedImportedRecipe.format,
                        recipeSteps: selectedImportedRecipe.steps.map((step) => ({ ...step })),
                        state: "off",
                        recipeExecutor: {
                          ...selectedNode.data.config.recipeExecutor ?? {},
                          running: false,
                          paused: false,
                          awaitingConfirm: false,
                          currentStepIndex: 0,
                          stepStartedAtMs: void 0,
                          activeStepId: void 0,
                          runtimeState: ((_a2 = selectedNode.data.config.recipeExecutor) == null ? void 0 : _a2.enabled) === true ? "idle" : "disabled"
                        }
                      }
                    });
                    recipeExecutorDispatchStateRef.current.delete(selectedNode.id);
                    recipeExecutorRunIdRef.current.delete(selectedNode.id);
                    setStatus(`Loaded recipe into executor: ${selectedImportedRecipe.name}`);
                  },
                  children: "Load Recipe"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: selectedImportedRecipeId || "__none",
                onValueChange: (value) => setSelectedImportedRecipeId(value === "__none" ? "" : value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft" || importedRecipes.length === 0, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select imported recipe" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: importedRecipes.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", disabled: true, children: "No imported recipes" }) : importedRecipes.map((recipe) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: recipe.id, children: [
                    recipe.name,
                    " (",
                    recipe.steps.length,
                    " steps)"
                  ] }, `recipe-import-opt-${recipe.id}`)) })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2 text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Steps" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-foreground", children: ((_ma = selectedNode.data.config.recipeSteps) == null ? void 0 : _ma.length) ?? 0 })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Current Step" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-foreground", children: Math.min(
                  Number(((_na = selectedNode.data.config.recipeExecutor) == null ? void 0 : _na.currentStepIndex) ?? 0) + 1,
                  Math.max(1, Number(((_oa = selectedNode.data.config.recipeSteps) == null ? void 0 : _oa.length) ?? 0))
                ) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Runtime" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-foreground", children: String(
                  ((_pa = selectedNode.data.config.recipeExecutor) == null ? void 0 : _pa.runtimeState) ?? "disabled"
                ).replaceAll("_", " ") })
              ] })
            ] }),
            (selectedNode.data.config.recipeSteps ?? []).length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-72 space-y-2 overflow-auto rounded border border-border/60 p-2 text-[11px]", children: (selectedNode.data.config.recipeSteps ?? []).map((step, index2) => {
              var _a2;
              const mode = step.requiresUserConfirm === true ? "confirm" : step.autoProceed === true ? "auto" : "confirm";
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded border border-border/60 p-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "truncate font-medium text-foreground", children: [
                    index2 + 1,
                    ". ",
                    step.name
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        type: "button",
                        size: "sm",
                        variant: "outline",
                        className: "h-6 px-2 text-[10px]",
                        disabled: currentMode !== "draft" || index2 === 0,
                        onClick: () => {
                          const steps = [...selectedNode.data.config.recipeSteps ?? []];
                          [steps[index2 - 1], steps[index2]] = [steps[index2], steps[index2 - 1]];
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              recipeSteps: steps
                            }
                          });
                        },
                        children: "Up"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        type: "button",
                        size: "sm",
                        variant: "outline",
                        className: "h-6 px-2 text-[10px]",
                        disabled: currentMode !== "draft" || index2 >= (((_a2 = selectedNode.data.config.recipeSteps) == null ? void 0 : _a2.length) ?? 0) - 1,
                        onClick: () => {
                          const steps = [...selectedNode.data.config.recipeSteps ?? []];
                          [steps[index2], steps[index2 + 1]] = [steps[index2 + 1], steps[index2]];
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              recipeSteps: steps
                            }
                          });
                        },
                        children: "Down"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        type: "button",
                        size: "sm",
                        variant: "destructive",
                        className: "h-6 px-2 text-[10px]",
                        disabled: currentMode !== "draft",
                        onClick: () => updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            recipeSteps: (selectedNode.data.config.recipeSteps ?? []).filter(
                              (candidate) => candidate.id !== step.id
                            )
                          }
                        }),
                        children: "Remove"
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Step Name" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      value: step.name,
                      disabled: currentMode !== "draft",
                      onChange: (event) => updateSelectedNode({
                        config: {
                          ...selectedNode.data.config,
                          recipeSteps: (selectedNode.data.config.recipeSteps ?? []).map(
                            (candidate) => candidate.id === step.id ? {
                              ...candidate,
                              name: event.target.value
                            } : candidate
                          )
                        }
                      })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Stage" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        value: String(step.stage ?? ""),
                        placeholder: "mash, boil, fermentation",
                        disabled: currentMode !== "draft",
                        onChange: (event) => updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            recipeSteps: (selectedNode.data.config.recipeSteps ?? []).map(
                              (candidate) => candidate.id === step.id ? {
                                ...candidate,
                                stage: event.target.value
                              } : candidate
                            )
                          }
                        })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Command" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Select,
                      {
                        value: step.command ?? "trigger",
                        onValueChange: (value) => updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            recipeSteps: (selectedNode.data.config.recipeSteps ?? []).map(
                              (candidate) => candidate.id === step.id ? {
                                ...candidate,
                                command: value
                              } : candidate
                            )
                          }
                        }),
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "trigger", children: "Trigger" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "on_off", children: "On/Off" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "open_close", children: "Open/Close" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "route", children: "Route" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "set_value", children: "Set Value" })
                          ] })
                        ]
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Target Device" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Select,
                      {
                        value: step.targetDeviceId ?? "__none",
                        onValueChange: (value) => updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            recipeSteps: (selectedNode.data.config.recipeSteps ?? []).map(
                              (candidate) => candidate.id === step.id ? {
                                ...candidate,
                                targetDeviceId: value === "__none" ? void 0 : value
                              } : candidate
                            )
                          }
                        }),
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select target device" }) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                            automationDeviceOptions.filter((device) => device.type !== "note" && device.type !== "display").map((device) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: device.value, children: device.label }, `recipe-step-target-${step.id}-${device.value}`))
                          ] })
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Value (optional)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        value: String(step.value ?? ""),
                        disabled: currentMode !== "draft",
                        placeholder: "on, off, 68, c_to_a",
                        onChange: (event) => updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            recipeSteps: (selectedNode.data.config.recipeSteps ?? []).map(
                              (candidate) => candidate.id === step.id ? {
                                ...candidate,
                                value: event.target.value
                              } : candidate
                            )
                          }
                        })
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Duration (min)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        type: "number",
                        value: String(step.durationMin ?? ""),
                        disabled: currentMode !== "draft",
                        onChange: (event) => updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            recipeSteps: (selectedNode.data.config.recipeSteps ?? []).map(
                              (candidate) => candidate.id === step.id ? {
                                ...candidate,
                                durationMin: parseMaybeNumber(event.target.value)
                              } : candidate
                            )
                          }
                        })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Target Temp (C)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        type: "number",
                        value: String(step.temperatureC ?? ""),
                        disabled: currentMode !== "draft",
                        onChange: (event) => updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            recipeSteps: (selectedNode.data.config.recipeSteps ?? []).map(
                              (candidate) => candidate.id === step.id ? {
                                ...candidate,
                                temperatureC: parseMaybeNumber(event.target.value)
                              } : candidate
                            )
                          }
                        })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Step Mode" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Select,
                      {
                        value: mode,
                        onValueChange: (value) => updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            recipeSteps: (selectedNode.data.config.recipeSteps ?? []).map(
                              (candidate) => candidate.id === step.id ? {
                                ...candidate,
                                requiresUserConfirm: value === "confirm",
                                autoProceed: value === "auto"
                              } : candidate
                            )
                          }
                        }),
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "confirm", children: "Confirm" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "auto", children: "Auto" })
                          ] })
                        ]
                      }
                    )
                  ] })
                ] })
              ] }, `recipe-step-${step.id}`);
            }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "rounded border border-dashed border-border/70 p-2 text-[11px] text-muted-foreground", children: 'No steps loaded. Import a recipe, then click "Load Latest Import".' }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                size: "sm",
                variant: "outline",
                disabled: currentMode !== "draft",
                onClick: () => {
                  var _a2;
                  return updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      recipeSteps: [
                        ...selectedNode.data.config.recipeSteps ?? [],
                        {
                          id: makeId("recipe-step"),
                          name: `Step ${(((_a2 = selectedNode.data.config.recipeSteps) == null ? void 0 : _a2.length) ?? 0) + 1}`,
                          stage: "manual",
                          action: "manual",
                          command: "trigger",
                          requiresUserConfirm: true,
                          autoProceed: false
                        }
                      ]
                    }
                  });
                },
                children: "Add Step"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                size: "sm",
                variant: "outline",
                disabled: currentMode !== "draft",
                onClick: () => {
                  var _a2;
                  updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      state: "off",
                      recipeExecutor: {
                        ...selectedNode.data.config.recipeExecutor ?? {},
                        running: false,
                        paused: false,
                        awaitingConfirm: false,
                        currentStepIndex: 0,
                        stepStartedAtMs: void 0,
                        activeStepId: void 0,
                        runtimeState: ((_a2 = selectedNode.data.config.recipeExecutor) == null ? void 0 : _a2.enabled) === true ? "idle" : "disabled"
                      }
                    }
                  });
                  recipeExecutorDispatchStateRef.current.delete(selectedNode.id);
                  recipeExecutorRunIdRef.current.delete(selectedNode.id);
                },
                children: "Reset Progress"
              }
            )
          ] })
        ] }),
        (selectedNode.data.widgetType === "heater" || selectedNode.data.widgetType === "pid") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "popup-cfg-setpoint", children: "Setpoint (C)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "popup-cfg-setpoint",
              type: "number",
              value: String(selectedNode.data.config.setpoint ?? ""),
              disabled: currentMode !== "draft",
              onChange: (event) => updateSelectedNode({
                config: {
                  ...selectedNode.data.config,
                  setpoint: parseMaybeNumber(event.target.value)
                }
              })
            }
          )
        ] }),
        selectedNode.data.widgetType === "automation" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded-md border border-border p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Automation UI Mode" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: selectedNode.data.config.automationMode ?? "simple",
                onValueChange: (value) => updateSelectedNode({
                  config: {
                    ...selectedNode.data.config,
                    automationMode: value
                  }
                }),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "simple", children: "Simple (When/Then)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "advanced", children: "Advanced (Step Sequence)" })
                  ] })
                ]
              }
            )
          ] }),
          (selectedNode.data.config.automationMode ?? "simple") === "simple" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded border border-border/70 p-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Trigger by sensor value and control a target device automatically." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Source Sensor" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_qa = selectedNode.data.config.simpleAutomation) == null ? void 0 : _qa.sourceSensorDeviceId) ?? "__none",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      simpleAutomation: {
                        ...selectedNode.data.config.simpleAutomation ?? {},
                        sourceSensorDeviceId: value === "__none" ? void 0 : value
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select sensor device" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                      automationDeviceOptions.filter((device) => device.type === "sensor").map((device) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: device.value, children: device.label }, `simple-sensor-${device.value}`))
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Compare To" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: ((_ra = selectedNode.data.config.simpleAutomation) == null ? void 0 : _ra.compareTo) ?? "threshold",
                    onValueChange: (value) => updateSelectedNode({
                      config: {
                        ...selectedNode.data.config,
                        simpleAutomation: {
                          ...selectedNode.data.config.simpleAutomation ?? {},
                          compareTo: value
                        }
                      }
                    }),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "threshold", children: "Threshold" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "setpoint_device", children: "Setpoint Device" })
                      ] })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Operator" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: ((_sa = selectedNode.data.config.simpleAutomation) == null ? void 0 : _sa.operator) ?? "gt",
                    onValueChange: (value) => updateSelectedNode({
                      config: {
                        ...selectedNode.data.config,
                        simpleAutomation: {
                          ...selectedNode.data.config.simpleAutomation ?? {},
                          operator: value
                        }
                      }
                    }),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "gt", children: ">" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "gte", children: ">=" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "lt", children: "<" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "lte", children: "<=" })
                      ] })
                    ]
                  }
                )
              ] })
            ] }),
            (((_ta = selectedNode.data.config.simpleAutomation) == null ? void 0 : _ta.compareTo) ?? "threshold") === "threshold" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Threshold" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  value: String(((_ua = selectedNode.data.config.simpleAutomation) == null ? void 0 : _ua.threshold) ?? ""),
                  disabled: currentMode !== "draft",
                  onChange: (event) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      simpleAutomation: {
                        ...selectedNode.data.config.simpleAutomation ?? {},
                        threshold: parseMaybeNumber(event.target.value)
                      }
                    }
                  })
                }
              )
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Setpoint Device (slider/sensor)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_va = selectedNode.data.config.simpleAutomation) == null ? void 0 : _va.setpointDeviceId) ?? "__none",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      simpleAutomation: {
                        ...selectedNode.data.config.simpleAutomation ?? {},
                        setpointDeviceId: value === "__none" ? void 0 : value
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select setpoint device" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                      automationDeviceOptions.filter((device) => device.type === "slider" || device.type === "sensor").map((device) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: device.value, children: device.label }, `simple-setpoint-${device.value}`))
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Hysteresis" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "number",
                    value: String(((_wa = selectedNode.data.config.simpleAutomation) == null ? void 0 : _wa.hysteresis) ?? 0),
                    disabled: currentMode !== "draft",
                    onChange: (event) => updateSelectedNode({
                      config: {
                        ...selectedNode.data.config,
                        simpleAutomation: {
                          ...selectedNode.data.config.simpleAutomation ?? {},
                          hysteresis: parseMaybeNumber(event.target.value) ?? 0
                        }
                      }
                    })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Poll Interval (ms)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "number",
                    value: String(((_xa = selectedNode.data.config.simpleAutomation) == null ? void 0 : _xa.pollMs) ?? 1e3),
                    disabled: currentMode !== "draft",
                    onChange: (event) => updateSelectedNode({
                      config: {
                        ...selectedNode.data.config,
                        simpleAutomation: {
                          ...selectedNode.data.config.simpleAutomation ?? {},
                          pollMs: parseMaybeNumber(event.target.value) ?? 1e3
                        }
                      }
                    })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Target Device" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: ((_ya = selectedNode.data.config.simpleAutomation) == null ? void 0 : _ya.targetDeviceId) ?? "__none",
                  onValueChange: (value) => updateSelectedNode({
                    config: {
                      ...selectedNode.data.config,
                      simpleAutomation: {
                        ...selectedNode.data.config.simpleAutomation ?? {},
                        targetDeviceId: value === "__none" ? void 0 : value
                      }
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select target device" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                      automationDeviceOptions.map((device) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: device.value, children: device.label }, `simple-target-${device.value}`))
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Command" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: ((_za = selectedNode.data.config.simpleAutomation) == null ? void 0 : _za.command) ?? "on_off",
                    onValueChange: (value) => updateSelectedNode({
                      config: {
                        ...selectedNode.data.config,
                        simpleAutomation: {
                          ...selectedNode.data.config.simpleAutomation ?? {},
                          command: value
                        }
                      }
                    }),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "on_off", children: "On/Off" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "open_close", children: "Open/Close" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "route", children: "Route A/B" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "set_value", children: "Set Value" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "trigger", children: "Trigger" })
                      ] })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "On Value" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    value: String(((_Aa = selectedNode.data.config.simpleAutomation) == null ? void 0 : _Aa.onValue) ?? ""),
                    disabled: currentMode !== "draft",
                    onChange: (event) => updateSelectedNode({
                      config: {
                        ...selectedNode.data.config,
                        simpleAutomation: {
                          ...selectedNode.data.config.simpleAutomation ?? {},
                          onValue: event.target.value
                        }
                      }
                    }),
                    placeholder: "on / open / c_to_a / 70"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Off Value" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    value: String(((_Ba = selectedNode.data.config.simpleAutomation) == null ? void 0 : _Ba.offValue) ?? ""),
                    disabled: currentMode !== "draft",
                    onChange: (event) => updateSelectedNode({
                      config: {
                        ...selectedNode.data.config,
                        simpleAutomation: {
                          ...selectedNode.data.config.simpleAutomation ?? {},
                          offValue: event.target.value
                        }
                      }
                    }),
                    placeholder: "off / closed / c_to_b / 65"
                  }
                )
              ] })
            ] })
          ] }),
          (selectedNode.data.config.automationMode ?? "simple") === "advanced" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Automation Steps" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  size: "sm",
                  disabled: currentMode !== "draft",
                  onClick: () => {
                    const existing = selectedNode.data.config.automationSteps ?? [];
                    const nextStep = {
                      id: makeId("step"),
                      label: `Step ${existing.length + 1}`,
                      command: "on_off",
                      value: "on",
                      delayMs: 0
                    };
                    updateSelectedNode({
                      config: {
                        ...selectedNode.data.config,
                        automationSteps: [...existing, nextStep]
                      }
                    });
                  },
                  children: "Add Step"
                }
              )
            ] }),
            (selectedNode.data.config.automationSteps ?? []).length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Add steps to run multiple device commands with optional delays." }) : (selectedNode.data.config.automationSteps ?? []).map((step, index2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded border border-border/70 p-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-medium", children: [
                  "Step ",
                  index2 + 1
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "ghost",
                    size: "sm",
                    disabled: currentMode !== "draft",
                    onClick: () => updateSelectedNode({
                      config: {
                        ...selectedNode.data.config,
                        automationSteps: (selectedNode.data.config.automationSteps ?? []).filter(
                          (candidate) => candidate.id !== step.id
                        )
                      }
                    }),
                    children: "Remove"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Target Device" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: step.targetDeviceId ?? "__none",
                    onValueChange: (value) => updateSelectedNode({
                      config: {
                        ...selectedNode.data.config,
                        automationSteps: (selectedNode.data.config.automationSteps ?? []).map(
                          (candidate) => candidate.id === step.id ? {
                            ...candidate,
                            targetDeviceId: value === "__none" ? void 0 : value
                          } : candidate
                        )
                      }
                    }),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select target device" }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                        devices.map((device) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: device.id, children: [
                          device.name,
                          " (",
                          device.type,
                          ")"
                        ] }, `step-device-${step.id}-${device.id}`))
                      ] })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Command" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Select,
                    {
                      value: step.command ?? "on_off",
                      onValueChange: (value) => updateSelectedNode({
                        config: {
                          ...selectedNode.data.config,
                          automationSteps: (selectedNode.data.config.automationSteps ?? []).map(
                            (candidate) => candidate.id === step.id ? {
                              ...candidate,
                              command: value
                            } : candidate
                          )
                        }
                      }),
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: currentMode !== "draft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "on_off", children: "On/Off" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "open_close", children: "Open/Close" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "route", children: "Route A/B" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "set_value", children: "Set Value" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "trigger", children: "Trigger" })
                        ] })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Delay (ms)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      type: "number",
                      value: String(step.delayMs ?? 0),
                      disabled: currentMode !== "draft",
                      onChange: (event) => updateSelectedNode({
                        config: {
                          ...selectedNode.data.config,
                          automationSteps: (selectedNode.data.config.automationSteps ?? []).map(
                            (candidate) => candidate.id === step.id ? {
                              ...candidate,
                              delayMs: parseMaybeNumber(event.target.value) ?? 0
                            } : candidate
                          )
                        }
                      })
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Value (optional)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    value: String(step.value ?? ""),
                    disabled: currentMode !== "draft",
                    onChange: (event) => updateSelectedNode({
                      config: {
                        ...selectedNode.data.config,
                        automationSteps: (selectedNode.data.config.automationSteps ?? []).map(
                          (candidate) => candidate.id === step.id ? {
                            ...candidate,
                            value: event.target.value
                          } : candidate
                        )
                      }
                    }),
                    placeholder: "on, off, true, false, 50, c_to_a"
                  }
                )
              ] })
            ] }, step.id ?? `${index2}`))
          ] })
        ] }),
        (selectedNode.data.widgetType === "button" || selectedNode.data.widgetType === "display" || selectedNode.data.widgetType === "note") && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "This widget has minimal config. Use label and bindings." })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No widget selected." })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: warningsOpen, onOpenChange: setWarningsOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-h-[85vh] overflow-auto sm:max-w-[640px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Build Warnings" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Wiring and configuration checks with suggested fixes." })
      ] }),
      buildWarnings.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-emerald-600", children: "No build warnings." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: buildWarnings.map((warning, index2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-amber-200 bg-amber-50 p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-amber-900", children: warning }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-amber-800", children: [
          "Suggested fix: ",
          warningSuggestion(warning)
        ] })
      ] }, `warnings-dialog-${index2}`)) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: Boolean(wireDeleteTarget), onOpenChange: (open) => !open && setWireDeleteTarget(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-[420px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Delete Wire" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Would you like to delete this wire?" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setWireDeleteTarget(null), children: "No" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "destructive", onClick: confirmDeleteWire, children: "Yes" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: Boolean(pageDeleteTarget), onOpenChange: (open) => !open && setPageDeleteTarget(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-[420px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Delete Page" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { children: [
          'Would you like to delete page "',
          pageDeleteTarget == null ? void 0 : pageDeleteTarget.name,
          '"?'
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setPageDeleteTarget(null), children: "No" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "destructive", onClick: confirmDeletePage, children: "Yes" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        ref: nodeRedInputRef,
        type: "file",
        accept: ".json,application/json",
        className: "hidden",
        onChange: handleNodeRedImport
      }
    )
  ] });
};
function CanvasStudio() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ReactFlowProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CanvasStudioInner, {}) });
}
function ControlPanelPage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { currentSuite: "os", pageTitle: "Control Panel", fullWidth: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CanvasStudio, {}) });
}
const equipmentRoleDefs = [
  {
    id: "hlt_vessel",
    label: "HLT Vessel",
    description: "Primary hot liquor tank used for strike/heating water.",
    preferredTypes: ["vessel"]
  },
  {
    id: "mash_tun_vessel",
    label: "Mash Tun Vessel",
    description: "Main mash vessel for mash steps.",
    preferredTypes: ["vessel"]
  },
  {
    id: "boil_kettle_vessel",
    label: "Boil Kettle Vessel",
    description: "Primary kettle for boil stages.",
    preferredTypes: ["vessel"]
  },
  {
    id: "fermenter_primary",
    label: "Primary Fermenter",
    description: "Primary fermentation vessel.",
    preferredTypes: ["vessel"]
  },
  {
    id: "heat_source_primary",
    label: "Primary Heat Source",
    description: "Heater/PID output used for recipe temperature control.",
    preferredTypes: ["heater", "pid"]
  },
  {
    id: "transfer_pump_primary",
    label: "Primary Transfer Pump",
    description: "Main transfer pump used in recipe steps.",
    preferredTypes: ["pump"]
  },
  {
    id: "glycol_pump",
    label: "Glycol Pump",
    description: "Pump used for cooling loops.",
    preferredTypes: ["pump", "glycol_controller"]
  },
  {
    id: "glycol_supply_valve",
    label: "Glycol Supply Valve",
    description: "Valve controlling glycol flow to jackets/zones.",
    preferredTypes: ["valve"]
  },
  {
    id: "temp_sensor_mash",
    label: "Mash Temperature Sensor",
    description: "Primary mash temperature feedback sensor.",
    preferredTypes: ["sensor"]
  },
  {
    id: "temp_sensor_fermenter",
    label: "Fermenter Temperature Sensor",
    description: "Primary fermentation temperature feedback sensor.",
    preferredTypes: ["sensor"]
  }
];
const statusTone = {
  running: "default",
  paused: "secondary",
  waiting_confirm: "outline",
  completed: "secondary",
  failed: "destructive",
  canceled: "outline"
};
const preflightTone = {
  compatible: "secondary",
  needs_override: "outline",
  incompatible: "destructive"
};
const toNumberOrNull = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};
const formatDurationClock = (seconds) => {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total % 3600 / 60);
  const remainingSeconds = total % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};
const stepIsTransferGate$1 = (step) => {
  if (!step) return false;
  const text = `${step.name ?? ""} ${step.stage ?? ""} ${step.action ?? ""} ${step.triggerWhen ?? ""}`.trim().toLowerCase();
  return text.includes("transfer");
};
const inferTransferRouteKey$1 = (step) => {
  if (!step) return null;
  const text = `${step.name ?? ""} ${step.stage ?? ""} ${step.action ?? ""} ${step.triggerWhen ?? ""}`.trim().toLowerCase();
  if (text.includes("packag") || text.includes("keg") || text.includes("bottle")) {
    return "bright_to_packaging";
  }
  if (text.includes("bright") || text.includes("conditioning") || text.includes("brite")) {
    return "fermenter_to_bright";
  }
  if (text.includes("ferment") || text.includes("transfer_complete") || text.includes("chill")) {
    return "kettle_to_fermenter";
  }
  if (text.includes("boil") || text.includes("kettle")) {
    return "mash_to_kettle";
  }
  if (text.includes("mash") || text.includes("hlt")) {
    return "hlt_to_mash";
  }
  return null;
};
const patchStep = async (runId, stepId, patch) => {
  await fetch(`/api/os/recipes/run/${runId}/steps/${stepId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch)
  });
};
function RecipeExecutionPage() {
  var _a, _b, _c;
  const navigate = useNavigate();
  const [recipes, setRecipes] = reactExports.useState([]);
  const [runs, setRuns] = reactExports.useState([]);
  const [selectedRecipeId, setSelectedRecipeId] = reactExports.useState("");
  const [executionMode, setExecutionMode] = reactExports.useState("automated");
  const [activeRunId, setActiveRunId] = reactExports.useState("");
  const [inboxStatus, setInboxStatus] = reactExports.useState(null);
  const [preflight, setPreflight] = reactExports.useState(null);
  const [equipmentMap, setEquipmentMap] = reactExports.useState(null);
  const [equipmentMapOptions, setEquipmentMapOptions] = reactExports.useState([]);
  const [equipmentMapSource, setEquipmentMapSource] = reactExports.useState("all_pages");
  const [equipmentMapOpen, setEquipmentMapOpen] = reactExports.useState(false);
  const [roleDraft, setRoleDraft] = reactExports.useState({});
  const [transferMap, setTransferMap] = reactExports.useState(null);
  const [transferRouteDefs, setTransferRouteDefs] = reactExports.useState([]);
  const [transferOptions, setTransferOptions] = reactExports.useState([]);
  const [transferMapSource, setTransferMapSource] = reactExports.useState("all_pages");
  const [transferMapOpen, setTransferMapOpen] = reactExports.useState(false);
  const [transferDraft, setTransferDraft] = reactExports.useState({});
  const [statusMessage, setStatusMessage] = reactExports.useState("Loading recipe execution data...");
  const [busy, setBusy] = reactExports.useState(false);
  const [nowMs, setNowMs] = reactExports.useState(() => Date.now());
  const importInputRef = reactExports.useRef(null);
  const loadRecipes = reactExports.useCallback(async () => {
    const response = await fetch("/api/os/recipes");
    const payload = await response.json().catch(() => null);
    if (!response.ok || !(payload == null ? void 0 : payload.success)) {
      throw new Error((payload == null ? void 0 : payload.error) ?? "Failed to load recipes");
    }
    const nextRecipes = payload.data ?? [];
    setRecipes(nextRecipes);
    if (!selectedRecipeId && nextRecipes.length > 0) {
      setSelectedRecipeId(nextRecipes[0].id);
    }
  }, [selectedRecipeId]);
  const loadRuns = reactExports.useCallback(async () => {
    const response = await fetch("/api/os/recipes/runs");
    const payload = await response.json().catch(() => null);
    if (!response.ok || !(payload == null ? void 0 : payload.success)) {
      throw new Error((payload == null ? void 0 : payload.error) ?? "Failed to load recipe runs");
    }
    const nextRuns = payload.data ?? [];
    setRuns(nextRuns);
    if (nextRuns.length === 0) {
      setActiveRunId("");
      return;
    }
    const running = nextRuns.find((run) => run.status === "running" || run.status === "waiting_confirm" || run.status === "paused");
    if (running) {
      setActiveRunId(running.runId);
      return;
    }
    if (activeRunId && !nextRuns.some((run) => run.runId === activeRunId)) {
      setActiveRunId(nextRuns[0].runId);
      return;
    }
    if (!activeRunId) {
      setActiveRunId(nextRuns[0].runId);
    }
  }, [activeRunId]);
  const loadInboxStatus = reactExports.useCallback(async () => {
    const response = await fetch("/api/os/recipes/inbox/status");
    const payload = await response.json().catch(() => null);
    if (!response.ok || !(payload == null ? void 0 : payload.success)) {
      throw new Error((payload == null ? void 0 : payload.error) ?? "Failed to load inbox status");
    }
    setInboxStatus(payload.data);
  }, []);
  const loadEquipmentMap = reactExports.useCallback(async () => {
    var _a2;
    const response = await fetch("/api/os/recipes/equipment-map");
    const payload = await response.json().catch(() => null);
    if (!response.ok || !(payload == null ? void 0 : payload.success)) {
      throw new Error((payload == null ? void 0 : payload.error) ?? "Failed to load equipment role map");
    }
    const data = payload.data;
    setEquipmentMap(data.map);
    setEquipmentMapOptions(data.options ?? []);
    setEquipmentMapSource(data.source ?? "all_pages");
    setRoleDraft(((_a2 = data.map) == null ? void 0 : _a2.roles) ?? {});
  }, []);
  const loadTransferMap = reactExports.useCallback(async () => {
    var _a2;
    const response = await fetch("/api/os/recipes/transfer-map");
    const payload = await response.json().catch(() => null);
    if (!response.ok || !(payload == null ? void 0 : payload.success)) {
      throw new Error((payload == null ? void 0 : payload.error) ?? "Failed to load transfer route map");
    }
    const data = payload.data;
    setTransferMap(data.map);
    setTransferRouteDefs(data.routeDefs ?? []);
    setTransferOptions(data.options ?? []);
    setTransferMapSource(data.source ?? "all_pages");
    setTransferDraft(
      Object.keys(((_a2 = data.map) == null ? void 0 : _a2.routes) ?? {}).length > 0 ? data.map.routes ?? {} : data.suggestedRoutes ?? {}
    );
  }, []);
  const loadPreflight = reactExports.useCallback(async (recipeId) => {
    const response = await fetch("/api/os/recipes/preflight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !(payload == null ? void 0 : payload.success)) {
      throw new Error((payload == null ? void 0 : payload.error) ?? "Failed to evaluate recipe compatibility");
    }
    setPreflight(payload.data);
  }, []);
  const refresh = reactExports.useCallback(async () => {
    try {
      await Promise.all([
        loadRecipes(),
        loadRuns(),
        loadInboxStatus(),
        loadEquipmentMap(),
        loadTransferMap()
      ]);
      if (selectedRecipeId) {
        await loadPreflight(selectedRecipeId);
      }
      setStatusMessage("Recipe execution data refreshed.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Refresh failed.");
    }
  }, [
    loadEquipmentMap,
    loadInboxStatus,
    loadPreflight,
    loadRecipes,
    loadRuns,
    loadTransferMap,
    selectedRecipeId
  ]);
  reactExports.useEffect(() => {
    void refresh();
  }, [refresh]);
  reactExports.useEffect(() => {
    const interval = window.setInterval(() => {
      void Promise.all([loadRuns(), loadInboxStatus()]).catch(() => void 0);
    }, 2e3);
    return () => window.clearInterval(interval);
  }, [loadInboxStatus, loadRuns]);
  reactExports.useEffect(() => {
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1e3);
    return () => window.clearInterval(interval);
  }, []);
  reactExports.useEffect(() => {
    if (!selectedRecipeId) {
      setPreflight(null);
      return;
    }
    void loadPreflight(selectedRecipeId).catch((error) => {
      setPreflight(null);
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to evaluate recipe compatibility."
      );
    });
  }, [loadPreflight, selectedRecipeId]);
  const activeRun = reactExports.useMemo(
    () => runs.find((run) => run.runId === activeRunId) ?? runs[0] ?? null,
    [activeRunId, runs]
  );
  reactExports.useEffect(() => {
    if (!activeRun) return;
    if (activeRun.status !== "running" && activeRun.status !== "waiting_confirm") return;
    const interval = window.setInterval(() => {
      void fetch(`/api/os/recipes/run/${activeRun.runId}/readings/snapshot`, {
        method: "POST"
      }).catch(() => void 0);
    }, 15e3);
    return () => window.clearInterval(interval);
  }, [activeRun]);
  const currentStep = reactExports.useMemo(() => {
    if (!activeRun) return null;
    if (activeRun.currentStepIndex < 0 || activeRun.currentStepIndex >= activeRun.steps.length) {
      return null;
    }
    return activeRun.steps[activeRun.currentStepIndex];
  }, [activeRun]);
  const currentStepRemainingSeconds = reactExports.useMemo(() => {
    if (!currentStep) return null;
    const durationMin = Number(currentStep.durationMin);
    if (!Number.isFinite(durationMin) || durationMin <= 0) return null;
    const startedMs = currentStep.startedAt ? Date.parse(currentStep.startedAt) : NaN;
    if (!Number.isFinite(startedMs)) return null;
    const elapsedSeconds = Math.max(0, Math.floor((nowMs - startedMs) / 1e3));
    const totalSeconds = Math.floor(durationMin * 60);
    return Math.max(0, totalSeconds - elapsedSeconds);
  }, [currentStep, nowMs]);
  const currentStepIsTransferGate = reactExports.useMemo(
    () => stepIsTransferGate$1(currentStep),
    [currentStep]
  );
  const currentTransferRouteKey = reactExports.useMemo(
    () => inferTransferRouteKey$1(currentStep),
    [currentStep]
  );
  const currentTransferRouteConfig = reactExports.useMemo(() => {
    if (!currentTransferRouteKey || !(transferMap == null ? void 0 : transferMap.routes)) return null;
    return transferMap.routes[currentTransferRouteKey] ?? null;
  }, [currentTransferRouteKey, transferMap]);
  const transferControllerOptions = reactExports.useMemo(
    () => transferOptions.filter((option) => option.type === "transfer_controller"),
    [transferOptions]
  );
  const transferPumpOptions = reactExports.useMemo(
    () => transferOptions.filter((option) => option.type === "pump"),
    [transferOptions]
  );
  const transferValveOptions = reactExports.useMemo(
    () => transferOptions.filter((option) => option.type === "valve"),
    [transferOptions]
  );
  const startRun = async (params) => {
    if (!selectedRecipeId) return;
    const mode = (params == null ? void 0 : params.mode) ?? executionMode;
    const allowManualOverride = (params == null ? void 0 : params.allowManualOverride) === true;
    setBusy(true);
    try {
      const response = await fetch("/api/os/recipes/run/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId: selectedRecipeId,
          allowManualOverride,
          executionMode: mode
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !(payload == null ? void 0 : payload.success)) {
        if (payload == null ? void 0 : payload.preflight) {
          setPreflight(payload.preflight);
        }
        throw new Error((payload == null ? void 0 : payload.error) ?? "Failed to start recipe run");
      }
      if (payload == null ? void 0 : payload.preflight) {
        setPreflight(payload.preflight);
      }
      const run = payload.data;
      setActiveRunId(run.runId);
      await loadRuns();
      setStatusMessage(
        `Started ${run.executionMode ?? mode} recipe run: ${run.recipeName}`
      );
      navigate(`/os/brewday/${encodeURIComponent(run.runId)}`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to start recipe run.");
    } finally {
      setBusy(false);
    }
  };
  const runAction = async (action) => {
    if (!activeRun) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/os/recipes/run/${activeRun.runId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !(payload == null ? void 0 : payload.success)) {
        throw new Error((payload == null ? void 0 : payload.error) ?? "Recipe action failed");
      }
      await loadRuns();
      setStatusMessage(`Run action executed: ${action}`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Run action failed.");
    } finally {
      setBusy(false);
    }
  };
  const executeTransferRoute = async (action, armConfirmed = false) => {
    if (!activeRun || !currentStepIsTransferGate) {
      setStatusMessage("Current step is not a transfer step.");
      return false;
    }
    if (!currentTransferRouteKey) {
      setStatusMessage("Transfer route could not be inferred for current step.");
      return false;
    }
    try {
      const response = await fetch(`/api/os/recipes/run/${activeRun.runId}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          routeKey: currentTransferRouteKey,
          armConfirmed
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !(payload == null ? void 0 : payload.success)) {
        if (payload == null ? void 0 : payload.requiresArmConfirm) {
          const confirmed = window.confirm(
            "Packaging transfer safety check: confirm line is connected and ready before arming transfer."
          );
          if (confirmed) {
            return executeTransferRoute(action, true);
          }
        }
        throw new Error((payload == null ? void 0 : payload.error) ?? "Transfer route action failed");
      }
      await loadTransferMap();
      if (action === "start") {
        setStatusMessage(`Transfer route started: ${currentTransferRouteKey.replaceAll("_", " ")}`);
      } else {
        setStatusMessage(`Transfer route completed: ${currentTransferRouteKey.replaceAll("_", " ")}`);
      }
      return true;
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Transfer route action failed.");
      return false;
    }
  };
  const runTransfer = async () => {
    setBusy(true);
    try {
      await executeTransferRoute("start");
    } finally {
      setBusy(false);
    }
  };
  const confirmTransfer = async () => {
    if (!activeRun) return;
    setBusy(true);
    try {
      await executeTransferRoute("complete");
      const response = await fetch(`/api/os/recipes/run/${activeRun.runId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm" })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !(payload == null ? void 0 : payload.success)) {
        throw new Error((payload == null ? void 0 : payload.error) ?? "Failed to confirm transfer step");
      }
      await loadRuns();
      setStatusMessage("Transfer confirmed and recipe advanced.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Transfer confirmation failed.");
    } finally {
      setBusy(false);
    }
  };
  const confirmManualTransfer = async () => {
    if (!activeRun || !currentStepIsTransferGate) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/os/recipes/run/${activeRun.runId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm" })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !(payload == null ? void 0 : payload.success)) {
        throw new Error((payload == null ? void 0 : payload.error) ?? "Failed to confirm manual transfer step");
      }
      await loadRuns();
      setStatusMessage("Manual transfer confirmed and recipe advanced.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Manual transfer confirmation failed."
      );
    } finally {
      setBusy(false);
    }
  };
  const scanInbox = async () => {
    var _a2, _b2;
    setBusy(true);
    try {
      const response = await fetch("/api/os/recipes/inbox/scan", {
        method: "POST"
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !(payload == null ? void 0 : payload.success)) {
        throw new Error((payload == null ? void 0 : payload.error) ?? "Inbox scan failed");
      }
      await refresh();
      const scanned = ((_a2 = payload.data) == null ? void 0 : _a2.filesSeen) ?? 0;
      const ingested = ((_b2 = payload.data) == null ? void 0 : _b2.ingested) ?? 0;
      setStatusMessage(`Inbox scan complete. Files: ${scanned}, ingested: ${ingested}.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Inbox scan failed.");
    } finally {
      setBusy(false);
    }
  };
  const resetRunHistory = async () => {
    if (!window.confirm("Clear recipe run history and release recipe-run inventory reservations?")) {
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/os/recipes/runs/reset", {
        method: "POST"
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !(payload == null ? void 0 : payload.success)) {
        throw new Error((payload == null ? void 0 : payload.error) ?? "Failed to reset recipe run history");
      }
      await refresh();
      const summary = payload.data;
      setStatusMessage(
        `Run history reset. Cleared runs: ${(summary == null ? void 0 : summary.clearedRuns) ?? 0}. Released qty: ${(summary == null ? void 0 : summary.releasedQty) ?? 0}.`
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to reset recipe run history."
      );
    } finally {
      setBusy(false);
    }
  };
  const importRecipeFile = async (event) => {
    var _a2, _b2;
    const file = (_a2 = event.target.files) == null ? void 0 : _a2[0];
    if (!file) return;
    setBusy(true);
    try {
      const content = await file.text();
      const response = await fetch("/api/os/recipes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          content
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !(payload == null ? void 0 : payload.success)) {
        throw new Error((payload == null ? void 0 : payload.error) ?? "Recipe import failed");
      }
      await refresh();
      setStatusMessage(`Imported recipe: ${((_b2 = payload.data) == null ? void 0 : _b2.name) ?? file.name}`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Recipe import failed.");
    } finally {
      event.target.value = "";
      setBusy(false);
    }
  };
  const openEquipmentMap = () => {
    setRoleDraft((equipmentMap == null ? void 0 : equipmentMap.roles) ?? {});
    setEquipmentMapOpen(true);
  };
  const openTransferMap = () => {
    setTransferDraft((transferMap == null ? void 0 : transferMap.routes) ?? {});
    setTransferMapOpen(true);
  };
  const updateRoleDraft = (role, value) => {
    setRoleDraft((prev) => ({
      ...prev,
      [role]: value
    }));
  };
  const updateTransferDraft = (routeKey, patch) => {
    setTransferDraft((prev) => ({
      ...prev,
      [routeKey]: {
        ...prev[routeKey] ?? {},
        ...patch
      }
    }));
  };
  const saveEquipmentMap = async () => {
    setBusy(true);
    try {
      const roles = equipmentRoleDefs.reduce(
        (acc, definition) => {
          const value = roleDraft[definition.id];
          acc[definition.id] = value && value !== "__none" ? value : null;
          return acc;
        },
        {}
      );
      const response = await fetch("/api/os/recipes/equipment-map", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !(payload == null ? void 0 : payload.success)) {
        throw new Error((payload == null ? void 0 : payload.error) ?? "Failed to save equipment role map");
      }
      await loadEquipmentMap();
      if (selectedRecipeId) {
        await loadPreflight(selectedRecipeId);
      }
      setEquipmentMapOpen(false);
      setStatusMessage("Equipment role map saved.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to save equipment role map."
      );
    } finally {
      setBusy(false);
    }
  };
  const autoFillTransferMap = async () => {
    var _a2;
    setBusy(true);
    try {
      const response = await fetch("/api/os/recipes/transfer-map/autofill", {
        method: "POST"
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !(payload == null ? void 0 : payload.success)) {
        throw new Error((payload == null ? void 0 : payload.error) ?? "Failed to auto-build transfer route profile");
      }
      await loadTransferMap();
      setTransferDraft(((_a2 = payload.data) == null ? void 0 : _a2.routes) ?? {});
      setStatusMessage("Transfer route profile auto-built from current canvas.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to auto-build transfer route profile."
      );
    } finally {
      setBusy(false);
    }
  };
  const saveTransferMap = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/os/recipes/transfer-map", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routes: transferDraft })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !(payload == null ? void 0 : payload.success)) {
        throw new Error((payload == null ? void 0 : payload.error) ?? "Failed to save transfer route profile");
      }
      await loadTransferMap();
      setTransferMapOpen(false);
      setStatusMessage("Transfer route profile saved.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to save transfer route profile."
      );
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { currentSuite: "os", pageTitle: "Recipe Execution", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "Recipe Execution" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Brewer-focused run interface. Canvas remains the system definition source." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            className: "gap-2",
            onClick: () => navigate(
              activeRunId ? `/os/brewday/${encodeURIComponent(activeRunId)}` : "/os/brewday"
            ),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Beaker, { className: "h-4 w-4" }),
              "Open Brewday Runboard"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "gap-2", onClick: () => navigate("/os/control-panel"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Gauge, { className: "h-4 w-4" }),
          "Open Control Panel"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "gap-2", onClick: () => {
          var _a2;
          return (_a2 = importInputRef.current) == null ? void 0 : _a2.click();
        }, disabled: busy, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-4 w-4" }),
          "Import Recipe File"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "gap-2", onClick: scanInbox, disabled: busy, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-4 w-4" }),
          "Scan Inbox"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "gap-2", onClick: () => void refresh(), disabled: busy, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCcw, { className: "h-4 w-4" }),
          "Refresh"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "gap-2", onClick: resetRunHistory, disabled: busy, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }),
          "Clear Run Log"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Inbox Status" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Filesystem queue watcher for LAB recipe handoff." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "grid grid-cols-1 md:grid-cols-5 gap-3 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Watcher" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: (inboxStatus == null ? void 0 : inboxStatus.started) ? "Running" : "Stopped" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Active Inbox" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-xs break-all", children: (inboxStatus == null ? void 0 : inboxStatus.activeInboxDir) ?? "--" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Fallback Mode" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: (inboxStatus == null ? void 0 : inboxStatus.usingFallbackInbox) ? "Yes" : "No" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Last Scan" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: ((_a = inboxStatus == null ? void 0 : inboxStatus.lastScan) == null ? void 0 : _a.scannedAt) ?? "--" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Last Counts" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: (inboxStatus == null ? void 0 : inboxStatus.lastScan) ? `files ${inboxStatus.lastScan.filesSeen} / in ${inboxStatus.lastScan.ingested} / rej ${inboxStatus.lastScan.rejected}` : "--" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "lg:col-span-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Run Setup" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Select an imported recipe, review compatibility, then start execution." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Recipe" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: selectedRecipeId, onValueChange: setSelectedRecipeId, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select recipe" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: recipes.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", disabled: true, children: "No recipes imported" }) : recipes.map((recipe) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: recipe.id, children: [
                recipe.name,
                " (",
                recipe.steps.length,
                " steps)"
              ] }, recipe.id)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Execution Mode" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: executionMode,
                onValueChange: (value) => setExecutionMode(value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select execution mode" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "automated", children: "Automated (Canvas + hardware)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "hybrid", children: "Hybrid (automation + manual handoffs)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "manual", children: "Manual (operator-driven brewday)" })
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: executionMode === "manual" ? "Manual mode runs recipe steps without target-device dispatch and supports manual transfer/readings." : executionMode === "hybrid" ? "Hybrid mode keeps automation targets but allows manual overrides during execution." : "Automated mode expects commissioned controls from canvas and role mappings." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              className: "w-full gap-2",
              onClick: () => void startRun({ allowManualOverride: false }),
              disabled: busy || !selectedRecipeId || recipes.length === 0 || (preflight == null ? void 0 : preflight.status) !== "compatible",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-4 w-4" }),
                "Start Recipe Run"
              ]
            }
          ),
          ((preflight == null ? void 0 : preflight.status) === "needs_override" || executionMode === "manual" && (preflight == null ? void 0 : preflight.status) === "incompatible") && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              className: "w-full gap-2",
              onClick: () => void startRun({
                allowManualOverride: true
              }),
              disabled: busy || !selectedRecipeId || recipes.length === 0,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-4 w-4" }),
                executionMode === "manual" && (preflight == null ? void 0 : preflight.status) === "incompatible" ? "Start Manual Run (Override Required)" : "Start With Manual Override"
              ]
            }
          ),
          preflight ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border border-border p-3 space-y-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: "Compatibility Check" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: preflightTone[preflight.status], children: preflight.status.replaceAll("_", " ") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: openEquipmentMap, disabled: busy, children: "Resolve Equipment Roles" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: openTransferMap, disabled: busy, children: "Transfer Routes" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
              "Stages: ",
              preflight.inferredStages.length > 0 ? preflight.inferredStages.join(", ") : "none detected"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
              "Equipment scope: ",
              preflight.equipment.source === "published_pages" ? "Published pages" : "Draft fallback",
              " • nodes ",
              preflight.equipment.nodeCount
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
              "Role mappings: ",
              Object.keys(preflight.roleMappings ?? {}).length
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
              "Inventory checks: ",
              ((_b = preflight.inventoryChecks) == null ? void 0 : _b.length) ?? 0
            ] }),
            preflight.blockers.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded border border-red-200 bg-red-50 p-2 text-xs text-red-800 space-y-1", children: preflight.blockers.slice(0, 4).map((issue, index2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
              "• ",
              issue
            ] }, `preflight-blocker-${index2}`)) }),
            preflight.warnings.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 space-y-1", children: preflight.warnings.slice(0, 4).map((issue, index2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
              "• ",
              issue
            ] }, `preflight-warning-${index2}`)) }),
            (((_c = preflight.inventoryChecks) == null ? void 0 : _c.length) ?? 0) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded border border-border p-2 text-xs space-y-1", children: preflight.inventoryChecks.slice(0, 4).map((check, index2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground", children: [
              check.status === "missing" ? "Missing" : check.status === "low" ? "Low" : "OK",
              ": ",
              check.requirementName,
              check.matchedItemName ? ` -> ${check.matchedItemName}` : ""
            ] }, `inventory-check-${index2}`)) })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Compatibility check will run when a recipe is selected." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "lg:col-span-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Active Run" }),
            activeRun ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: String(activeRun.executionMode ?? "automated") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: statusTone[activeRun.status], children: activeRun.status.replaceAll("_", " ") })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: "No Run" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: activeRun ? `${activeRun.recipeName} • ${activeRun.steps.length} steps` : "Start a recipe to begin execution." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3", children: activeRun ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-7 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "gap-2", onClick: () => void runAction(activeRun.status === "paused" ? "resume" : "pause"), disabled: busy, children: [
              activeRun.status === "paused" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Pause, { className: "h-4 w-4" }),
              activeRun.status === "paused" ? "Resume" : "Pause"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "gap-2", onClick: () => void runAction("confirm"), disabled: busy || activeRun.status !== "waiting_confirm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4" }),
              "Confirm Step"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "gap-2", onClick: () => void runAction("next"), disabled: busy, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SkipForward, { className: "h-4 w-4" }),
              "Next Step"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "destructive", className: "gap-2", onClick: () => void runAction("stop"), disabled: busy, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleStop, { className: "h-4 w-4" }),
              "Stop Run"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                className: "gap-2",
                onClick: runTransfer,
                disabled: busy || !currentStepIsTransferGate,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRightLeft, { className: "h-4 w-4" }),
                  "Run Transfer"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                className: "gap-2",
                onClick: confirmTransfer,
                disabled: busy || !currentStepIsTransferGate || activeRun.status !== "waiting_confirm",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRightLeft, { className: "h-4 w-4" }),
                  "Confirm Transfer"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                className: "gap-2",
                onClick: confirmManualTransfer,
                disabled: busy || !currentStepIsTransferGate || activeRun.status !== "waiting_confirm",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4" }),
                  "Manual Transfer Done"
                ]
              }
            )
          ] }),
          currentStep ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border border-border p-3 space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-medium", children: [
                "Step ",
                activeRun.currentStepIndex + 1,
                ": ",
                currentStep.name
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: currentStep.status.replaceAll("_", " ") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: currentStep.message ?? "Adjust variables as needed, then confirm/next." }),
            currentStepRemainingSeconds !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border border-border/70 bg-muted/30 px-3 py-2 text-xs flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Timer, { className: "h-3.5 w-3.5" }),
                "Current Step Timer"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-semibold", children: formatDurationClock(currentStepRemainingSeconds) })
            ] }),
            currentStepIsTransferGate && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-center justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "Transfer step detected. Use `Run Transfer` for mapped automation, then `Confirm Transfer`, or use `Manual Transfer Done` if transfer is operator-managed.",
                currentTransferRouteConfig ? ` Pump: ${currentTransferRouteConfig.pumpRef ?? "none"}` : " Route profile not configured."
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "text-[10px]", children: [
                "Route: ",
                currentTransferRouteKey ? currentTransferRouteKey.replaceAll("_", " ") : "unresolved"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Duration (min)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "number",
                    value: String(currentStep.durationMin ?? ""),
                    onBlur: (event) => void patchStep(
                      activeRun.runId,
                      currentStep.id,
                      { durationMin: toNumberOrNull(event.target.value) }
                    ).then(loadRuns)
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Target Temp (C)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "number",
                    value: String(currentStep.temperatureC ?? ""),
                    onBlur: (event) => void patchStep(
                      activeRun.runId,
                      currentStep.id,
                      { temperatureC: toNumberOrNull(event.target.value) }
                    ).then(loadRuns)
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Target Device" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    value: String(currentStep.targetDeviceId ?? ""),
                    onBlur: (event) => void patchStep(
                      activeRun.runId,
                      currentStep.id,
                      { targetDeviceId: event.target.value || null }
                    ).then(loadRuns)
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Value" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    value: String(currentStep.value ?? ""),
                    onBlur: (event) => void patchStep(
                      activeRun.runId,
                      currentStep.id,
                      { value: event.target.value || null }
                    ).then(loadRuns)
                  }
                )
              ] })
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No active step." })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FlaskConical, { className: "h-4 w-4" }),
          "Start a recipe run to see execution controls."
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Run History" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Recent recipe runs and progress snapshots." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: runs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No recipe runs yet." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: runs.slice(0, 8).map((run) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          className: `w-full rounded border p-3 text-left transition-colors ${(activeRun == null ? void 0 : activeRun.runId) === run.runId ? "border-primary bg-primary/5" : "border-border hover:bg-accent/10"}`,
          onClick: () => setActiveRunId(run.runId),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: run.recipeName }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: statusTone[run.status], children: run.status.replaceAll("_", " ") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
              run.steps.length,
              " steps • mode ",
              run.executionMode ?? "automated",
              " • started ",
              run.startedAt
            ] })
          ]
        },
        run.runId
      )) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-muted/40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: statusMessage }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: equipmentMapOpen, onOpenChange: setEquipmentMapOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-h-[85vh] overflow-auto sm:max-w-[760px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Equipment Role Mapping" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Assign required recipe roles to installed equipment for deterministic preflight checks." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
          "Equipment source: ",
          equipmentMapSource === "published_pages" ? "Published pages" : "Draft fallback",
          " • options ",
          equipmentMapOptions.length
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: equipmentRoleDefs.map((definition) => {
          const preferredOptions = equipmentMapOptions.filter(
            (option) => definition.preferredTypes.includes(option.type)
          );
          const selectableOptions = preferredOptions.length > 0 ? preferredOptions : equipmentMapOptions;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border border-border p-3 space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: definition.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: definition.description })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: roleDraft[definition.id] ?? "__none",
                onValueChange: (value) => updateRoleDraft(definition.id, value === "__none" ? "" : value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: busy, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Unassigned" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "Unassigned" }),
                    selectableOptions.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option.value, children: option.label }, `${definition.id}-${option.value}`))
                  ] })
                ]
              }
            )
          ] }, definition.id);
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setEquipmentMapOpen(false), disabled: busy, children: "Cancel" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => void saveEquipmentMap(), disabled: busy, children: "Save Role Mapping" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: transferMapOpen, onOpenChange: setTransferMapOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-h-[85vh] overflow-auto sm:max-w-[900px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Transfer Route Profile" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Save deterministic pump/valve routes once; recipe execution uses these for transfer steps." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
            "Source: ",
            transferMapSource === "published_pages" ? "Published pages" : "Draft fallback",
            " • options ",
            transferOptions.length
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: () => void autoFillTransferMap(),
              disabled: busy,
              className: "gap-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(WandSparkles, { className: "h-4 w-4" }),
                "Auto-Build"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: transferRouteDefs.map((route) => {
          const draft = transferDraft[route.key] ?? {};
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border border-border p-3 space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: route.label }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                  route.fromLabel,
                  " ",
                  "->",
                  " ",
                  route.toLabel
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: draft.enabled === false ? "disabled" : "enabled",
                  onValueChange: (value) => updateTransferDraft(route.key, { enabled: value === "enabled" }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-[160px]", disabled: busy, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "enabled", children: "Enabled" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "disabled", children: "Disabled" })
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Transfer Controller" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: draft.transferControllerRef ?? "__none",
                    onValueChange: (value) => updateTransferDraft(route.key, {
                      transferControllerRef: value === "__none" ? void 0 : value
                    }),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: busy, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "None" }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                        transferControllerOptions.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option.value, children: option.label }, `${route.key}-controller-${option.value}`))
                      ] })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Pump" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: draft.pumpRef ?? "__none",
                    onValueChange: (value) => updateTransferDraft(route.key, {
                      pumpRef: value === "__none" ? void 0 : value
                    }),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: busy, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select pump" }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                        transferPumpOptions.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option.value, children: option.label }, `${route.key}-pump-${option.value}`))
                      ] })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Source Valve" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: draft.sourceValveRef ?? "__none",
                    onValueChange: (value) => updateTransferDraft(route.key, {
                      sourceValveRef: value === "__none" ? void 0 : value
                    }),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: busy, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select source valve" }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                        transferValveOptions.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option.value, children: option.label }, `${route.key}-source-${option.value}`))
                      ] })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Destination Valve" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: draft.destinationValveRef ?? "__none",
                    onValueChange: (value) => updateTransferDraft(route.key, {
                      destinationValveRef: value === "__none" ? void 0 : value
                    }),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: busy, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select destination valve" }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", children: "None" }),
                        transferValveOptions.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option.value, children: option.label }, `${route.key}-dest-${option.value}`))
                      ] })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Pump Speed (%)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "number",
                    value: String(draft.speedPct ?? ""),
                    onChange: (event) => updateTransferDraft(route.key, {
                      speedPct: toNumberOrNull(event.target.value) ?? void 0
                    }),
                    disabled: busy
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Complete Behavior" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: draft.closeValvesOnComplete === false ? "leave_open" : "close",
                    onValueChange: (value) => updateTransferDraft(route.key, {
                      closeValvesOnComplete: value !== "leave_open"
                    }),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { disabled: busy, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "close", children: "Close valves on complete" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "leave_open", children: "Leave valves open" })
                      ] })
                    ]
                  }
                )
              ] })
            ] })
          ] }, route.key);
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setTransferMapOpen(false), disabled: busy, children: "Cancel" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => void saveTransferMap(), disabled: busy, children: "Save Transfer Profile" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        ref: importInputRef,
        type: "file",
        accept: ".json,.xml,.bsmx,application/json,text/xml,application/xml",
        className: "hidden",
        onChange: importRecipeFile
      }
    )
  ] }) });
}
const toNumberOrUndefined = (value) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : void 0;
};
const formatClock = (seconds) => {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total % 3600 / 60);
  const remaining = total % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
      remaining
    ).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
};
const stepIsTransferGate = (step) => {
  if (!step) return false;
  const text = `${step.name ?? ""} ${step.stage ?? ""} ${step.action ?? ""} ${step.triggerWhen ?? ""}`.trim().toLowerCase();
  return text.includes("transfer");
};
const inferTransferRouteKey = (step) => {
  if (!step) return null;
  const text = `${step.name ?? ""} ${step.stage ?? ""} ${step.action ?? ""} ${step.triggerWhen ?? ""}`.trim().toLowerCase();
  if (text.includes("packag") || text.includes("keg") || text.includes("bottle")) {
    return "bright_to_packaging";
  }
  if (text.includes("bright") || text.includes("conditioning") || text.includes("brite")) {
    return "fermenter_to_bright";
  }
  if (text.includes("ferment") || text.includes("transfer_complete") || text.includes("chill")) {
    return "kettle_to_fermenter";
  }
  if (text.includes("boil") || text.includes("kettle")) {
    return "mash_to_kettle";
  }
  if (text.includes("mash") || text.includes("hlt")) {
    return "hlt_to_mash";
  }
  return null;
};
const calculateAbv = (og, fg) => {
  if (og === void 0 || fg === void 0) return void 0;
  if (og <= fg) return 0;
  return (og - fg) * 131.25;
};
const formatNumber = (value, digits) => value === void 0 || !Number.isFinite(value) ? "--" : value.toFixed(digits);
function BrewdayRunboardPage() {
  var _a, _b;
  const navigate = useNavigate();
  const params = useParams();
  const [run, setRun] = reactExports.useState(null);
  const [profile, setProfile] = reactExports.useState(null);
  const [readings, setReadings] = reactExports.useState([]);
  const [busy, setBusy] = reactExports.useState(false);
  const [statusMessage, setStatusMessage] = reactExports.useState("Loading brewday runboard...");
  const [nowMs, setNowMs] = reactExports.useState(() => Date.now());
  const [readingDraft, setReadingDraft] = reactExports.useState({
    kind: "sg",
    temperatureC: "",
    sg: "",
    ph: "",
    abvPct: "",
    note: ""
  });
  const [profileDraft, setProfileDraft] = reactExports.useState({
    targetOg: "",
    targetFg: "",
    targetAbvPct: "",
    notes: ""
  });
  const targetRunId = params.runId ? String(params.runId).trim() : "";
  const loadRuns = reactExports.useCallback(async () => {
    const response = await fetch("/api/os/recipes/runs");
    const payload = await response.json().catch(() => null);
    if (!response.ok || !(payload == null ? void 0 : payload.success)) {
      throw new Error((payload == null ? void 0 : payload.error) ?? "Failed to load recipe runs");
    }
    const nextRuns = payload.data ?? [];
    return nextRuns;
  }, []);
  const loadRunboard = reactExports.useCallback(
    async (runId) => {
      var _a2, _b2;
      const response = await fetch(`/api/os/recipes/run/${runId}/runboard`);
      const payload = await response.json().catch(() => null);
      if (!response.ok || !(payload == null ? void 0 : payload.success)) {
        throw new Error((payload == null ? void 0 : payload.error) ?? "Failed to load runboard");
      }
      const nextRun = (_a2 = payload.data) == null ? void 0 : _a2.run;
      const nextProfile = ((_b2 = payload.data) == null ? void 0 : _b2.profile) ?? null;
      setRun(nextRun);
      setProfile(nextProfile);
      setProfileDraft({
        targetOg: (nextProfile == null ? void 0 : nextProfile.targetOg) !== void 0 ? String(nextProfile.targetOg) : "",
        targetFg: (nextProfile == null ? void 0 : nextProfile.targetFg) !== void 0 ? String(nextProfile.targetFg) : "",
        targetAbvPct: (nextProfile == null ? void 0 : nextProfile.targetAbvPct) !== void 0 ? String(nextProfile.targetAbvPct) : "",
        notes: (nextProfile == null ? void 0 : nextProfile.notes) ?? ""
      });
      return nextRun;
    },
    []
  );
  const loadReadings = reactExports.useCallback(async (runId) => {
    const response = await fetch(`/api/os/recipes/run/${runId}/readings?limit=300`);
    const payload = await response.json().catch(() => null);
    if (!response.ok || !(payload == null ? void 0 : payload.success)) {
      throw new Error((payload == null ? void 0 : payload.error) ?? "Failed to load run readings");
    }
    setReadings(payload.data ?? []);
  }, []);
  const refresh = reactExports.useCallback(async () => {
    try {
      const nextRuns = await loadRuns();
      const selected = (targetRunId ? nextRuns.find((entry) => entry.runId === targetRunId) : null) ?? nextRuns.find(
        (entry) => entry.status === "running" || entry.status === "waiting_confirm" || entry.status === "paused"
      ) ?? nextRuns[0];
      if (!selected) {
        setRun(null);
        setReadings([]);
        setStatusMessage("No recipe runs available. Start a recipe run first.");
        return;
      }
      if (!targetRunId || targetRunId !== selected.runId) {
        navigate(`/os/brewday/${encodeURIComponent(selected.runId)}`, { replace: true });
      }
      await Promise.all([loadRunboard(selected.runId), loadReadings(selected.runId)]);
      setStatusMessage("Brewday runboard updated.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to refresh runboard.");
    }
  }, [loadReadings, loadRunboard, loadRuns, navigate, targetRunId]);
  reactExports.useEffect(() => {
    void refresh();
  }, [refresh]);
  reactExports.useEffect(() => {
    const interval = window.setInterval(() => {
      void refresh();
    }, 2500);
    return () => window.clearInterval(interval);
  }, [refresh]);
  reactExports.useEffect(() => {
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1e3);
    return () => window.clearInterval(interval);
  }, []);
  reactExports.useEffect(() => {
    if (!run || run.status !== "running" && run.status !== "waiting_confirm") return;
    const interval = window.setInterval(() => {
      void fetch(`/api/os/recipes/run/${run.runId}/readings/snapshot`, {
        method: "POST"
      }).catch(() => void 0);
    }, 15e3);
    return () => window.clearInterval(interval);
  }, [run]);
  const currentStep = reactExports.useMemo(() => {
    if (!run) return null;
    if (run.currentStepIndex < 0 || run.currentStepIndex >= run.steps.length) return null;
    return run.steps[run.currentStepIndex] ?? null;
  }, [run]);
  const remainingSeconds = reactExports.useMemo(() => {
    if (!currentStep) return null;
    const durationMin = Number(currentStep.durationMin);
    if (!Number.isFinite(durationMin) || durationMin <= 0) return null;
    const startedMs = currentStep.startedAt ? Date.parse(currentStep.startedAt) : NaN;
    if (!Number.isFinite(startedMs)) return null;
    const totalSeconds = Math.floor(durationMin * 60);
    const elapsed = Math.max(0, Math.floor((nowMs - startedMs) / 1e3));
    return Math.max(0, totalSeconds - elapsed);
  }, [currentStep, nowMs]);
  const sgReadings = reactExports.useMemo(
    () => readings.filter((reading) => reading.sg !== void 0).sort((left, right) => Date.parse(left.recordedAt) - Date.parse(right.recordedAt)),
    [readings]
  );
  const ogReading = reactExports.useMemo(
    () => sgReadings.find((reading) => reading.kind === "og") ?? sgReadings[0],
    [sgReadings]
  );
  const fgReading = reactExports.useMemo(() => {
    const explicit = [...sgReadings].reverse().find((reading) => reading.kind === "fg");
    if (explicit) return explicit;
    if ((run == null ? void 0 : run.status) === "completed" || (run == null ? void 0 : run.status) === "canceled" || (run == null ? void 0 : run.status) === "failed") {
      return sgReadings[sgReadings.length - 1];
    }
    return void 0;
  }, [run == null ? void 0 : run.status, sgReadings]);
  const latestSg = sgReadings.length > 0 ? sgReadings[sgReadings.length - 1] : void 0;
  const latestTemp = reactExports.useMemo(
    () => {
      var _a2;
      return ((_a2 = readings.find((reading) => reading.temperatureC !== void 0)) == null ? void 0 : _a2.temperatureC) ?? (currentStep == null ? void 0 : currentStep.temperatureC);
    },
    [currentStep == null ? void 0 : currentStep.temperatureC, readings]
  );
  const latestPh = (_a = readings.find((reading) => reading.ph !== void 0)) == null ? void 0 : _a.ph;
  const latestAbv = (_b = readings.find((reading) => reading.abvPct !== void 0)) == null ? void 0 : _b.abvPct;
  const targetOg = profile == null ? void 0 : profile.targetOg;
  const targetFg = profile == null ? void 0 : profile.targetFg;
  const computedAbv = calculateAbv((ogReading == null ? void 0 : ogReading.sg) ?? targetOg, (fgReading == null ? void 0 : fgReading.sg) ?? targetFg) ?? calculateAbv(targetOg, targetFg);
  const targetAbv = (profile == null ? void 0 : profile.targetAbvPct) ?? calculateAbv(targetOg, targetFg);
  const currentStepTransferGate = stepIsTransferGate(currentStep);
  const currentTransferRouteKey = inferTransferRouteKey(currentStep);
  const runAction = async (action) => {
    if (!run) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/os/recipes/run/${run.runId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !(payload == null ? void 0 : payload.success)) {
        throw new Error((payload == null ? void 0 : payload.error) ?? "Run action failed");
      }
      await refresh();
      setStatusMessage(`Action complete: ${action}`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Run action failed.");
    } finally {
      setBusy(false);
    }
  };
  const runTransfer = async (action) => {
    if (!run || !currentStepTransferGate) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/os/recipes/run/${run.runId}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          routeKey: currentTransferRouteKey
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !(payload == null ? void 0 : payload.success)) {
        throw new Error((payload == null ? void 0 : payload.error) ?? "Transfer action failed");
      }
      if (action === "complete") {
        await runAction("confirm");
      } else {
        await refresh();
      }
      setStatusMessage(
        action === "start" ? "Transfer route started." : "Transfer route complete and confirmed."
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Transfer action failed.");
    } finally {
      setBusy(false);
    }
  };
  const confirmManualTransfer = async () => {
    await runAction("confirm");
    setStatusMessage("Manual transfer confirmed.");
  };
  const captureSnapshot = async () => {
    if (!run) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/os/recipes/run/${run.runId}/readings/snapshot`, {
        method: "POST"
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !(payload == null ? void 0 : payload.success)) {
        throw new Error((payload == null ? void 0 : payload.error) ?? "No sensor snapshot available");
      }
      await loadReadings(run.runId);
      setStatusMessage("Sensor snapshot recorded.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to capture snapshot.");
    } finally {
      setBusy(false);
    }
  };
  const addReading = async () => {
    if (!run) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/os/recipes/run/${run.runId}/readings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepId: currentStep == null ? void 0 : currentStep.id,
          kind: readingDraft.kind,
          source: "manual",
          temperatureC: toNumberOrUndefined(readingDraft.temperatureC),
          sg: toNumberOrUndefined(readingDraft.sg),
          ph: toNumberOrUndefined(readingDraft.ph),
          abvPct: toNumberOrUndefined(readingDraft.abvPct),
          note: readingDraft.note || void 0
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !(payload == null ? void 0 : payload.success)) {
        throw new Error((payload == null ? void 0 : payload.error) ?? "Failed to add reading");
      }
      setReadingDraft({
        kind: "sg",
        temperatureC: "",
        sg: "",
        ph: "",
        abvPct: "",
        note: ""
      });
      await loadReadings(run.runId);
      setStatusMessage("Reading added.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to add reading.");
    } finally {
      setBusy(false);
    }
  };
  const saveProfile = async () => {
    if (!run) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/os/recipes/run/${run.runId}/runboard`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetOg: toNumberOrUndefined(profileDraft.targetOg),
          targetFg: toNumberOrUndefined(profileDraft.targetFg),
          targetAbvPct: toNumberOrUndefined(profileDraft.targetAbvPct),
          notes: profileDraft.notes || null
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !(payload == null ? void 0 : payload.success)) {
        throw new Error((payload == null ? void 0 : payload.error) ?? "Failed to save brew targets");
      }
      await refresh();
      setStatusMessage("Brew targets saved.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to save brew targets.");
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { currentSuite: "os", pageTitle: "Brewday Runboard", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "Brewday Runboard" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Grain-to-keg operator workflow with manual + automated control paths." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => navigate("/os/recipe-execution"), children: "Back To Recipe Execution" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => void refresh(), disabled: busy, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCcw, { className: "h-4 w-4 mr-1" }),
          "Refresh"
        ] })
      ] })
    ] }),
    !run ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6 space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No active recipe run found." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/os/recipe-execution", children: "Start A Recipe Run" }) })
    ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Run Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: run.executionMode ?? "automated" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { children: run.status })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-2", children: run.recipeName })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "OG" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-semibold", children: formatNumber((ogReading == null ? void 0 : ogReading.sg) ?? targetOg, 3) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
            "target ",
            formatNumber(targetOg, 3)
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "FG / Current SG" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-semibold", children: (fgReading == null ? void 0 : fgReading.sg) !== void 0 ? formatNumber(fgReading.sg, 3) : (latestSg == null ? void 0 : latestSg.sg) !== void 0 ? formatNumber(latestSg.sg, 3) : "--" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
            "target ",
            formatNumber(targetFg, 3)
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "ABV" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-2xl font-semibold", children: [
            formatNumber(latestAbv ?? computedAbv, 2),
            "%"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
            "target ",
            formatNumber(targetAbv, 2) !== "--" ? `${formatNumber(targetAbv, 2)}%` : "--"
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Temp / pH" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-semibold", children: formatNumber(latestTemp, 1) !== "--" ? `${formatNumber(latestTemp, 1)}C` : "--" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
            "pH ",
            formatNumber(latestPh, 2)
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "lg:col-span-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Current Step" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { children: [
              "Step ",
              run.currentStepIndex + 1,
              " of ",
              run.steps.length
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3", children: currentStep ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: currentStep.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                  currentStep.stage ?? "--",
                  " • ",
                  currentStep.action ?? "--"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: currentStep.status })
            ] }),
            remainingSeconds !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border border-border p-2 flex items-center justify-between text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Clock3, { className: "h-4 w-4" }),
                "Step Timer"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-semibold", children: formatClock(remainingSeconds) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-6 gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  variant: "outline",
                  onClick: () => void runAction(run.status === "paused" ? "resume" : "pause"),
                  disabled: busy,
                  children: [
                    run.status === "paused" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-4 w-4 mr-1" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Pause, { className: "h-4 w-4 mr-1" }),
                    run.status === "paused" ? "Resume" : "Pause"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  variant: "outline",
                  onClick: () => void runAction("confirm"),
                  disabled: busy || run.status !== "waiting_confirm",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4 mr-1" }),
                    "Confirm"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => void runAction("next"), disabled: busy, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SkipForward, { className: "h-4 w-4 mr-1" }),
                "Next"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "destructive", onClick: () => void runAction("stop"), disabled: busy, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleStop, { className: "h-4 w-4 mr-1" }),
                "Stop"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => void captureSnapshot(), disabled: busy, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Gauge, { className: "h-4 w-4 mr-1" }),
                "Capture Sensors"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/os/control-panel", children: "Control Panel" }) })
            ] }),
            currentStepTransferGate && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                "Transfer gate detected (",
                currentTransferRouteKey ?? "unresolved",
                "). Use mapped transfer or manual confirm."
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    size: "sm",
                    variant: "outline",
                    onClick: () => void runTransfer("start"),
                    disabled: busy,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRightLeft, { className: "h-3.5 w-3.5 mr-1" }),
                      "Run Transfer"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    size: "sm",
                    variant: "outline",
                    onClick: () => void runTransfer("complete"),
                    disabled: busy,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRightLeft, { className: "h-3.5 w-3.5 mr-1" }),
                      "Confirm Transfer"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    size: "sm",
                    variant: "outline",
                    onClick: () => void confirmManualTransfer(),
                    disabled: busy,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5 mr-1" }),
                      "Manual Transfer Done"
                    ]
                  }
                )
              ] })
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No current step." }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Brew Targets" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Set expected OG/FG/ABV for batch tracking." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Target OG" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: profileDraft.targetOg,
                  onChange: (event) => setProfileDraft((prev) => ({ ...prev, targetOg: event.target.value })),
                  placeholder: "1.058"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Target FG" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: profileDraft.targetFg,
                  onChange: (event) => setProfileDraft((prev) => ({ ...prev, targetFg: event.target.value })),
                  placeholder: "1.012"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Target ABV %" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: profileDraft.targetAbvPct,
                  onChange: (event) => setProfileDraft((prev) => ({ ...prev, targetAbvPct: event.target.value })),
                  placeholder: "6.0"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Notes" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: profileDraft.notes,
                  onChange: (event) => setProfileDraft((prev) => ({ ...prev, notes: event.target.value })),
                  placeholder: "Expected high attenuation"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => void saveProfile(), disabled: busy, className: "w-full", children: "Save Targets" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Readings & Brew Log" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Record OG/FG/daily readings and capture sensor snapshots for brew records." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-6 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Reading Type" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: readingDraft.kind,
                  onValueChange: (value) => setReadingDraft((prev) => ({ ...prev, kind: value })),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "og", children: "OG" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "sg", children: "Daily SG" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "fg", children: "FG" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "temp", children: "Temperature" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "ph", children: "pH" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "abv", children: "ABV" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "note", children: "Note" })
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Temp C" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: readingDraft.temperatureC,
                  onChange: (event) => setReadingDraft((prev) => ({ ...prev, temperatureC: event.target.value })),
                  placeholder: "18.2"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "SG" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: readingDraft.sg,
                  onChange: (event) => setReadingDraft((prev) => ({ ...prev, sg: event.target.value })),
                  placeholder: "1.012"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "pH" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: readingDraft.ph,
                  onChange: (event) => setReadingDraft((prev) => ({ ...prev, ph: event.target.value })),
                  placeholder: "4.30"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "ABV %" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: readingDraft.abvPct,
                  onChange: (event) => setReadingDraft((prev) => ({ ...prev, abvPct: event.target.value })),
                  placeholder: "5.8"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Note" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: readingDraft.note,
                  onChange: (event) => setReadingDraft((prev) => ({ ...prev, note: event.target.value })),
                  placeholder: "Hydrometer @ 2:15 PM"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Readings attach to current run and step for traceability." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => void addReading(), disabled: busy, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Beaker, { className: "h-4 w-4 mr-1" }),
              "Add Reading"
            ] })
          ] }),
          readings.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No readings captured yet." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: readings.slice(0, 12).map((reading) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border border-border p-2 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: reading.kind ?? "reading" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: reading.source }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: reading.recordedAt })
              ] }),
              reading.stepId && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
                "step ",
                reading.stepId
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex flex-wrap gap-3 text-muted-foreground", children: [
              reading.temperatureC !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "Temp ",
                reading.temperatureC.toFixed(1),
                "C"
              ] }),
              reading.sg !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "SG ",
                reading.sg.toFixed(3)
              ] }),
              reading.ph !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "pH ",
                reading.ph.toFixed(2)
              ] }),
              reading.abvPct !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "ABV ",
                reading.abvPct.toFixed(2),
                "%"
              ] })
            ] }),
            reading.note && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-muted-foreground", children: reading.note })
          ] }, reading.id)) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-muted/40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: statusMessage }) }) })
  ] }) });
}
const Switch = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Root$4,
  {
    className: cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    ),
    ...props,
    ref,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Thumb,
      {
        className: cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
        )
      }
    )
  }
));
Switch.displayName = Root$4.displayName;
function AddYeastForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = reactExports.useState({
    name: "",
    itemCode: "",
    subcategory: "ale",
    trackLots: true,
    defaultUom: "pack",
    alternateUom: "gram",
    conversionFactor: 11.5,
    lastCost: 0,
    reorderPoint: 10,
    attenuationMin: 70,
    attenuationMax: 85,
    alcoholTolerance: 12,
    tempRangeMin: 15,
    tempRangeMax: 24,
    flocculation: "medium",
    fermentationSpeed: "medium",
    esterProduction: "low",
    phenolProduction: "none",
    sensoryCharacteristics: "",
    operationalNotes: ""
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Basic Information" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "name", children: "Yeast Name *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "name",
                value: formData.name,
                onChange: (e) => updateField("name", e.target.value),
                placeholder: "SafAle US-05",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "itemCode", children: "Item Code *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "itemCode",
                value: formData.itemCode,
                onChange: (e) => updateField("itemCode", e.target.value),
                placeholder: "YST-001",
                required: true
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "subcategory", children: "Subcategory" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: formData.subcategory,
                onValueChange: (value) => updateField("subcategory", value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "ale", children: "Ale Yeast" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "lager", children: "Lager Yeast" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "wine", children: "Wine Yeast" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "champagne", children: "Champagne Yeast" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "wild", children: "Wild/Brett" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 pt-8", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Switch,
              {
                id: "trackLots",
                checked: formData.trackLots,
                onCheckedChange: (checked) => updateField("trackLots", checked)
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "trackLots", children: "Track Lots" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "defaultUom", children: "Default UOM" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: formData.defaultUom,
                onValueChange: (value) => updateField("defaultUom", value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "pack", children: "Pack" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "gram", children: "Gram" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "kilogram", children: "Kilogram" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "liter", children: "Liter" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "lastCost", children: "Last Cost ($)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "lastCost",
                type: "number",
                step: "0.01",
                value: formData.lastCost,
                onChange: (e) => updateField("lastCost", parseFloat(e.target.value))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "reorderPoint", children: "Reorder Point" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "reorderPoint",
                type: "number",
                value: formData.reorderPoint,
                onChange: (e) => updateField("reorderPoint", parseInt(e.target.value))
              }
            )
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Yeast Specifications" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Attenuation Range (%)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  placeholder: "Min",
                  value: formData.attenuationMin,
                  onChange: (e) => updateField("attenuationMin", parseFloat(e.target.value))
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  placeholder: "Max",
                  value: formData.attenuationMax,
                  onChange: (e) => updateField("attenuationMax", parseFloat(e.target.value))
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "alcoholTolerance", children: "Alcohol Tolerance (%)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "alcoholTolerance",
                type: "number",
                step: "0.1",
                value: formData.alcoholTolerance,
                onChange: (e) => updateField("alcoholTolerance", parseFloat(e.target.value))
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Temperature Range (°C)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  placeholder: "Min",
                  value: formData.tempRangeMin,
                  onChange: (e) => updateField("tempRangeMin", parseFloat(e.target.value))
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  placeholder: "Max",
                  value: formData.tempRangeMax,
                  onChange: (e) => updateField("tempRangeMax", parseFloat(e.target.value))
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "flocculation", children: "Flocculation" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: formData.flocculation,
                onValueChange: (value) => updateField("flocculation", value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "low", children: "Low" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "medium", children: "Medium" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "high", children: "High" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "very-high", children: "Very High" })
                  ] })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "fermentationSpeed", children: "Fermentation Speed" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: formData.fermentationSpeed,
                onValueChange: (value) => updateField("fermentationSpeed", value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "slow", children: "Slow" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "medium", children: "Medium" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "fast", children: "Fast" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "esterProduction", children: "Ester Production" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: formData.esterProduction,
                onValueChange: (value) => updateField("esterProduction", value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "none", children: "None" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "low", children: "Low" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "medium", children: "Medium" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "high", children: "High" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "phenolProduction", children: "Phenol Production" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: formData.phenolProduction,
                onValueChange: (value) => updateField("phenolProduction", value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "none", children: "None" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "low", children: "Low" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "medium", children: "Medium" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "high", children: "High" })
                  ] })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "sensoryCharacteristics", children: "Sensory Characteristics" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              id: "sensoryCharacteristics",
              value: formData.sensoryCharacteristics,
              onChange: (e) => updateField("sensoryCharacteristics", e.target.value),
              placeholder: "Clean, neutral profile with subtle fruity esters...",
              rows: 3
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "operationalNotes", children: "Operational Notes" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              id: "operationalNotes",
              value: formData.operationalNotes,
              onChange: (e) => updateField("operationalNotes", e.target.value),
              placeholder: "Rehydrate in warm water before pitching...",
              rows: 3
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: onCancel, children: "Cancel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", children: "Add Yeast" })
    ] })
  ] });
}
function AddMaltForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = reactExports.useState({
    name: "",
    itemCode: "",
    subcategory: "base",
    trackLots: true,
    defaultUom: "pound",
    alternateUom: "kilogram",
    conversionFactor: 0.453592,
    lastCost: 0,
    reorderPoint: 50,
    ppg: 37,
    extractYield: 80,
    fermentability: 80,
    colorLovibond: 2,
    maxUsage: 100,
    bodyContribution: "medium",
    flavorNotes: "",
    maltster: "",
    origin: ""
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Basic Information" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "name", children: "Malt Name *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "name",
                value: formData.name,
                onChange: (e) => updateField("name", e.target.value),
                placeholder: "Pilsner Malt",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "itemCode", children: "Item Code *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "itemCode",
                value: formData.itemCode,
                onChange: (e) => updateField("itemCode", e.target.value),
                placeholder: "MLT-001",
                required: true
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "subcategory", children: "Subcategory" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: formData.subcategory,
                onValueChange: (value) => updateField("subcategory", value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "base", children: "Base Malt" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "crystal", children: "Crystal/Caramel" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "roasted", children: "Roasted" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "specialty", children: "Specialty" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "adjunct", children: "Adjunct Grain" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 pt-8", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Switch,
              {
                id: "trackLots",
                checked: formData.trackLots,
                onCheckedChange: (checked) => updateField("trackLots", checked)
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "trackLots", children: "Track Lots" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "defaultUom", children: "Default UOM" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: formData.defaultUom,
                onValueChange: (value) => updateField("defaultUom", value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "pound", children: "Pound" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "kilogram", children: "Kilogram" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "ounce", children: "Ounce" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "gram", children: "Gram" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "lastCost", children: "Last Cost ($)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "lastCost",
                type: "number",
                step: "0.01",
                value: formData.lastCost,
                onChange: (e) => updateField("lastCost", parseFloat(e.target.value))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "reorderPoint", children: "Reorder Point" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "reorderPoint",
                type: "number",
                value: formData.reorderPoint,
                onChange: (e) => updateField("reorderPoint", parseInt(e.target.value))
              }
            )
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Malt Specifications" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "ppg", children: "PPG (Points/Pound/Gallon)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "ppg",
                type: "number",
                step: "0.1",
                value: formData.ppg,
                onChange: (e) => updateField("ppg", parseFloat(e.target.value))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "extractYield", children: "Extract Yield (%)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "extractYield",
                type: "number",
                step: "0.1",
                value: formData.extractYield,
                onChange: (e) => updateField("extractYield", parseFloat(e.target.value))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "fermentability", children: "Fermentability (%)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "fermentability",
                type: "number",
                step: "0.1",
                value: formData.fermentability,
                onChange: (e) => updateField("fermentability", parseFloat(e.target.value))
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "colorLovibond", children: "Color (°Lovibond)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "colorLovibond",
                type: "number",
                step: "0.1",
                value: formData.colorLovibond,
                onChange: (e) => updateField("colorLovibond", parseFloat(e.target.value))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "maxUsage", children: "Max Usage (%)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "maxUsage",
                type: "number",
                value: formData.maxUsage,
                onChange: (e) => updateField("maxUsage", parseFloat(e.target.value))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "bodyContribution", children: "Body Contribution" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: formData.bodyContribution,
                onValueChange: (value) => updateField("bodyContribution", value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "light", children: "Light" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "medium", children: "Medium" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "full", children: "Full" })
                  ] })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "maltster", children: "Maltster" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "maltster",
                value: formData.maltster,
                onChange: (e) => updateField("maltster", e.target.value),
                placeholder: "Weyermann, Briess, etc."
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "origin", children: "Origin" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "origin",
                value: formData.origin,
                onChange: (e) => updateField("origin", e.target.value),
                placeholder: "Germany, USA, UK, etc."
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "flavorNotes", children: "Flavor Notes" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              id: "flavorNotes",
              value: formData.flavorNotes,
              onChange: (e) => updateField("flavorNotes", e.target.value),
              placeholder: "Bready, biscuit, sweet, toasted, caramel, chocolate, coffee...",
              rows: 3
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: onCancel, children: "Cancel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", children: "Add Malt" })
    ] })
  ] });
}
function AddHopsForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = reactExports.useState({
    name: "",
    itemCode: "",
    subcategory: "bittering",
    trackLots: true,
    defaultUom: "ounce",
    alternateUom: "gram",
    conversionFactor: 28.3495,
    lastCost: 0,
    reorderPoint: 20,
    alphaAcid: 10,
    betaAcid: 4,
    cohumulone: 30,
    totalOil: 1.5,
    myrcene: 40,
    humulene: 20,
    caryophyllene: 10,
    farnesene: 5,
    aromaDescriptors: "",
    flavorDescriptors: "",
    origin: "",
    harvestYear: (/* @__PURE__ */ new Date()).getFullYear().toString()
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Basic Information" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "name", children: "Hops Name *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "name",
                value: formData.name,
                onChange: (e) => updateField("name", e.target.value),
                placeholder: "Cascade",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "itemCode", children: "Item Code *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "itemCode",
                value: formData.itemCode,
                onChange: (e) => updateField("itemCode", e.target.value),
                placeholder: "HOP-001",
                required: true
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "subcategory", children: "Subcategory" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: formData.subcategory,
                onValueChange: (value) => updateField("subcategory", value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "bittering", children: "Bittering" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "aroma", children: "Aroma" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "dual-purpose", children: "Dual Purpose" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "noble", children: "Noble" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 pt-8", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Switch,
              {
                id: "trackLots",
                checked: formData.trackLots,
                onCheckedChange: (checked) => updateField("trackLots", checked)
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "trackLots", children: "Track Lots" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "defaultUom", children: "Default UOM" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: formData.defaultUom,
                onValueChange: (value) => updateField("defaultUom", value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "ounce", children: "Ounce" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "gram", children: "Gram" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "pound", children: "Pound" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "kilogram", children: "Kilogram" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "lastCost", children: "Last Cost ($)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "lastCost",
                type: "number",
                step: "0.01",
                value: formData.lastCost,
                onChange: (e) => updateField("lastCost", parseFloat(e.target.value))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "reorderPoint", children: "Reorder Point" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "reorderPoint",
                type: "number",
                value: formData.reorderPoint,
                onChange: (e) => updateField("reorderPoint", parseInt(e.target.value))
              }
            )
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Hops Specifications" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "alphaAcid", children: "Alpha Acid (%)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "alphaAcid",
                type: "number",
                step: "0.1",
                value: formData.alphaAcid,
                onChange: (e) => updateField("alphaAcid", parseFloat(e.target.value))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "betaAcid", children: "Beta Acid (%)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "betaAcid",
                type: "number",
                step: "0.1",
                value: formData.betaAcid,
                onChange: (e) => updateField("betaAcid", parseFloat(e.target.value))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "cohumulone", children: "Cohumulone (%)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "cohumulone",
                type: "number",
                step: "0.1",
                value: formData.cohumulone,
                onChange: (e) => updateField("cohumulone", parseFloat(e.target.value))
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "totalOil", children: "Total Oil (mL/100g)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "totalOil",
              type: "number",
              step: "0.1",
              value: formData.totalOil,
              onChange: (e) => updateField("totalOil", parseFloat(e.target.value)),
              className: "max-w-xs"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Oil Composition (% of Total Oil)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-4 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "myrcene", className: "text-sm", children: "Myrcene" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "myrcene",
                  type: "number",
                  step: "0.1",
                  value: formData.myrcene,
                  onChange: (e) => updateField("myrcene", parseFloat(e.target.value))
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "humulene", className: "text-sm", children: "Humulene" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "humulene",
                  type: "number",
                  step: "0.1",
                  value: formData.humulene,
                  onChange: (e) => updateField("humulene", parseFloat(e.target.value))
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "caryophyllene", className: "text-sm", children: "Caryophyllene" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "caryophyllene",
                  type: "number",
                  step: "0.1",
                  value: formData.caryophyllene,
                  onChange: (e) => updateField("caryophyllene", parseFloat(e.target.value))
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "farnesene", className: "text-sm", children: "Farnesene" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "farnesene",
                  type: "number",
                  step: "0.1",
                  value: formData.farnesene,
                  onChange: (e) => updateField("farnesene", parseFloat(e.target.value))
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "origin", children: "Origin" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "origin",
                value: formData.origin,
                onChange: (e) => updateField("origin", e.target.value),
                placeholder: "USA, Germany, New Zealand, etc."
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "harvestYear", children: "Harvest Year" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "harvestYear",
                value: formData.harvestYear,
                onChange: (e) => updateField("harvestYear", e.target.value),
                placeholder: "2024"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "aromaDescriptors", children: "Aroma Descriptors" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              id: "aromaDescriptors",
              value: formData.aromaDescriptors,
              onChange: (e) => updateField("aromaDescriptors", e.target.value),
              placeholder: "Citrus, floral, piney, earthy, spicy...",
              rows: 2
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "flavorDescriptors", children: "Flavor Descriptors" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              id: "flavorDescriptors",
              value: formData.flavorDescriptors,
              onChange: (e) => updateField("flavorDescriptors", e.target.value),
              placeholder: "Grapefruit, orange, pine, resin, herbal...",
              rows: 2
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: onCancel, children: "Cancel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", children: "Add Hops" })
    ] })
  ] });
}
function AddFruitForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = reactExports.useState({
    name: "",
    itemCode: "",
    subcategory: "fresh",
    trackLots: true,
    defaultUom: "pound",
    alternateUom: "kilogram",
    conversionFactor: 0.453592,
    lastCost: 0,
    reorderPoint: 25,
    sugars: 150,
    brix: 15,
    pH: 3.5,
    titratableAcidity: 6,
    malicAcid: 3,
    citricAcid: 1,
    tannins: 200,
    yan: 100,
    flavorProfile: "",
    processingNotes: "",
    origin: ""
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Basic Information" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "name", children: "Fruit/Adjunct Name *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "name",
                value: formData.name,
                onChange: (e) => updateField("name", e.target.value),
                placeholder: "Raspberry Puree",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "itemCode", children: "Item Code *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "itemCode",
                value: formData.itemCode,
                onChange: (e) => updateField("itemCode", e.target.value),
                placeholder: "FRT-001",
                required: true
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "subcategory", children: "Subcategory" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: formData.subcategory,
                onValueChange: (value) => updateField("subcategory", value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "fresh", children: "Fresh Fruit" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "puree", children: "Puree" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "juice", children: "Juice/Concentrate" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "dried", children: "Dried Fruit" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "spice", children: "Spice" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "other", children: "Other Adjunct" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 pt-8", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Switch,
              {
                id: "trackLots",
                checked: formData.trackLots,
                onCheckedChange: (checked) => updateField("trackLots", checked)
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "trackLots", children: "Track Lots" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "defaultUom", children: "Default UOM" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: formData.defaultUom,
                onValueChange: (value) => updateField("defaultUom", value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "pound", children: "Pound" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "kilogram", children: "Kilogram" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "liter", children: "Liter" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "gallon", children: "Gallon" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "ounce", children: "Ounce" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "lastCost", children: "Last Cost ($)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "lastCost",
                type: "number",
                step: "0.01",
                value: formData.lastCost,
                onChange: (e) => updateField("lastCost", parseFloat(e.target.value))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "reorderPoint", children: "Reorder Point" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "reorderPoint",
                type: "number",
                value: formData.reorderPoint,
                onChange: (e) => updateField("reorderPoint", parseInt(e.target.value))
              }
            )
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Fruit Specifications" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "sugars", children: "Sugars (g/L)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "sugars",
                type: "number",
                step: "0.1",
                value: formData.sugars,
                onChange: (e) => updateField("sugars", parseFloat(e.target.value))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "brix", children: "Brix (°Bx)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "brix",
                type: "number",
                step: "0.1",
                value: formData.brix,
                onChange: (e) => updateField("brix", parseFloat(e.target.value))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pH", children: "pH" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "pH",
                type: "number",
                step: "0.01",
                value: formData.pH,
                onChange: (e) => updateField("pH", parseFloat(e.target.value))
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "titratableAcidity", children: "Titratable Acidity (g/L)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "titratableAcidity",
                type: "number",
                step: "0.1",
                value: formData.titratableAcidity,
                onChange: (e) => updateField("titratableAcidity", parseFloat(e.target.value))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "malicAcid", children: "Malic Acid (g/L)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "malicAcid",
                type: "number",
                step: "0.1",
                value: formData.malicAcid,
                onChange: (e) => updateField("malicAcid", parseFloat(e.target.value))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "citricAcid", children: "Citric Acid (g/L)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "citricAcid",
                type: "number",
                step: "0.1",
                value: formData.citricAcid,
                onChange: (e) => updateField("citricAcid", parseFloat(e.target.value))
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "tannins", children: "Tannins (mg/L)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "tannins",
                type: "number",
                step: "1",
                value: formData.tannins,
                onChange: (e) => updateField("tannins", parseFloat(e.target.value))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "yan", children: "YAN (mg/L)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "yan",
                type: "number",
                step: "1",
                value: formData.yan,
                onChange: (e) => updateField("yan", parseFloat(e.target.value))
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "origin", children: "Origin" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "origin",
              value: formData.origin,
              onChange: (e) => updateField("origin", e.target.value),
              placeholder: "Oregon, Washington, California, etc."
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "flavorProfile", children: "Flavor Profile" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              id: "flavorProfile",
              value: formData.flavorProfile,
              onChange: (e) => updateField("flavorProfile", e.target.value),
              placeholder: "Sweet, tart, jammy, tropical, stone fruit...",
              rows: 2
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "processingNotes", children: "Processing Notes" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              id: "processingNotes",
              value: formData.processingNotes,
              onChange: (e) => updateField("processingNotes", e.target.value),
              placeholder: "Thaw before use, add during secondary fermentation...",
              rows: 2
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: onCancel, children: "Cancel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", children: "Add Fruit/Adjunct" })
    ] })
  ] });
}
function AddGenericItemForm({
  category,
  categoryLabel,
  onSubmit,
  onCancel
}) {
  const [formData, setFormData] = reactExports.useState({
    name: "",
    itemCode: "",
    category,
    subcategory: "",
    trackLots: false,
    defaultUom: "each",
    alternateUom: "",
    conversionFactor: 1,
    lastCost: 0,
    reorderPoint: 5,
    description: "",
    specifications: ""
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const getUomOptions = () => {
    if (category === "kegs") {
      return [
        { value: "each", label: "Each" },
        { value: "keg", label: "Keg" },
        { value: "barrel", label: "Barrel" }
      ];
    }
    if (category === "packaging") {
      return [
        { value: "each", label: "Each" },
        { value: "case", label: "Case" },
        { value: "pallet", label: "Pallet" }
      ];
    }
    return [
      { value: "each", label: "Each" },
      { value: "box", label: "Box" },
      { value: "case", label: "Case" }
    ];
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Basic Information" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: "name", children: [
              categoryLabel,
              " Name *"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "name",
                value: formData.name,
                onChange: (e) => updateField("name", e.target.value),
                placeholder: `Enter ${categoryLabel.toLowerCase()} name`,
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "itemCode", children: "Item Code *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "itemCode",
                value: formData.itemCode,
                onChange: (e) => updateField("itemCode", e.target.value),
                placeholder: "ITEM-001",
                required: true
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "subcategory", children: "Subcategory" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "subcategory",
                value: formData.subcategory,
                onChange: (e) => updateField("subcategory", e.target.value),
                placeholder: "Optional subcategory"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 pt-8", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Switch,
              {
                id: "trackLots",
                checked: formData.trackLots,
                onCheckedChange: (checked) => updateField("trackLots", checked)
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "trackLots", children: "Track Lots" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "description", children: "Description" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              id: "description",
              value: formData.description,
              onChange: (e) => updateField("description", e.target.value),
              placeholder: "Describe this item...",
              rows: 3
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Inventory Details" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "defaultUom", children: "Default UOM" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: formData.defaultUom,
                onValueChange: (value) => updateField("defaultUom", value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: getUomOptions().map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option.value, children: option.label }, option.value)) })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "lastCost", children: "Last Cost ($)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "lastCost",
                type: "number",
                step: "0.01",
                value: formData.lastCost,
                onChange: (e) => updateField("lastCost", parseFloat(e.target.value))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "reorderPoint", children: "Reorder Point" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "reorderPoint",
                type: "number",
                value: formData.reorderPoint,
                onChange: (e) => updateField("reorderPoint", parseInt(e.target.value))
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "specifications", children: "Specifications" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              id: "specifications",
              value: formData.specifications,
              onChange: (e) => updateField("specifications", e.target.value),
              placeholder: "Technical specifications, dimensions, materials, etc.",
              rows: 4
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: onCancel, children: "Cancel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "submit", children: [
        "Add ",
        categoryLabel
      ] })
    ] })
  ] });
}
function AddInventoryItemPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category") || "equipment";
  const categoryConfig = {
    yeast: { label: "Yeast", isIngredient: true },
    malt: { label: "Malt & Grains", isIngredient: true },
    hops: { label: "Hops", isIngredient: true },
    fruit: { label: "Fruit & Adjuncts", isIngredient: true },
    equipment: { label: "Equipment", isIngredient: false },
    packaging: { label: "Packaging", isIngredient: false },
    kegs: { label: "Kegs & Barrels", isIngredient: false }
  };
  const config = categoryConfig[category] || categoryConfig.equipment;
  const handleSubmit = async (data) => {
    try {
      const response = await fetch("/api/os/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          name: data.name ?? data.brandName ?? data.strainName ?? config.label,
          sku: data.sku ?? data.code,
          unit: data.unit ?? "units",
          onHandQty: Number(data.quantity ?? data.onHandQty ?? 0),
          reorderPointQty: Number(data.reorderPoint ?? data.minStock ?? 0),
          costPerUnit: Number(data.costPerUnit ?? data.cost ?? 0)
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !(payload == null ? void 0 : payload.success)) {
        throw new Error((payload == null ? void 0 : payload.error) ?? "Failed to save inventory item.");
      }
      navigate("/os/inventory");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save inventory item.";
      alert(message);
    }
  };
  const handleCancel = () => {
    navigate("/os/inventory");
  };
  const renderForm = () => {
    switch (category) {
      case "yeast":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(AddYeastForm, { onSubmit: handleSubmit, onCancel: handleCancel });
      case "malt":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(AddMaltForm, { onSubmit: handleSubmit, onCancel: handleCancel });
      case "hops":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(AddHopsForm, { onSubmit: handleSubmit, onCancel: handleCancel });
      case "fruit":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(AddFruitForm, { onSubmit: handleSubmit, onCancel: handleCancel });
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          AddGenericItemForm,
          {
            category,
            categoryLabel: config.label,
            onSubmit: handleSubmit,
            onCancel: handleCancel
          }
        );
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { currentSuite: "os", pageTitle: `Add ${config.label}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "ghost",
          size: "icon",
          onClick: () => navigate("/os/inventory"),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-5 w-5" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-3xl font-bold text-foreground", children: [
          "Add ",
          config.label
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: config.isIngredient ? "LAB-tracked ingredient - detailed specifications required" : "Non-ingredient inventory item" })
      ] })
    ] }),
    renderForm()
  ] }) });
}
const statusColors = {
  operational: "bg-green-100 border-green-500",
  warning: "bg-yellow-100 border-yellow-500",
  error: "bg-red-100 border-destructive",
  offline: "bg-gray-100 border-gray-400"
};
function DeviceCanvas({
  devices = [],
  onDeviceMove,
  onDeviceClick,
  className = ""
}) {
  const [zoom, setZoom] = reactExports.useState(1);
  const [showGrid, setShowGrid] = reactExports.useState(true);
  const [draggingDevice, setDraggingDevice] = reactExports.useState(null);
  const [dragOffset, setDragOffset] = reactExports.useState({ x: 0, y: 0 });
  const canvasRef = reactExports.useRef(null);
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setZoom(1);
  const handleMouseDown = reactExports.useCallback(
    (e, device) => {
      var _a;
      e.stopPropagation();
      setDraggingDevice(device.id);
      const rect = (_a = canvasRef.current) == null ? void 0 : _a.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: (e.clientX - rect.left) / zoom - device.x,
          y: (e.clientY - rect.top) / zoom - device.y
        });
      }
    },
    [zoom]
  );
  const handleMouseMove = reactExports.useCallback(
    (e) => {
      if (!draggingDevice || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.round(((e.clientX - rect.left) / zoom - dragOffset.x) / 20) * 20;
      const y = Math.round(((e.clientY - rect.top) / zoom - dragOffset.y) / 20) * 20;
      onDeviceMove == null ? void 0 : onDeviceMove(draggingDevice, x, y);
    },
    [draggingDevice, dragOffset, zoom, onDeviceMove]
  );
  const handleMouseUp = reactExports.useCallback(() => {
    setDraggingDevice(null);
  }, []);
  const drawConnection = (from, to) => {
    const fromX = from.x + 40;
    const fromY = from.y + 40;
    const toX = to.x + 40;
    const toY = to.y + 40;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: fromX,
        y1: fromY,
        x2: toX,
        y2: toY,
        stroke: "hsl(var(--foreground))",
        strokeWidth: "2",
        strokeDasharray: "5,5",
        opacity: "0.6"
      },
      `${from.id}-${to.id}`
    );
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: `relative overflow-hidden ${className}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-4 right-4 z-10 flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "outline",
          size: "icon",
          onClick: () => setShowGrid(!showGrid),
          className: "bg-card/80 backdrop-blur-sm",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Grid3x3, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "outline",
          size: "icon",
          onClick: handleZoomOut,
          className: "bg-card/80 backdrop-blur-sm",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ZoomOut, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "outline",
          size: "icon",
          onClick: handleResetZoom,
          className: "bg-card/80 backdrop-blur-sm",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Maximize2, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "outline",
          size: "icon",
          onClick: handleZoomIn,
          className: "bg-card/80 backdrop-blur-sm",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ZoomIn, { className: "h-4 w-4" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        ref: canvasRef,
        className: `relative w-full h-full min-h-[600px] overflow-auto ${showGrid ? "grid-pattern" : ""}`,
        onMouseMove: handleMouseMove,
        onMouseUp: handleMouseUp,
        onMouseLeave: handleMouseUp,
        style: {
          cursor: draggingDevice ? "grabbing" : "default"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "svg",
            {
              className: "absolute inset-0 pointer-events-none",
              style: {
                width: "100%",
                height: "100%",
                transform: `scale(${zoom})`,
                transformOrigin: "top left"
              },
              children: devices.map(
                (device) => {
                  var _a;
                  return (_a = device.connections) == null ? void 0 : _a.map((connId) => {
                    const connectedDevice = devices.find((d) => d.id === connId);
                    return connectedDevice ? drawConnection(device, connectedDevice) : null;
                  });
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              style: {
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
                width: `${100 / zoom}%`,
                height: `${100 / zoom}%`
              },
              children: devices.map((device) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: `absolute cursor-grab active:cursor-grabbing transition-shadow hover:shadow-lg ${draggingDevice === device.id ? "z-50" : "z-10"}`,
                  style: {
                    left: `${device.x}px`,
                    top: `${device.y}px`
                  },
                  onMouseDown: (e) => handleMouseDown(e, device),
                  onClick: () => onDeviceClick == null ? void 0 : onDeviceClick(device),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      className: `w-20 h-20 rounded-lg border-2 flex flex-col items-center justify-center gap-1 ${statusColors[device.status]} bg-opacity-20 backdrop-blur-sm`,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-mono font-semibold truncate w-full text-center px-1", children: device.type }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground truncate w-full text-center px-1", children: device.name }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "div",
                          {
                            className: `w-2 h-2 rounded-full ${device.status === "operational" ? "bg-green-500" : device.status === "warning" ? "bg-yellow-500" : device.status === "error" ? "bg-destructive" : "bg-gray-400"} animate-pulse`
                          }
                        )
                      ]
                    }
                  )
                },
                device.id
              ))
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute bottom-0 left-0 right-0 bg-card/80 backdrop-blur-sm border-t border-border px-4 py-2 flex items-center justify-between text-xs font-mono", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
          "Devices: ",
          devices.length
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
          "Zoom: ",
          Math.round(zoom * 100),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 rounded-full bg-green-500" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Operational" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 rounded-full bg-yellow-500" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Warning" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 rounded-full bg-destructive" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Error" })
        ] })
      ] })
    ] })
  ] });
}
const initialDevices = [
  {
    id: "dev-1",
    type: "TANK",
    name: "Tank-01",
    x: 100,
    y: 100,
    status: "operational",
    connections: ["dev-2"]
  },
  {
    id: "dev-2",
    type: "PUMP",
    name: "Pump-A",
    x: 300,
    y: 100,
    status: "operational",
    connections: ["dev-3"]
  },
  {
    id: "dev-3",
    type: "VALVE",
    name: "Valve-01",
    x: 500,
    y: 100,
    status: "warning"
  },
  {
    id: "dev-4",
    type: "SENSOR",
    name: "Temp-01",
    x: 100,
    y: 300,
    status: "operational"
  },
  {
    id: "dev-5",
    type: "TANK",
    name: "Tank-02",
    x: 300,
    y: 300,
    status: "error"
  }
];
function DevicesPage() {
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = reactExports.useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = reactExports.useState(false);
  const [devices, setDevices] = reactExports.useState(initialDevices);
  const [savedDevices, setSavedDevices] = reactExports.useState(initialDevices);
  const handleSave = () => {
    console.log("Saving device layout...", devices);
    setSavedDevices(devices);
    setHasUnsavedChanges(false);
  };
  const handleReset = () => {
    setDevices(savedDevices);
    setHasUnsavedChanges(false);
  };
  const handleDeviceMove = (deviceId, x, y) => {
    if (!isEditMode) return;
    setDevices(
      (prev) => prev.map((device) => device.id === deviceId ? { ...device, x, y } : device)
    );
    setHasUnsavedChanges(true);
  };
  const handleDeviceClick = (device) => {
    console.log("Device clicked:", device);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { currentSuite: "os", pageTitle: "Device Layout", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "Device Layout" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Configure your brewery device layout and connections" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: () => navigate("/os/control-panel"),
          className: "gap-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Gauge, { className: "h-4 w-4" }),
            "Open Control Panel",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Layout Controls" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Enable edit mode to drag devices and configure connections" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Switch,
              {
                id: "edit-mode",
                checked: isEditMode,
                onCheckedChange: setIsEditMode
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: "edit-mode", className: "cursor-pointer", children: [
              "Edit Mode ",
              isEditMode ? "(Enabled)" : "(Disabled)"
            ] })
          ] }),
          hasUnsavedChanges && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-yellow-500 flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-2 h-2 rounded-full bg-yellow-500 animate-pulse" }),
            "Unsaved changes"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              onClick: handleReset,
              disabled: !hasUnsavedChanges,
              className: "gap-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "h-4 w-4" }),
                "Reset"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: handleSave,
              disabled: !hasUnsavedChanges,
              className: "gap-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-4 w-4" }),
                "Save Layout"
              ]
            }
          )
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      DeviceCanvas,
      {
        devices,
        onDeviceMove: handleDeviceMove,
        onDeviceClick: handleDeviceClick,
        className: "h-[600px]"
      }
    ) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-muted/50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold mb-2", children: "Edit Mode" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground", children: [
          "Enable edit mode to drag devices around the canvas. ",
          isEditMode ? "You can now drag devices!" : "Currently in view-only mode."
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold mb-2", children: "Control Panel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Use the Control Panel for real-time monitoring and control of your devices during production." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold mb-2", children: "Save Changes" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Remember to save your layout changes. Unsaved changes will be lost when you navigate away." })
      ] })
    ] }) }) })
  ] }) });
}
const Table = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative w-full overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
  "table",
  {
    ref,
    className: cn("w-full caption-bottom text-sm", className),
    ...props
  }
) }));
Table.displayName = "Table";
const TableHeader = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { ref, className: cn("[&_tr]:border-b", className), ...props }));
TableHeader.displayName = "TableHeader";
const TableBody = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "tbody",
  {
    ref,
    className: cn("[&_tr:last-child]:border-0", className),
    ...props
  }
));
TableBody.displayName = "TableBody";
const TableFooter = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "tfoot",
  {
    ref,
    className: cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    ),
    ...props
  }
));
TableFooter.displayName = "TableFooter";
const TableRow = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "tr",
  {
    ref,
    className: cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    ),
    ...props
  }
));
TableRow.displayName = "TableRow";
const TableHead = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "th",
  {
    ref,
    className: cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    ),
    ...props
  }
));
TableHead.displayName = "TableHead";
const TableCell = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "td",
  {
    ref,
    className: cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className),
    ...props
  }
));
TableCell.displayName = "TableCell";
const TableCaption = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "caption",
  {
    ref,
    className: cn("mt-4 text-sm text-muted-foreground", className),
    ...props
  }
));
TableCaption.displayName = "TableCaption";
function InventoryTable({ items }) {
  const [sortField, setSortField] = reactExports.useState(null);
  const [sortDirection, setSortDirection] = reactExports.useState(null);
  const handleSort = (field) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  const getSortIcon = (field) => {
    if (sortField !== field) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpDown, { className: "h-4 w-4 ml-1 opacity-50" });
    }
    if (sortDirection === "asc") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUp, { className: "h-4 w-4 ml-1" });
    }
    if (sortDirection === "desc") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDown, { className: "h-4 w-4 ml-1" });
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpDown, { className: "h-4 w-4 ml-1 opacity-50" });
  };
  const sortedItems = [...items].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;
    let aValue = a[sortField] ?? "";
    let bValue = b[sortField] ?? "";
    if (sortField === "cost") {
      aValue = a.cost ?? 0;
      bValue = b.cost ?? 0;
    }
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          className: "h-8 px-2 font-medium",
          onClick: () => handleSort("name"),
          children: [
            "Item Name",
            getSortIcon("name")
          ]
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          className: "h-8 px-2 font-medium",
          onClick: () => handleSort("category"),
          children: [
            "Category",
            getSortIcon("category")
          ]
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          className: "h-8 px-2 font-medium",
          onClick: () => handleSort("onHandQty"),
          children: [
            "On Hand",
            getSortIcon("onHandQty")
          ]
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          className: "h-8 px-2 font-medium",
          onClick: () => handleSort("allocatedQty"),
          children: [
            "Allocated",
            getSortIcon("allocatedQty")
          ]
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Available" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          className: "h-8 px-2 font-medium",
          onClick: () => handleSort("costPerUnit"),
          children: [
            "Cost",
            getSortIcon("costPerUnit")
          ]
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Trend" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Status" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: sortedItems.map((item) => {
      const availableQty = Math.max(0, item.onHandQty - item.allocatedQty);
      const isLowStock = availableQty <= item.reorderPointQty;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        TableRow,
        {
          className: "hover:bg-muted/50 transition-colors",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium", children: item.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "capitalize", children: item.category }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "font-mono", children: [
              item.onHandQty,
              " ",
              item.unit
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "font-mono", children: [
              item.allocatedQty,
              " ",
              item.unit
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "font-mono", children: [
              availableQty,
              " ",
              item.unit
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-mono", children: item.costPerUnit ? `$${item.costPerUnit.toFixed(2)}` : "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { children: [
              item.trend === "up" && /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-4 w-4 text-green-500" }),
              item.trend === "down" && /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingDown, { className: "h-4 w-4 text-destructive" }),
              item.trend === "stable" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-sm", children: "—" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: isLowStock ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "destructive", className: "gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-3 w-3" }),
              "Low Stock"
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: "In Stock" }) })
          ]
        },
        item.id
      );
    }) })
  ] }) });
}
function InventoryManagementPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [categoryFilter, setCategoryFilter] = reactExports.useState("all");
  const [showAddItemDialog, setShowAddItemDialog] = reactExports.useState(false);
  const [items, setItems] = reactExports.useState([]);
  const [status, setStatus] = reactExports.useState("Loading inventory...");
  const categories = [
    { id: "yeast", name: "Yeast", icon: Beaker, description: "Ale, lager, wine yeast", isIngredient: true },
    { id: "malt", name: "Malt & Grain", icon: Wheat, description: "Base, specialty, adjunct", isIngredient: true },
    { id: "hops", name: "Hops", icon: Hop, description: "Bittering, aroma, dual-purpose", isIngredient: true },
    { id: "fruit", name: "Fruit & Adjuncts", icon: Apple, description: "Fruit, spices, additives", isIngredient: true },
    { id: "equipment", name: "Equipment", icon: Wrench, description: "Tools, parts, supplies", isIngredient: false },
    { id: "packaging", name: "Packaging", icon: Box, description: "Bottles, caps, labels", isIngredient: false },
    { id: "kegs", name: "Kegs & Barrels", icon: Beer, description: "Kegs, casks, barrels", isIngredient: false }
  ];
  const handleCategorySelect = (categoryId) => {
    setShowAddItemDialog(false);
    navigate(`/os/inventory/add?category=${categoryId}`);
  };
  const handleExport = () => {
    const lines = [
      "sku,name,category,on_hand,allocated,available,unit,reorder_point,cost_per_unit",
      ...items.map((item) => {
        const available = Math.max(0, item.onHandQty - item.allocatedQty);
        return [
          item.sku ?? "",
          item.name,
          item.category,
          item.onHandQty,
          item.allocatedQty,
          available,
          item.unit,
          item.reorderPointQty,
          item.costPerUnit ?? ""
        ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",");
      })
    ].join("\n");
    const blob = new Blob([lines], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleImport = () => {
    console.log("Importing inventory...");
  };
  const filteredItems = reactExports.useMemo(() => items.filter((item) => {
    const matchesSearch = searchQuery === "" || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.category.toLowerCase().includes(searchQuery.toLowerCase()) || String(item.sku ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }), [items, searchQuery, categoryFilter]);
  const totalItems = items.length;
  const lowStockItems = items.filter((item) => item.onHandQty - item.allocatedQty <= item.reorderPointQty).length;
  const totalValue = items.reduce((sum, item) => sum + (item.costPerUnit || 0) * item.onHandQty, 0);
  const onHandQty = items.reduce((sum, item) => sum + item.onHandQty, 0);
  const allocatedQty = items.reduce((sum, item) => sum + item.allocatedQty, 0);
  const availableQty = Math.max(0, onHandQty - allocatedQty);
  reactExports.useEffect(() => {
    const load = async () => {
      var _a;
      try {
        const response = await fetch("/api/os/inventory");
        const payload = await response.json().catch(() => null);
        if (!response.ok || !(payload == null ? void 0 : payload.success)) {
          throw new Error((payload == null ? void 0 : payload.error) ?? "Failed to load inventory.");
        }
        const nextItems = ((_a = payload.data) == null ? void 0 : _a.items) ?? [];
        setItems(
          nextItems.map((item) => ({
            ...item,
            trend: item.onHandQty - item.allocatedQty <= item.reorderPointQty ? "down" : "stable"
          }))
        );
        setStatus("Inventory loaded.");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to load inventory.");
      }
    };
    void load();
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { currentSuite: "os", pageTitle: "Inventory Management", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "Inventory Management" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Track and manage all brewery inventory items" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setShowAddItemDialog(true), className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
          "Add Item"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold", children: totalItems }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Total Items" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-8 w-8 text-muted-foreground" })
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold text-yellow-500", children: lowStockItems }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Low Stock Alerts" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-8 w-8 text-yellow-500" })
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xl font-bold text-green-500", children: [
              "$",
              totalValue.toFixed(0)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Total Value" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-8 w-8 text-green-500" })
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold", children: onHandQty }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "On Hand Qty" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
            "Allocated ",
            allocatedQty,
            " • Available ",
            availableQty
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold", children: filteredItems.length }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Filtered Results" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Filter, { className: "h-8 w-8 text-muted-foreground" })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Filters" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Search and filter inventory items" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                placeholder: "Search by name, code, or category...",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: "pl-10"
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full md:w-64", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: categoryFilter, onValueChange: setCategoryFilter, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectTrigger, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Filter, { className: "h-4 w-4 mr-2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "All Categories" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All Categories" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "yeast", children: "Yeast" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "malt", children: "Malt & Grain" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "hops", children: "Hops" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "fruit", children: "Fruit & Adjuncts" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "equipment", children: "Equipment" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "packaging", children: "Packaging" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "kegs", children: "Kegs & Barrels" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: handleExport, className: "gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }),
              "Export"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: handleImport, className: "gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-4 w-4" }),
              "Import"
            ] })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Inventory Items" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { children: [
            filteredItems.length,
            " items ",
            searchQuery || categoryFilter !== "all" ? "(filtered)" : ""
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(InventoryTable, { items: filteredItems }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: status })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: showAddItemDialog, onOpenChange: setShowAddItemDialog, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-3xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Add Inventory Item" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Select the type of item you want to add" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-4 py-4", children: categories.map((category) => {
        const Icon2 = category.icon;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => handleCategorySelect(category.id),
            className: "flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors text-left",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-lg bg-primary/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon2, { className: "h-6 w-6 text-primary" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold mb-1", children: category.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: category.description }),
                category.isIngredient && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block mt-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded", children: "LAB-Tracked" })
              ] })
            ]
          },
          category.id
        );
      }) })
    ] }) })
  ] });
}
function BatchesPage() {
  const navigate = useNavigate();
  const [batches, setBatches] = reactExports.useState([]);
  const [summary, setSummary] = reactExports.useState(null);
  const [status, setStatus] = reactExports.useState("Loading batches...");
  const [editQtyByBatchId, setEditQtyByBatchId] = reactExports.useState({});
  const load = reactExports.useCallback(async () => {
    var _a, _b;
    try {
      const response = await fetch("/api/os/batches");
      const payload = await response.json().catch(() => null);
      if (!response.ok || !(payload == null ? void 0 : payload.success)) {
        throw new Error((payload == null ? void 0 : payload.error) ?? "Failed to load batches.");
      }
      setBatches(((_a = payload.data) == null ? void 0 : _a.batches) ?? []);
      setSummary(((_b = payload.data) == null ? void 0 : _b.summary) ?? null);
      setStatus("Batches loaded.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load batches.");
    }
  }, []);
  reactExports.useEffect(() => {
    void load();
  }, [load]);
  const updateBatch = async (batch, nextStatus) => {
    const qty = Number(editQtyByBatchId[batch.id] ?? batch.producedQty);
    try {
      const response = await fetch(`/api/os/batches/${batch.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producedQty: Number.isFinite(qty) ? qty : batch.producedQty,
          status: nextStatus,
          unit: batch.unit
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !(payload == null ? void 0 : payload.success)) {
        throw new Error((payload == null ? void 0 : payload.error) ?? "Failed to update batch.");
      }
      await load();
      setStatus(`Batch ${batch.lotCode} updated.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update batch.");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { currentSuite: "os", pageTitle: "Batch Tracking", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "Batch Tracking" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Production lots, release status, and on-hand quantities for OPS logistics." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => navigate("/os/batches/new"), children: "New Manual Batch" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold", children: (summary == null ? void 0 : summary.total) ?? 0 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Total Batches" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold", children: (summary == null ? void 0 : summary.inProgress) ?? 0 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "In Progress" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold", children: (summary == null ? void 0 : summary.readyToRelease) ?? 0 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Ready to Release" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold", children: (summary == null ? void 0 : summary.released) ?? 0 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Released" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold", children: (summary == null ? void 0 : summary.shipped) ?? 0 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Shipped" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold", children: (summary == null ? void 0 : summary.onHandQty) ?? 0 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "On Hand (Qty)" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Batches" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Update produced quantities and release status for OPS handoff." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3", children: batches.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No batches yet. Start a recipe run to create one." }) : batches.map((batch) => {
        const availableQty = Math.max(
          0,
          batch.producedQty - batch.allocatedQty - (batch.dispensedQty ?? 0)
        );
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border border-border p-3 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: batch.recipeName }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                batch.lotCode,
                " • run ",
                batch.recipeRunId ?? "--"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: batch.status === "released" ? "secondary" : "outline", children: batch.status.replaceAll("_", " ") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: "Produced" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  value: editQtyByBatchId[batch.id] ?? String(batch.producedQty),
                  onChange: (event) => setEditQtyByBatchId((prev) => ({
                    ...prev,
                    [batch.id]: event.target.value
                  }))
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: "Allocated" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "pt-2 font-mono", children: [
                batch.allocatedQty,
                " ",
                batch.unit
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: "Dispensed" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "pt-2 font-mono", children: [
                batch.dispensedQty ?? 0,
                " ",
                batch.unit
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: "Available" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "pt-2 font-mono", children: [
                availableQty,
                " ",
                batch.unit
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", onClick: () => void updateBatch(batch, "completed"), children: "Mark Completed" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: () => void updateBatch(batch, "released"), children: "Release to OPS" })
            ] })
          ] })
        ] }, batch.id);
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: status })
  ] }) });
}
function NewBatchPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = reactExports.useState(false);
  const [statusMessage, setStatusMessage] = reactExports.useState("");
  const [recipeName, setRecipeName] = reactExports.useState("");
  const [skuId, setSkuId] = reactExports.useState("");
  const [siteId, setSiteId] = reactExports.useState("main");
  const [lotCode, setLotCode] = reactExports.useState("");
  const [unit, setUnit] = reactExports.useState("L");
  const [producedQty, setProducedQty] = reactExports.useState("0");
  const [batchStatus, setBatchStatus] = reactExports.useState("planned");
  const createBatch = async () => {
    const trimmedRecipeName = recipeName.trim();
    if (!trimmedRecipeName) {
      setStatusMessage("Recipe / batch name is required.");
      return;
    }
    const qty = Number(producedQty);
    setBusy(true);
    try {
      const response = await fetch("/api/os/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeName: trimmedRecipeName,
          skuId: skuId.trim() || void 0,
          siteId: siteId.trim() || "main",
          lotCode: lotCode.trim() || void 0,
          unit: unit.trim() || "L",
          producedQty: Number.isFinite(qty) ? qty : 0,
          status: batchStatus
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !(payload == null ? void 0 : payload.success)) {
        throw new Error((payload == null ? void 0 : payload.error) ?? "Failed to create manual batch.");
      }
      setStatusMessage("Manual batch created.");
      navigate("/os/batches");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to create manual batch."
      );
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { currentSuite: "os", pageTitle: "New Batch", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "New Manual Batch" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-muted-foreground", children: "Create a batch directly for manual/hybrid brewdays. Recipe automation behavior is unchanged." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Batch Details" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Use this for Breww-style manual batch tracking when no recipe run is active." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Batch / Recipe Name" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: recipeName,
                onChange: (event) => setRecipeName(event.target.value),
                placeholder: "West Coast IPA"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "SKU ID (optional)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: skuId,
                onChange: (event) => setSkuId(event.target.value),
                placeholder: "BEER-WCIPA-KEG"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Site ID" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: siteId,
                onChange: (event) => setSiteId(event.target.value),
                placeholder: "main"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Lot Code (optional)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: lotCode,
                onChange: (event) => setLotCode(event.target.value),
                placeholder: "LOT-2026-03-08-A"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Starting Qty" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                value: producedQty,
                onChange: (event) => setProducedQty(event.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Unit" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: unit,
                onChange: (event) => setUnit(event.target.value),
                placeholder: "L"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Initial Status" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: batchStatus,
                onValueChange: (value) => setBatchStatus(value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "planned", children: "planned" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "in_progress", children: "in progress" })
                  ] })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => navigate("/os/batches"), disabled: busy, children: "Cancel" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => void createBatch(), disabled: busy, children: "Create Batch" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: statusMessage })
  ] }) });
}
const DEFAULT_SUITE_PORT = "5173";
const suiteMeta = {
  ops: {
    label: "OPS",
    path: "/ops",
    envUrl: void 0
  },
  lab: {
    label: "LAB",
    path: "/lab",
    envUrl: void 0
  },
  flow: {
    label: "FLOW",
    path: "/flow",
    envUrl: void 0
  },
  connect: {
    label: "CONNECT",
    path: "/connect",
    envUrl: void 0
  }
};
const buildDefaultSuiteUrl = (path) => {
  if (typeof window === "undefined") {
    return path;
  }
  return `${window.location.protocol}//${window.location.hostname}:${DEFAULT_SUITE_PORT}${path}`;
};
function SuiteRedirectPage({ suite }) {
  const meta = suiteMeta[suite];
  const targetUrl = reactExports.useMemo(
    () => meta.envUrl && meta.envUrl.length > 0 ? meta.envUrl : buildDefaultSuiteUrl(meta.path),
    [meta.envUrl, meta.path]
  );
  reactExports.useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.href === targetUrl) return;
    window.location.replace(targetUrl);
  }, [targetUrl]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-xl text-center space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-semibold", children: [
      "Opening ",
      meta.label,
      " Suite"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground", children: [
      "Redirecting to ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: targetUrl })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "a",
      {
        href: targetUrl,
        className: "inline-flex items-center rounded-md border border-border px-4 py-2 text-sm hover:bg-accent/10",
        children: [
          "Open ",
          meta.label,
          " now"
        ]
      }
    )
  ] }) });
}
const NotFoundPage = reactExports.lazy(() => __vitePreload(() => import("./_404-Bwa15Arl.js"), true ? __vite__mapDeps([0,1,2,3]) : void 0));
const routes = [
  {
    path: "/",
    element: /* @__PURE__ */ jsxRuntimeExports.jsx(HomeHubPage, {})
  },
  {
    path: "/home",
    element: /* @__PURE__ */ jsxRuntimeExports.jsx(HomeHubPage, {})
  },
  {
    path: "/calendar",
    element: /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarPage, {})
  },
  {
    path: "/os",
    element: /* @__PURE__ */ jsxRuntimeExports.jsx(HomePage, {})
  },
  {
    path: "/os/calendar",
    element: /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarPage, {})
  },
  {
    path: "/os/devices",
    element: /* @__PURE__ */ jsxRuntimeExports.jsx(DevicesPage, {})
  },
  {
    path: "/os/inventory",
    element: /* @__PURE__ */ jsxRuntimeExports.jsx(InventoryManagementPage, {})
  },
  {
    path: "/os/inventory/add",
    element: /* @__PURE__ */ jsxRuntimeExports.jsx(AddInventoryItemPage, {})
  },
  {
    path: "/os/inventory/:id",
    element: /* @__PURE__ */ jsxRuntimeExports.jsx(ItemDetailsRouter, {})
  },
  {
    path: "/os/control-panel",
    element: /* @__PURE__ */ jsxRuntimeExports.jsx(ControlPanelPage, {})
  },
  {
    path: "/os/recipe-execution",
    element: /* @__PURE__ */ jsxRuntimeExports.jsx(RecipeExecutionPage, {})
  },
  {
    path: "/os/brewday",
    element: /* @__PURE__ */ jsxRuntimeExports.jsx(BrewdayRunboardPage, {})
  },
  {
    path: "/os/brewday/:runId",
    element: /* @__PURE__ */ jsxRuntimeExports.jsx(BrewdayRunboardPage, {})
  },
  {
    path: "/os/batches",
    element: /* @__PURE__ */ jsxRuntimeExports.jsx(BatchesPage, {})
  },
  {
    path: "/os/batches/new",
    element: /* @__PURE__ */ jsxRuntimeExports.jsx(NewBatchPage, {})
  },
  {
    path: "/os/materials",
    element: /* @__PURE__ */ jsxRuntimeExports.jsx(NotFoundPage, {})
    // Placeholder - will be implemented
  },
  {
    path: "/os/locations",
    element: /* @__PURE__ */ jsxRuntimeExports.jsx(NotFoundPage, {})
    // Placeholder - will be implemented
  },
  {
    path: "/os/movements",
    element: /* @__PURE__ */ jsxRuntimeExports.jsx(NotFoundPage, {})
    // Placeholder - will be implemented
  },
  {
    path: "/ops",
    element: /* @__PURE__ */ jsxRuntimeExports.jsx(SuiteRedirectPage, { suite: "ops" })
  },
  {
    path: "/lab",
    element: /* @__PURE__ */ jsxRuntimeExports.jsx(SuiteRedirectPage, { suite: "lab" })
  },
  {
    path: "/connect",
    element: /* @__PURE__ */ jsxRuntimeExports.jsx(SuiteRedirectPage, { suite: "connect" })
  },
  {
    path: "/flow",
    element: /* @__PURE__ */ jsxRuntimeExports.jsx(SuiteRedirectPage, { suite: "flow" })
  },
  {
    path: "*",
    element: /* @__PURE__ */ jsxRuntimeExports.jsx(NotFoundPage, {})
  }
];
function Spinner({ className }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `inline-block ${className || ""}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "svg",
    {
      className: "animate-spin h-8 w-8 text-gray-600",
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "circle",
          {
            className: "opacity-10",
            cx: "12",
            cy: "12",
            r: "10",
            stroke: "currentColor",
            strokeWidth: "4"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "path",
          {
            className: "opacity-20",
            fill: "currentColor",
            d: "m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          }
        )
      ]
    }
  ) });
}
const SpinnerFallback = () => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-8 h-screen items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Spinner, {}) });
const router = createBrowserRouter([
  {
    path: "/",
    element: /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx(SpinnerFallback, {}), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) }),
    children: routes
  }
]);
function App() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(RouterProvider2, { router });
}
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1e3 * 60 * 5,
      // 5 minutes
      gcTime: 1e3 * 60 * 10,
      // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: 0
    }
  }
});
const rootElement = document.getElementById("app");
if (!rootElement) throw new Error("Root element not found");
const root = ReactDOM.createRoot(rootElement);
root.render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxRuntimeExports.jsx(NotificationProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(App, {}) }) }) })
);
