type NavigationVisibility = "always" | "guest" | "user";

type NavigationItem = {
  href: string;
  label: string;
  description: string;
  visibility: NavigationVisibility;
};

const navigationItems: NavigationItem[] = [
  {
    href: "/",
    label: "Home",
    description: "Project overview and current MVP status",
    visibility: "always",
  },
  {
    href: "/login",
    label: "Login",
    description: "User sign-in page for the MVP",
    visibility: "guest",
  },
  {
    href: "/register",
    label: "Register",
    description: "User sign-up page for the MVP",
    visibility: "guest",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "A simple summary of tasks, notes, and goals",
    visibility: "user",
  },
  {
    href: "/tasks",
    label: "Tasks",
    description: "Task management interface",
    visibility: "user",
  },
  {
    href: "/notes",
    label: "Notes",
    description: "Notes management interface",
    visibility: "user",
  },
  {
    href: "/goals",
    label: "Goals",
    description: "Goal management interface",
    visibility: "user",
  },
];

function getVisibleNavigationItems(isAuthenticated: boolean) {
  return navigationItems.filter((item) => {
    if (item.visibility === "always") {
      return true;
    }

    if (item.visibility === "guest") {
      return !isAuthenticated;
    }

    return isAuthenticated;
  });
}

function getRouteVisibility(pathname: string): NavigationVisibility {
  const matchedItem = navigationItems.find((item) => {
    if (item.href === "/") {
      return pathname === "/";
    }

    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  });

  return matchedItem?.visibility || "always";
}

export { getRouteVisibility, getVisibleNavigationItems, navigationItems };
export type { NavigationItem };
