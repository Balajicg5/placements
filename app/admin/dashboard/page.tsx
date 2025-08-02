"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Users,
  Briefcase,
  TrendingUp,
  Calendar,
  Building2,
  Search,
  Download,
  Plus,
  Eye,
  Edit,
  LogOut,
  Settings,
  Filter,
  FileText,
  Clock,
  ExternalLink,
  UserCircle,
  CheckSquare,
  RotateCcw,
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { DatabaseService } from "@/lib/database"
import { Job, Application, ApplicationWithUserData } from "@/lib/appwrite"
import { AdminRoute } from "@/components/ProtectedRoute"
import { StudentProfileModal } from "@/components/StudentProfileModal"
import { ExportModal } from "@/components/ExportModal"
import { BulkUpdateModal } from "@/components/BulkUpdateModal"
import { storage, config } from "@/lib/appwrite"

export default function AdminDashboard() {
  const { user, logout, isPlacementRep, hasStudentAccess, isPlacementCoordinator } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<ApplicationWithUserData[]>([])
  const [selectedJob, setSelectedJob] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedJob !== "all") {
      fetchJobApplications(selectedJob)
    } else {
      fetchAllApplications()
    }
  }, [selectedJob])

  const fetchData = async () => {
    try {
      const [jobsData] = await Promise.all([
        DatabaseService.getJobs()
      ])
      setJobs(jobsData)
      await fetchAllApplications()
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllApplications = async () => {
    try {
      const allApplications = await DatabaseService.getAllApplicationsWithUserData()
      setApplications(allApplications)
    } catch (error) {
      console.error('Error fetching applications:', error)
    }
  }

  const fetchJobApplications = async (jobId: string) => {
    try {
      const jobApplications = await DatabaseService.getJobApplicationsWithUserData(jobId)
      setApplications(jobApplications)
    } catch (error) {
      console.error('Error fetching job applications:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      await DatabaseService.updateApplicationStatus(applicationId, newStatus)
      // Refresh applications
      if (selectedJob !== "all") {
        fetchJobApplications(selectedJob)
      } else {
        fetchAllApplications()
      }
    } catch (error) {
      console.error('Error updating application status:', error)
    }
  }

  const handleBulkStatusUpdate = async (applicationIds: string[], newStatus: string) => {
    try {
      await DatabaseService.bulkUpdateApplicationStatus(applicationIds, newStatus)
      setSelectedApplications([])
      // Refresh applications
      if (selectedJob !== "all") {
        fetchJobApplications(selectedJob)
      } else {
        fetchAllApplications()
      }
    } catch (error) {
      console.error('Error bulk updating applications:', error)
      throw error
    }
  }

  const handleViewProfile = (userId: string) => {
    setSelectedStudentId(userId)
    setShowProfileModal(true)
  }

  const handleDownloadResume = (resumeUrl: string) => {
    if (resumeUrl && resumeUrl !== "N/A") {
      try {
        // Extract file ID from the resume URL or use the resume field directly if it's already a file ID
        const fileId = resumeUrl.includes('/') ? 
          resumeUrl.split('/').pop()?.split('?')[0] || resumeUrl : 
          resumeUrl
        
        const downloadUrl = storage.getFileDownload(config.storageId, fileId)
        window.open(downloadUrl.toString(), '_blank')
      } catch (error) {
        console.error('Error downloading resume:', error)
        alert('Unable to download resume. Please check if the file exists.')
      }
    } else {
      alert('No resume available for this student.')
    }
  }

  const handleViewResume = (resumeUrl: string) => {
    if (resumeUrl && resumeUrl !== "N/A") {
      try {
        // Extract file ID from the resume URL or use the resume field directly if it's already a file ID
        const fileId = resumeUrl.includes('/') ? 
          resumeUrl.split('/').pop()?.split('?')[0] || resumeUrl : 
          resumeUrl
        
        const previewUrl = storage.getFileView(config.storageId, fileId)
        window.open(previewUrl.toString(), '_blank')
      } catch (error) {
        console.error('Error viewing resume:', error)
        alert('Unable to view resume. Please check if the file exists.')
      }
    } else {
      alert('No resume available for this student.')
    }
  }

  const getFilteredApplications = () => {
    return applications.filter(app => {
      const matchesSearch = !searchTerm || 
        (app.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         app.userRollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         app.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         app.company?.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesStatus = filterStatus === "all" || app.status === filterStatus
      
      return matchesSearch && matchesStatus
    })
  }

  const getStats = () => {
    const totalApplications = applications.length
    const pendingApplications = applications.filter(app => app.status === 'applied').length
    const interviewScheduled = applications.filter(app => app.status === 'interview_scheduled').length
    const selectedCandidates = applications.filter(app => app.status === 'selected').length
    
    return {
      total: totalApplications,
      pending: pendingApplications,
      interviews: interviewScheduled,
      selected: selectedCandidates
    }
  }

  const handleSelectAll = () => {
    const filteredApps = getFilteredApplications()
    if (selectedApplications.length === filteredApps.length) {
      setSelectedApplications([])
    } else {
      setSelectedApplications(filteredApps.map(app => app.$id))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading dashboard...</div>
      </div>
    )
  }

  const stats = getStats()
  const filteredApplications = getFilteredApplications()

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">GCT Placement Portal</h1>
                <p className="text-sm text-gray-600">Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {hasStudentAccess && (
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    <Users className="w-4 h-4 mr-2" />
                    Student Portal
                  </Button>
                </Link>
              )}
              <Link href="/admin/add-job">
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Job
                </Button>
              </Link>
              <Link href="/admin/add-placement">
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Placement
                </Button>
              </Link>
              <Link href="/placements">
                <Button variant="outline" className="h-auto p-4 justify-start">
                  <div className="text-left">
                    <div className="font-medium">View Placements</div>
                    <div className="text-sm text-gray-600">See all placement records</div>
                  </div>
                </Button>
              </Link>
              {isPlacementCoordinator && (
                <Link href="/admin/manage-admins">
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Admins
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name || "Admin"}!</h1>
            <p className="text-gray-600">Manage job applications and track placement progress</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Across all positions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">Require attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Interviews</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.interviews}</div>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Selected</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.selected}</div>
                <p className="text-xs text-muted-foreground">Candidates</p>
              </CardContent>
            </Card>
          </div>

          {/* Applications Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Job Applications Management
                  </CardTitle>
                  <CardDescription>Review and manage job applications from students</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowExportModal(true)} 
                    disabled={filteredApplications.length === 0}
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Select value={selectedJob} onValueChange={setSelectedJob}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Positions ({applications.length} applications)</SelectItem>
                      {jobs.map((job) => {
                        const jobApps = applications.filter(app => app.jobId === job.$id)
                        return (
                          <SelectItem key={job.$id} value={job.$id}>
                            {job.title} - {job.company} ({jobApps.length} applications)
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search applicants..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                      <SelectItem value="selected">Selected</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bulk Actions Header */}
              {filteredApplications.length > 0 && (
                <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedApplications.length === filteredApplications.length}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm font-medium">
                      Select All ({selectedApplications.length}/{filteredApplications.length})
                    </span>
                  </div>
                  
                  {selectedApplications.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowBulkUpdateModal(true)}
                      >
                        <CheckSquare className="w-4 h-4 mr-2" />
                        Update Status ({selectedApplications.length})
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedApplications([])}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Clear Selection
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Applications List */}
              <div className="space-y-4">
                {filteredApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No applications found for the selected criteria.</p>
                  </div>
                ) : (
                  filteredApplications.map((application) => (
                    <div key={application.$id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedApplications.includes(application.$id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedApplications([...selectedApplications, application.$id])
                              } else {
                                setSelectedApplications(selectedApplications.filter(id => id !== application.$id))
                              }
                            }}
                          />
                          <div>
                            <h3 className="font-semibold text-lg">{application.userName || "Unknown Student"}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span>Roll: {application.userRollNumber || "N/A"}</span>
                              <span>Dept: {application.userDepartment || "N/A"}</span>
                              <span>CGPA: {application.userCGPA || "N/A"}</span>
                              <span>Batch: {application.userBatch || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span className="font-medium">{application.jobTitle}</span>
                              <span>@ {application.company}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={application.userActiveBacklog === "Yes" ? "destructive" : "secondary"}>
                                {application.userActiveBacklog === "Yes" ? "Has Backlog" : "No Backlog"}
                              </Badge>
                              <Badge variant={application.userHistoryOfArrear === "Yes" ? "outline" : "default"}>
                                {application.userHistoryOfArrear === "Yes" ? "Has Arrear History" : "No Arrear History"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={application.status}
                            onValueChange={(newStatus) => handleStatusUpdate(application.$id, newStatus)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="applied">Applied</SelectItem>
                              <SelectItem value="under_review">Under Review</SelectItem>
                              <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                              <SelectItem value="selected">Selected</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                          <Badge
                            variant={
                              application.status === "selected"
                                ? "default"
                                : application.status === "interview_scheduled"
                                  ? "secondary"
                                  : application.status === "rejected"
                                    ? "destructive"
                                    : "outline"
                            }
                          >
                            {application.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span>Applied: {new Date(application.appliedAt).toLocaleDateString()}</span>
                        <span>Email: {application.userPersonalEmail || "N/A"}</span>
                        <span>Phone: {application.userPhone || "N/A"}</span>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewProfile(application.userId)}
                        >
                          <UserCircle className="w-4 h-4 mr-1" />
                          View Profile
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewResume(application.userResume)}
                          disabled={!application.userResume || application.userResume === "N/A"}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View Resume
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownloadResume(application.userResume)}
                          disabled={!application.userResume || application.userResume === "N/A"}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download Resume
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modals */}
        {selectedStudentId && (
          <StudentProfileModal
            userId={selectedStudentId}
            isOpen={showProfileModal}
            onClose={() => {
              setShowProfileModal(false)
              setSelectedStudentId(null)
            }}
          />
        )}

        <ExportModal
          applications={filteredApplications}
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          jobTitle={selectedJob !== "all" ? jobs.find(j => j.$id === selectedJob)?.title : undefined}
        />

        <BulkUpdateModal
          selectedApplications={selectedApplications}
          applications={filteredApplications}
          isOpen={showBulkUpdateModal}
          onClose={() => setShowBulkUpdateModal(false)}
          onUpdate={handleBulkStatusUpdate}
        />
      </div>
    </AdminRoute>
  )
}
