import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401 for login attempts - let the login form handle the error
    const isLoginRequest = error.config?.url === '/auth/login';
    // Calls may opt out of the global 401 redirect (e.g. the post-signup CV
    // upload, where a 401 must not wipe the freshly-created session).
    const skipAuthRedirect = !!error.config?.headers?.['X-Skip-Auth-Redirect'];

    if (error.response?.status === 401 && !isLoginRequest && !skipAuthRedirect) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/signin';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API types
interface LoginData {
  email: string;
  password: string;
}

interface RegisterStudentData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  universityId?: number;
  majorId?: number;
  graduationYear?: number;
  // Step 2 fields
  linkedinUrl?: string;
  githubUrl?: string;
  careerPathId?: number;
  skillIds?: number[];
  interestIds?: number[];
}

interface RegisterRecruiterData {
  email: string;
  password: string;
  name: string;
  phone: string;
  companyName: string;
  companyDescription?: string;
  website?: string;
}

// Auth API
export const authApi = {
  registerStudent: (data: RegisterStudentData) => api.post('/auth/register/student', data),
  registerRecruiter: (data: RegisterRecruiterData) => api.post('/auth/register/recruiter', data),
  login: (data: LoginData) => api.post('/auth/login', data),
  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),
  resendVerification: (email: string) => api.post('/auth/resend-verification', { email }),
  // Anonymous CV parse during sign-up — returns suggestions to prefill the form.
  parseCv: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<CvSuggestions>('/auth/parse-cv', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Student API
export const studentApi = {
  getProfile: () => api.get('/students/profile'),
  getProfileById: (id: string | number) => api.get(`/students/${id}`),
  updateProfile: (data: Record<string, unknown>) => api.put('/students/profile', data),
  addSkill: (skillId: string | number) => api.post(`/students/skills/${skillId}`),
  removeSkill: (skillId: string | number) => api.delete(`/students/skills/${skillId}`),
  addInterest: (interestId: string | number) => api.post(`/students/interests/${interestId}`),
  removeInterest: (interestId: string | number) => api.delete(`/students/interests/${interestId}`),
  // Upload/replace the current student's CV. The explicit multipart Content-Type
  // (with no boundary) lets the browser fill in the boundary; without overriding
  // the axios default of application/json the file would not bind server-side.
  uploadCv: (file: File, opts?: { skipAuthRedirect?: boolean }) => {
    const form = new FormData();
    form.append('file', file);
    const headers: Record<string, string> = { 'Content-Type': 'multipart/form-data' };
    if (opts?.skipAuthRedirect) headers['X-Skip-Auth-Redirect'] = '1';
    return api.post('/students/profile/cv', form, { headers });
  },
  downloadCv: (studentProfileId: number) =>
    api.get(`/students/${studentProfileId}/cv`, { responseType: 'blob' }),
  deleteCv: () => api.delete('/students/profile/cv'),
  // Parse the uploaded CV with OpenAI and return profile-field suggestions.
  parseCv: () => api.post<CvSuggestions>('/students/profile/cv/parse'),
};

// Profile-field suggestions derived from a parsed CV (see CvSuggestionsDto).
export interface CvSuggestions {
  parsed: boolean;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  universityId: number | null;
  majorId: number | null;
  gpa: number | null;
  graduationYear: number | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  bio: string | null;
  careerPathId: number | null;
  skillIds: number[];
  interestIds: number[];
  unmatchedSkills: string[];
  unmatchedInterests: string[];
}

// Opens a CV returned by an authenticated download endpoint in a new tab.
// Handles both a real file blob and the legacy `{ type: 'external', url }` JSON
// payload (older profiles whose CV was a pasted link).
export async function openCvBlob(data: Blob): Promise<void> {
  if (data.type.includes('application/json')) {
    try {
      const parsed = JSON.parse(await data.text());
      if (parsed?.url) {
        window.open(parsed.url, '_blank', 'noopener,noreferrer');
        return;
      }
    } catch {
      // fall through and treat as a binary blob
    }
  }
  const objectUrl = URL.createObjectURL(data);
  window.open(objectUrl, '_blank', 'noopener,noreferrer');
  // Give the new tab time to load before releasing the object URL.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

// Recruiter API
export const recruiterApi = {
  getProfile: () => api.get('/recruiters/profile'),
  getProfileById: (id: string | number) => api.get(`/recruiters/${id}`),
  updateProfile: (data: Record<string, unknown>) => api.put('/recruiters/profile', data),
  getAll: () => api.get('/recruiters'),
};

// Reference data API
export const dataApi = {
  getSkills: () => api.get('/skills'),
  getSkillCategories: () => api.get('/skills/categories'),
  getSkillsByCategory: (category: string) => api.get(`/skills/by-category/${category}`),
  getInterests: () => api.get('/interests'),
  getUniversities: () => api.get('/universities'),
  getMajors: () => api.get('/majors'),
  getCareerPaths: () => api.get('/careerpaths'),
};

// Internship API types
export interface CreateInternshipData {
  title: string;
  description: string;
  location?: string;
  startDate?: string;
  periodInWeeks?: number;
  deadline?: string;
  skillId?: number;
  stipend?: number;
}

export interface UpdateInternshipData {
  title?: string;
  description?: string;
  location?: string;
  startDate?: string;
  periodInWeeks?: number;
  deadline?: string;
  skillId?: number;
  stipend?: number;
  isActive?: boolean;
}

export interface Internship {
  internshipId: number;
  recruiterProfileId: number;
  companyName?: string;
  companyLogo?: string;
  title: string;
  description: string;
  location?: string;
  startDate?: string;
  periodInWeeks?: number;
  deadline?: string;
  skillId?: number;
  requiredSkill?: {
    skillId: number;
    skillName: string;
    category?: string;
  };
  stipend?: number;
  isActive: boolean;
  applicationsCount: number;
  createdAt?: string;
}

interface CreateApplicationData {
  internshipId: number;
}

interface UpdateApplicationStatusData {
  status: string;
  reviewerNotes?: string;
}

interface CompleteApplicationData {
  performanceRating: number;  // 1-5
  performanceComment?: string;
}

// Internship API
export const internshipApi = {
  getAll: (isActive?: boolean) => api.get('/internships', { params: { isActive } }),
  getById: (id: number) => api.get(`/internships/${id}`),
  getRecruiterInternships: () => api.get('/internships/recruiter'),
  create: (data: CreateInternshipData) => api.post('/internships', data),
  update: (id: number, data: UpdateInternshipData) => api.put(`/internships/${id}`, data),
  delete: (id: number) => api.delete(`/internships/${id}`),
};

// Application API
export interface MockInterviewReportDto {
  applicationId: number;
  report: string;
}

export const applicationApi = {
  getStudentApplications: () => api.get('/applications/student'),
  getRecruiterApplications: () => api.get('/applications/recruiter'),
  getInternshipApplications: (internshipId: number) => api.get(`/applications/internship/${internshipId}`),
  getMockInterviewReport: (applicationId: number) =>
    api.get<MockInterviewReportDto>(`/applications/${applicationId}/mock-interview-report`),
  // Student reads their own mock interview report for an application they own.
  getMyMockInterviewReport: (applicationId: number) =>
    api.get<MockInterviewReportDto>(`/applications/${applicationId}/my-mock-interview-report`),
  // Student shares (or hides) their mock interview report with the recruiter.
  shareMockInterviewReport: (applicationId: number, shared: boolean) =>
    api.put<{ shared: boolean }>(`/applications/${applicationId}/share-mock-interview-report`, { shared }),
  apply: (data: CreateApplicationData) => api.post('/applications', data),
  updateStatus: (id: number, data: UpdateApplicationStatusData) => api.put(`/applications/${id}/status`, data),
  complete: (id: number, data: CompleteApplicationData) => api.put(`/applications/${id}/complete`, data),
  undoComplete: (id: number) => api.put(`/applications/${id}/undo-complete`, {}),
  withdraw: (id: number) => api.delete(`/applications/${id}`),
  // Recruiter (or admin) downloads the applicant's CV for an application.
  downloadCv: (applicationId: number) =>
    api.get(`/applications/${applicationId}/cv`, { responseType: 'blob' }),
};

// Career Planner API (proxied through backend controller)
const careerPlannerApi = axios.create({
  baseURL: '/api/career-planner',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Career Recommendation Types
export interface CareerRecommendation {
  career_path_id: number;
  career_path_name: string;
  final_score: number;
  interest_score: number;
  skill_score: number;
  collaborative_score: number;
  skills_matched: number;
  skills_required: number;
  missing_skills: string[];
}

export interface RecommendResponse {
  student_profile_id: number;
  algorithm_used: string;
  recommendations: CareerRecommendation[];
}

// Career Recommendation API (via backend proxy)
export const recommendApi = {
  getRecommendations: (studentProfileId: number, topN: number = 3) =>
    careerPlannerApi.post<RecommendResponse>('/recommend', {
      student_profile_id: studentProfileId,
      top_n: topN,
    }),
};

// Career Planner Types
export interface RoleInfo {
  role: string;
  required_skills: string[];
}

export interface LearningStep {
  step: number;
  skill: string;
  hours: number;
  cumulative_hours: number;
  prerequisites: string[];
  course_title: string;
  course_link: string;
}

export interface PlanResponse {
  target_role: string;
  skills_needed: string[];
  steps: LearningStep[];
  total_hours: number;
  weeks_at_10h: number;
}

export interface PlanRequest {
  target_role: string;
  current_skills?: string[];
}

// Career Planner API
export const careerPlanApi = {
  getRoles: () => careerPlannerApi.get<RoleInfo[]>('/roles'),
  getSkills: () => careerPlannerApi.get<string[]>('/skills'),
  createPlan: (data: PlanRequest) => careerPlannerApi.post<PlanResponse>('/plan', data),
  healthCheck: () => careerPlannerApi.get('/health'),
};

// Saved Career Plan Types
export interface SavedCareerPlanSummary {
  savedPlanId: number;
  targetRole: string;
  totalHours: number | null;
  weeksAt10H: number | null;
  isActive: boolean;
  createdAt: string | null;
  completedCoursesCount: number;
  totalCoursesCount: number;
  progressPercentage: number;
}

export interface CareerPlanSkillDto {
  planSkillId: number;
  skillName: string;
  skillId: number | null;
}

export interface CareerPlanCourseDto {
  courseId: number;
  stepNumber: number;
  skillName: string;
  courseTitle: string;
  courseLink: string | null;
  hours: number | null;
  cumulativeHours: number | null;
  prerequisites: string[];
  isCompleted: boolean;
  completedAt: string | null;
  certificateUrl: string | null;
}

export interface SavedCareerPlanDto {
  savedPlanId: number;
  studentId: number;
  targetRole: string;
  totalHours: number | null;
  weeksAt10H: number | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  skills: CareerPlanSkillDto[];
  courses: CareerPlanCourseDto[];
  completedCoursesCount: number;
  totalCoursesCount: number;
  progressPercentage: number;
}

export interface SaveCareerPlanRequest {
  targetRole: string;
  skillsNeeded: string[];
  steps: {
    step: number;
    skill: string;
    courseTitle: string;
    courseLink: string;
    hours: number;
    cumulativeHours: number;
    prerequisites: string[];
  }[];
  totalHours: number;
  weeksAt10H: number;
}

export interface MarkCourseCompleteRequest {
  certificateUrl?: string;
}

// Saved Career Plans API
export const savedCareerPlanApi = {
  getMyPlans: () => api.get<SavedCareerPlanSummary[]>('/savedcareerplans'),
  getActivePlan: () => api.get<SavedCareerPlanDto>('/savedcareerplans/active'),
  getPlan: (id: number) => api.get<SavedCareerPlanDto>(`/savedcareerplans/${id}`),
  savePlan: (data: SaveCareerPlanRequest) => api.post<SavedCareerPlanDto>('/savedcareerplans', data),
  markCourseComplete: (planId: number, courseId: number, data: MarkCourseCompleteRequest) =>
    api.put<CareerPlanCourseDto>(`/savedcareerplans/${planId}/courses/${courseId}/complete`, data),
  markCourseUncomplete: (planId: number, courseId: number) =>
    api.put<CareerPlanCourseDto>(`/savedcareerplans/${planId}/courses/${courseId}/uncomplete`),
  deletePlan: (id: number) => api.delete(`/savedcareerplans/${id}`),
  activatePlan: (id: number) => api.put(`/savedcareerplans/${id}/activate`),
};

// Course Review Types
export interface CourseReviewDto {
  reviewId: number;
  studentId: number;
  studentName: string | null;
  rating: number;
  reviewText: string | null;
  courseTitle: string;
  courseLink: string | null;
  skillName: string;
  createdAt: string | null;
  updatedAt: string | null;
  isOwnReview: boolean;
}

export interface CourseReviewSummaryDto {
  courseTitle: string;
  courseLink: string | null;
  averageRating: number;
  totalReviews: number;
  reviews: CourseReviewDto[];
}

export interface CreateCourseReviewRequest {
  courseTitle: string;
  courseLink: string | null;
  skillName: string;
  rating: number;
  reviewText?: string;
}

export interface UpdateCourseReviewRequest {
  rating: number;
  reviewText?: string;
}

// Course Reviews API
export const courseReviewApi = {
  getReviews: (courseTitle: string, courseLink?: string) =>
    api.get<CourseReviewSummaryDto>('/coursereviews', {
      params: { courseTitle, courseLink }
    }),
  getMyReviews: () => api.get<CourseReviewDto[]>('/coursereviews/my'),
  createReview: (data: CreateCourseReviewRequest) =>
    api.post<CourseReviewDto>('/coursereviews', data),
  updateReview: (id: number, data: UpdateCourseReviewRequest) =>
    api.put<CourseReviewDto>(`/coursereviews/${id}`, data),
  deleteReview: (id: number) => api.delete(`/coursereviews/${id}`),
};

// Internship Review Types
export interface InternshipReviewDto {
  reviewId: number;
  applicationId: number;
  studentId: number;
  studentName: string | null;
  internshipId: number;
  internshipTitle: string | null;
  companyName: string | null;
  overallRating: number;
  reviewText: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  isOwnReview: boolean;
}

export interface InternshipReviewSummaryDto {
  internshipId: number;
  internshipTitle: string | null;
  companyName: string | null;
  averageOverallRating: number;
  totalReviews: number;
  reviews: InternshipReviewDto[];
}

export interface CreateInternshipReviewRequest {
  applicationId: number;
  overallRating: number;
  reviewText?: string;
}

export interface UpdateInternshipReviewRequest {
  overallRating: number;
  reviewText?: string;
}

export interface InternshipReviewCheckDto {
  exists: boolean;
  reviewId: number | null;
}

// Admin Management Types
export interface AdminDashboardStats {
  totalStudents: number;
  totalRecruiters: number;
  totalInternships: number;
  activeInternships: number;
  totalApplications: number;
  pendingApplications: number;
  reviewedApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  completedApplications: number;
  totalInternshipReviews: number;
  totalCourseReviews: number;
}

export interface RecentActivity {
  type: string;
  description: string;
  userName: string;
  createdAt: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminUserListItem {
  userId: number;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string | null;
  companyName: string | null;
  universityName: string | null;
  majorName: string | null;
}

export interface AdminUserDetail extends AdminUserListItem {
  gpa: number | null;
  graduationYear: number | null;
  hasCv: boolean;
  linkedinUrl: string | null;
  githubUrl: string | null;
  bio: string | null;
  companyDescription: string | null;
  website: string | null;
  logoUrl: string | null;
}

export interface AdminInternshipListItem {
  internshipId: number;
  title: string;
  companyName: string | null;
  location: string | null;
  isActive: boolean;
  applicationsCount: number;
  stipend: number | null;
  deadline: string | null;
  createdAt: string | null;
}

export interface AdminApplicationListItem {
  applicationId: number;
  studentName: string | null;
  studentEmail: string | null;
  internshipTitle: string | null;
  companyName: string | null;
  status: string;
  appliedAt: string | null;
}

export interface AdminInternshipReview {
  reviewId: number;
  studentName: string | null;
  internshipTitle: string | null;
  companyName: string | null;
  overallRating: number;
  reviewText: string | null;
  createdAt: string | null;
}

export interface AdminCourseReview {
  reviewId: number;
  studentName: string | null;
  courseTitle: string;
  courseLink: string | null;
  rating: number;
  reviewText: string | null;
  createdAt: string | null;
}

// Admin Management API
export const adminApi = {
  // Dashboard
  getDashboardStats: () =>
    api.get<AdminDashboardStats>('/admin-management/dashboard/stats'),
  getRecentActivity: () =>
    api.get<RecentActivity[]>('/admin-management/dashboard/recent-activity'),

  // User Management
  getUsers: (params: { role?: string; search?: string; page?: number; pageSize?: number }) =>
    api.get<PaginatedResponse<AdminUserListItem>>('/admin-management/users', { params }),
  getUserDetail: (id: number) =>
    api.get<AdminUserDetail>(`/admin-management/users/${id}`),
  toggleUserActive: (id: number) =>
    api.put(`/admin-management/users/${id}/toggle-active`),

  // Internship Management
  getInternships: (params: { search?: string; status?: string; page?: number; pageSize?: number }) =>
    api.get<PaginatedResponse<AdminInternshipListItem>>('/admin-management/internships', { params }),
  toggleInternshipActive: (id: number) =>
    api.put(`/admin-management/internships/${id}/toggle-active`),
  deleteInternship: (id: number) =>
    api.delete(`/admin-management/internships/${id}`),

  // Application Oversight
  getApplications: (params: { status?: string; search?: string; page?: number; pageSize?: number }) =>
    api.get<PaginatedResponse<AdminApplicationListItem>>('/admin-management/applications', { params }),

  // Content Moderation
  getInternshipReviews: (params: { page?: number; pageSize?: number }) =>
    api.get<PaginatedResponse<AdminInternshipReview>>('/admin-management/reviews/internship', { params }),
  getCourseReviews: (params: { page?: number; pageSize?: number }) =>
    api.get<PaginatedResponse<AdminCourseReview>>('/admin-management/reviews/course', { params }),
  deleteInternshipReview: (id: number) =>
    api.delete(`/admin-management/reviews/internship/${id}`),
  deleteCourseReview: (id: number) =>
    api.delete(`/admin-management/reviews/course/${id}`),

  // Admin CRUD (existing AdminController endpoints)
  getAdmins: () => api.get('/admin'),
  getAdmin: (id: number) => api.get(`/admin/${id}`),
  createAdmin: (data: { email: string; password: string; name: string; phone?: string; isFullAdmin: boolean }) =>
    api.post('/admin', data),
  updateAdmin: (id: number, data: { name?: string; phone?: string; isFullAdmin?: boolean; isActive?: boolean }) =>
    api.put(`/admin/${id}`, data),
  deleteAdmin: (id: number) => api.delete(`/admin/${id}`),
  changeAdminPassword: (id: number, data: { newPassword: string }) =>
    api.put(`/admin/${id}/password`, data),
  getCurrentAdmin: () => api.get('/admin/me'),
  isFullAdmin: () => api.get('/admin/is-full-admin'),
};

// Internship Reviews API
export const internshipReviewApi = {
  getForInternship: (internshipId: number) =>
    api.get<InternshipReviewSummaryDto>(`/internshipreviews/internship/${internshipId}`),
  getMyReviews: () =>
    api.get<InternshipReviewDto[]>('/internshipreviews/my'),
  checkExists: (applicationId: number) =>
    api.get<InternshipReviewCheckDto>(`/internshipreviews/check/${applicationId}`),
  create: (data: CreateInternshipReviewRequest) =>
    api.post<InternshipReviewDto>('/internshipreviews', data),
  update: (id: number, data: UpdateInternshipReviewRequest) =>
    api.put<InternshipReviewDto>(`/internshipreviews/${id}`, data),
  delete: (id: number) =>
    api.delete(`/internshipreviews/${id}`),
};

export interface MockInterviewTokenDto {
  token: string;
  url: string;
  room: string;
  identity: string;
}

export interface MockInterviewTokenRequest {
  applicationId?: number;
}

export const mockInterviewApi = {
  issueToken: (payload: MockInterviewTokenRequest = {}) =>
    api.post<MockInterviewTokenDto>('/mockinterview/token', payload),
};
