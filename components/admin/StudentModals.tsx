import React, { useState, useEffect } from "react";
import { Plus, CheckCircle2, Trash2, Loader2, X, AlertTriangle, Layers, Search, BookOpen, UserCheck } from "lucide-react";
import { StudentFormData } from "@/types/admin";

interface StudentModalsProps {
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
  showEditModal: boolean;
  setShowEditModal: (show: boolean) => void;
  showDeleteModal: boolean;
  setShowDeleteModal: (show: boolean) => void;
  studentForm: StudentFormData;
  setStudentForm: React.Dispatch<React.SetStateAction<StudentFormData>>;
  studentCrudLoading: boolean;
  studentCrudError: string | null;
  onAddStudent: (e: React.FormEvent) => void;
  onUpdateStudent: (e: React.FormEvent) => void;
  onDeleteStudent: () => void;
}

export function StudentModals({
  showAddModal,
  setShowAddModal,
  showEditModal,
  setShowEditModal,
  showDeleteModal,
  setShowDeleteModal,
  studentForm,
  setStudentForm,
  studentCrudLoading,
  studentCrudError,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
}: StudentModalsProps) {
  return (
    <>
      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#0d2137]">Add New Student</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enroll a student directly into the active cohort database.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {studentCrudError && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {studentCrudError}
              </div>
            )}

            <form onSubmit={onAddStudent} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Enrollment Number *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter enrollment number"
                    value={studentForm.enrollmentNumber}
                    onChange={(e) => setStudentForm({ ...studentForm, enrollmentNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Student full name"
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number (10 Digits)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={studentForm.phone || ""}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        phone: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className="w-full pl-11 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department *
                </label>
                <input
                  type="text"
                  value={studentForm.department}
                  onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Programme
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B.Tech CSE"
                    value={studentForm.programme}
                    onChange={(e) => setStudentForm({ ...studentForm, programme: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Semester
                  </label>
                  <select
                    value={studentForm.semester}
                    onChange={(e) => setStudentForm({ ...studentForm, semester: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137] bg-white"
                  >
                    <option value={3}>Semester 3 (Year 2)</option>
                    <option value={4}>Semester 4 (Year 2)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={studentForm.gender || "Male"}
                    onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137] bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Attendance Record (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="e.g. 85"
                    value={studentForm.attendancePercent ?? 85}
                    onChange={(e) => setStudentForm({ ...studentForm, attendancePercent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Internals (/50)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    value={studentForm.internalMarks !== undefined && studentForm.internalMarks !== null && studentForm.internalMarks > 0 ? studentForm.internalMarks : ""}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9]/g, "");
                      if (clean === "") {
                        setStudentForm({ ...studentForm, internalMarks: 0 });
                        return;
                      }
                      const num = Math.min(50, Math.max(0, parseInt(clean, 10)));
                      setStudentForm({ ...studentForm, internalMarks: num });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Externals (/50)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    value={studentForm.externalMarks !== undefined && studentForm.externalMarks !== null && studentForm.externalMarks > 0 ? studentForm.externalMarks : ""}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9]/g, "");
                      if (clean === "") {
                        setStudentForm({ ...studentForm, externalMarks: 0 });
                        return;
                      }
                      const num = Math.min(50, Math.max(0, parseInt(clean, 10)));
                      setStudentForm({ ...studentForm, externalMarks: num });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batch Year
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2025"
                    value={studentForm.batch}
                    onChange={(e) => setStudentForm({ ...studentForm, batch: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={studentForm.academicYear}
                    onChange={(e) => setStudentForm({ ...studentForm, academicYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-[#0d2137] focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={studentCrudLoading}
                  className="px-5 py-2 rounded-xl bg-[#0d2137] text-white text-xs font-semibold hover:bg-[#163456] transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {studentCrudLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Save Student</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#0d2137]">Edit Student Record</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update student information and cohort metadata.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {studentCrudError && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {studentCrudError}
              </div>
            )}

            <form onSubmit={onUpdateStudent} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Enrollment Number *
                  </label>
                  <input
                    type="text"
                    value={studentForm.enrollmentNumber}
                    onChange={(e) => setStudentForm({ ...studentForm, enrollmentNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number (10 Digits)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={studentForm.phone || ""}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          phone: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      className="w-full pl-11 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={Boolean(studentForm.phoneVerified)}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          phoneVerified: e.target.checked,
                        })
                      }
                      className="rounded border-slate-300 text-[#0d2137] focus:ring-[#0d2137]"
                    />
                    <span className="text-xs font-semibold text-slate-700">Phone Verified</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department *
                </label>
                <input
                  type="text"
                  value={studentForm.department}
                  onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Programme
                  </label>
                  <input
                    type="text"
                    value={studentForm.programme}
                    onChange={(e) => setStudentForm({ ...studentForm, programme: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Semester
                  </label>
                  <select
                    value={studentForm.semester}
                    onChange={(e) => setStudentForm({ ...studentForm, semester: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137] bg-white"
                  >
                    <option value={3}>Semester 3</option>
                    <option value={4}>Semester 4</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={studentForm.gender || "Male"}
                    onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137] bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Attendance Record (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={studentForm.attendancePercent ?? 85}
                    onChange={(e) => setStudentForm({ ...studentForm, attendancePercent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Internals (/50)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    value={studentForm.internalMarks !== undefined && studentForm.internalMarks !== null && studentForm.internalMarks > 0 ? studentForm.internalMarks : ""}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9]/g, "");
                      if (clean === "") {
                        setStudentForm({ ...studentForm, internalMarks: 0 });
                        return;
                      }
                      const num = Math.min(50, Math.max(0, parseInt(clean, 10)));
                      setStudentForm({ ...studentForm, internalMarks: num });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Externals (/50)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    value={studentForm.externalMarks !== undefined && studentForm.externalMarks !== null && studentForm.externalMarks > 0 ? studentForm.externalMarks : ""}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9]/g, "");
                      if (clean === "") {
                        setStudentForm({ ...studentForm, externalMarks: 0 });
                        return;
                      }
                      const num = Math.min(50, Math.max(0, parseInt(clean, 10)));
                      setStudentForm({ ...studentForm, externalMarks: num });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batch Year
                  </label>
                  <input
                    type="text"
                    value={studentForm.batch}
                    onChange={(e) => setStudentForm({ ...studentForm, batch: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={studentForm.academicYear}
                    onChange={(e) => setStudentForm({ ...studentForm, academicYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-[#0d2137] focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={studentCrudLoading}
                  className="px-5 py-2 rounded-xl bg-[#0d2137] text-white text-xs font-semibold hover:bg-[#163456] transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {studentCrudLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Update Student</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Student Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl relative">
            <div className="w-10 h-1 bg-red-600 rounded-full mb-3" />
            <h3 className="text-lg font-bold text-[#0d2137]">Confirm Student Removal</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Are you sure you want to delete student{" "}
              <strong className="text-[#0d2137]">{studentForm.name}</strong> (Enrollment:{" "}
              <span className="font-mono">{studentForm.enrollmentNumber}</span>)?
              Any active project registration will also be removed.
            </p>

            {studentCrudError && (
              <div className="mt-3 p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {studentCrudError}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={studentCrudLoading}
                onClick={onDeleteStudent}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {studentCrudLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete Record</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// MAP STUDENT TO PROJECT / FACULTY MODAL
// ─────────────────────────────────────────────────────────────
export interface MapStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any | null;
  allStudents?: any[];
  allProjects: any[];
  onConfirmMap: (studentId: string, projectId: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function MapStudentModal({
  isOpen,
  onClose,
  student,
  allStudents = [],
  allProjects = [],
  onConfirmMap,
  loading,
  error,
}: MapStudentModalProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [projectSearch, setProjectSearch] = useState<string>("");
  const [studentSearch, setStudentSearch] = useState<string>("");

  useEffect(() => {
    if (student) {
      setSelectedStudentId(student.id || "");
      setSelectedProjectId(student.projectId || "");
    } else {
      setSelectedStudentId("");
      setSelectedProjectId("");
    }
    setProjectSearch("");
    setStudentSearch("");
  }, [student, isOpen]);

  if (!isOpen) return null;

  const currentStudent = student || allStudents.find((s) => s.id === selectedStudentId);

  // Filter projects by search
  const filteredProjects = allProjects.filter((p) => {
    if (!projectSearch.trim()) return true;
    const q = projectSearch.toLowerCase();
    return (
      p.projectId?.toLowerCase().includes(q) ||
      p.title?.toLowerCase().includes(q) ||
      p.facultyName?.toLowerCase().includes(q) ||
      p.department?.toLowerCase().includes(q)
    );
  });

  // Filter selectable students if student is not pre-selected
  const selectableStudents = allStudents.filter((s) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.enrollment?.toLowerCase().includes(q);
  });

  const selectedProject = allProjects.find((p) => p.id === selectedProjectId || p.projectId === selectedProjectId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedProjectId) return;
    const ok = await onConfirmMap(selectedStudentId, selectedProjectId);
    if (ok) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#cda34f]" />
              <h3 className="text-xl font-bold text-[#0d2137]">
                {student?.registered ? "Reassign Student to Faculty Guide" : "Map Student to Faculty Guide"}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Allocate or change the research project guide assignment for this student.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Target Student Info / Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Student *
            </label>
            {student ? (
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-[#0d2137] block">{student.name}</span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                    <span>{student.enrollment}</span>
                    <span>·</span>
                    <span>{student.department}</span>
                  </div>
                </div>
                {student.registered ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Currently: {student.projectCode}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    Unassigned
                  </span>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Filter student by name or enrollment..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#0d2137]"
                />
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  required
                >
                  <option value="">-- Choose Student to Map --</option>
                  {selectableStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.enrollment} · {st.name} ({st.department}) {st.registered ? `[Current: ${st.projectCode}]` : "[Unregistered]"}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Project & Faculty Mentor Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Target Project &amp; Faculty Mentor *
              </label>
              <span className="text-[11px] text-slate-400">
                {filteredProjects.length} projects available
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search project title, ID, faculty guide..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#0d2137]"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                required
                size={6}
              >
                {filteredProjects.map((p) => {
                  const seatsText = p.seatsFilled !== undefined && p.maxSeats !== undefined
                    ? `(${p.seatsFilled}/${p.maxSeats} seats)`
                    : "";
                  return (
                    <option key={p.id} value={p.id} className="py-1">
                      {p.projectId}: {p.title} — Guide: {p.facultyName || p.faculty} {seatsText}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Mapping Summary Preview */}
          {selectedProject && (
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 text-xs space-y-1.5 animate-in fade-in">
              <span className="font-bold text-amber-950 block">Allocation Summary:</span>
              <div className="text-[11px] text-amber-900 leading-relaxed space-y-0.5">
                <p>
                  <strong>Student:</strong> {currentStudent?.name || "Selected Student"} ({currentStudent?.enrollment})
                </p>
                <p>
                  <strong>Faculty Guide:</strong> {selectedProject.facultyName || selectedProject.faculty}
                </p>
                <p>
                  <strong>Project Title:</strong> {selectedProject.title} ({selectedProject.projectId})
                </p>
                <p>
                  <strong>Status:</strong> Approved
                </p>
              </div>
            </div>
          )}

          <div className="mt-5 flex gap-2 justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedStudentId || !selectedProjectId}
              className="px-5 py-2 rounded-xl bg-[#0d2137] text-white text-xs font-semibold hover:bg-[#163456] transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mapping...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Confirm Allocation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// UNMAP / REMOVE STUDENT FROM PROJECT CONFIRMATION MODAL
// ─────────────────────────────────────────────────────────────
export interface UnmapStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any | null;
  onConfirmUnmap: (registrationIdOrStudentId: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function UnmapStudentModal({
  isOpen,
  onClose,
  student,
  onConfirmUnmap,
  loading,
  error,
}: UnmapStudentModalProps) {
  if (!isOpen || !student) return null;

  const handleUnmap = async () => {
    const targetId = student.registrationId || student.id;
    const ok = await onConfirmUnmap(targetId);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl relative">
        <div className="w-10 h-1 bg-amber-500 rounded-full mb-3" />
        <h3 className="text-lg font-bold text-[#0d2137]">Remove Student Mapping</h3>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Are you sure you want to unmap <strong className="text-[#0d2137]">{student.name || student.studentName}</strong> (
          <span className="font-mono">{student.enrollment}</span>) from project{" "}
          <strong className="text-[#0d2137]">{student.projectCode}</strong>?
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          This frees up a seat under guide <strong>{student.facultyName}</strong> and marks the student as unregistered. The student account itself is NOT deleted.
        </p>

        {error && (
          <div className="mt-3 p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleUnmap}
            className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>Unmap Student</span>
          </button>
        </div>
      </div>
    </div>
  );
}
