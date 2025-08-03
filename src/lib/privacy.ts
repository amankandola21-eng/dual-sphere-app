import { UserRole } from '@/hooks/useUserRole';

/**
 * Gets display name based on privacy rules:
 * - Admins can see full names
 * - Customers and cleaners can only see first names of each other
 * - Users can see their own full names
 */
export const getPrivateDisplayName = (
  fullName: string | null | undefined,
  viewerRole: UserRole,
  isOwnProfile: boolean = false
): string => {
  if (!fullName) return 'Unknown User';
  
  // Admins can see full names
  if (viewerRole === 'admin') {
    return fullName;
  }
  
  // Users can see their own full names
  if (isOwnProfile) {
    return fullName;
  }
  
  // For customers and cleaners viewing each other, show only first name
  const firstName = fullName.split(' ')[0];
  return firstName || 'User';
};

/**
 * Gets avatar initials based on privacy rules
 */
export const getPrivateInitials = (
  fullName: string | null | undefined,
  viewerRole: UserRole,
  isOwnProfile: boolean = false
): string => {
  const displayName = getPrivateDisplayName(fullName, viewerRole, isOwnProfile);
  return displayName.split(' ').map(n => n[0]).join('').toUpperCase();
};