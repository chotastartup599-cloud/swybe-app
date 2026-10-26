// Client + server dono ke liye common cheezein (isme koi secret nahi hai)

export const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "chotastartup599@gmail.com").trim().toLowerCase();

export const isAdminEmail = (email?: string | null) =>
  !!email && email.trim().toLowerCase() === ADMIN_EMAIL;

// Server ke isApprovedCreator jaisa hi rule: approved master, admin role, ya admin email
export const isApprovedCreatorUser = (user: any) => {
  if (!user) return false;
  if (isAdminEmail(user.email)) return true;
  if (user.role === "admin") return true;
  return user.role === "master" && user.masterStatus === "approved";
};