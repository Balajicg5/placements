import { Client, Account, Databases, Storage, Query, ID } from 'appwrite'

// Initialize Appwrite client
const client = new Client()

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')

// Export services
export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)

// Export client for direct use
export { client, Query, ID }

// Configuration constants
export const config = {
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'placement-db',
  storageId: process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || 'placement-files',
  collections: {
    users: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID || 'users',
    jobs: process.env.NEXT_PUBLIC_APPWRITE_JOBS_COLLECTION_ID || 'jobs',
    applications: process.env.NEXT_PUBLIC_APPWRITE_APPLICATIONS_COLLECTION_ID || 'applications',
    placements: process.env.NEXT_PUBLIC_APPWRITE_PLACEMENTS_COLLECTION_ID || 'placements',
    companies: process.env.NEXT_PUBLIC_APPWRITE_COMPANIES_COLLECTION_ID || 'companies',
    adminRoles: process.env.NEXT_PUBLIC_APPWRITE_ADMIN_ROLES_COLLECTION_ID || 'admin_roles',
  },
  allowedEmailDomain: process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || 'gct.ac.in'
}

// User roles enum
export enum UserRole {
  STUDENT = 'student',
  PLACEMENT_REP = 'placement_rep',
  PLACEMENT_OFFICER = 'placement_officer',
  PLACEMENT_COORDINATOR = 'placement_coordinator'
}

// Type definitions
export interface User {
  $id: string
  email: string
  name: string
  role: UserRole
  verified: boolean
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  $id: string
  userId: string
  fullName: string
  collegeEmail: string
  personalEmail?: string
  role: UserRole
  isPlacementRep: boolean
  // Personal Details
  dateOfBirth?: string
  gender?: 'Male' | 'Female' | 'Other'
  phoneNo?: string
  parentsName?: string
  parentsNo?: string
  currentAddress?: string
  permanentAddress?: string
  city?: string
  country?: string
  aadharNo?: string
  pancardNo?: string
  bio?: string
  // Academic Information
  rollNo?: string
  batch?: string
  department?: string
  currentCgpa?: string
  tenthMarkPercent?: string
  twelthMarkPercent?: string
  diplomaMarkPercent?: string
  sem1Cgpa?: string
  sem2Cgpa?: string
  sem3Cgpa?: string
  sem4Cgpa?: string
  sem5Cgpa?: string
  sem6Cgpa?: string
  sem7Cgpa?: string
  sem8Cgpa?: string
  historyOfArrear?: 'Yes' | 'No'
  activeBacklog?: 'Yes' | 'No'
  noOfBacklogs?: string
  // Files and Profiles
  profilePicture?: string
  resume?: string
  githubProfile?: string
  linkedInProfile?: string
  createdAt: string
  updatedAt: string
}

export interface Job {
  $id: string
  title: string
  company: string
  location: string
  jobType: string
  package: string
  description: string
  minCGPA: string
  noBacklogs: boolean
  departments: string[]
  applicationDeadline: string
  driveDate?: string
  logo?: string
  additionalDocuments?: string
  status: 'active' | 'closed' | 'draft'
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Application {
  $id: string
  jobId: string
  userId: string
  jobTitle: string
  company: string
  status: 'applied' | 'under_review' | 'interview_scheduled' | 'selected' | 'rejected'
  appliedAt: string
  createdAt: string
  updatedAt: string
}

// Extended Application interface with user data for admin dashboard
export interface ApplicationWithUserData extends Application {
  userName: string
  userRollNumber: string
  userDepartment: string
  userCGPA: string
  userActiveBacklog: string
  userHistoryOfArrear: string
  userPersonalEmail: string
  userPhone: string
  userResume: string
}

export interface Placement {
  $id: string
  userId: string
  jobId?: string
  company: string
  position?: string
  package: string
  location?: string
  joiningDate?: string
  offerLetterDate?: string
  placedAt: string
  photo?: string
  offerLetter?: string
  createdAt: string
  updatedAt?: string
}

export interface Company {
  $id: string
  name: string
  description?: string
  website?: string
  logo?: string
  location?: string
  industry?: string
  createdAt: string
  updatedAt: string
}

// Admin role interface for collection-based admin management
export interface AdminRole {
  $id: string
  email: string
  role: UserRole.PLACEMENT_REP | UserRole.PLACEMENT_OFFICER | UserRole.PLACEMENT_COORDINATOR
  name: string
  department?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
} 