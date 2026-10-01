import React from "react";
import { Plus, CheckCircle2, Trash2, Loader2, X } from "lucide-react";
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
                    placeholder="e.g. 24001011001"
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
                    Internals (/40)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    placeholder="e.g. 32"
                    value={studentForm.internalMarks ?? 32}
                    onChange={(e) => setStudentForm({ ...studentForm, internalMarks: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Externals (/60)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    placeholder="e.g. 48"
                    value={studentForm.externalMarks ?? 48}
                    onChange={(e) => setStudentForm({ ...studentForm, externalMarks: parseFloat(e.target.value) || 0 })}
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
                    Internals (/40)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    value={studentForm.internalMarks ?? 32}
                    onChange={(e) => setStudentForm({ ...studentForm, internalMarks: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Externals (/60)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={studentForm.externalMarks ?? 48}
                    onChange={(e) => setStudentForm({ ...studentForm, externalMarks: parseFloat(e.target.value) || 0 })}
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
