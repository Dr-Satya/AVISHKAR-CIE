import React from "react";
import { Plus, CheckCircle2, Trash2, Loader2, X } from "lucide-react";
import { FacultyFormData, FacultyRecord } from "@/types/admin";

interface FacultyModalsProps {
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
  showEditModal: boolean;
  setShowEditModal: (show: boolean) => void;
  showDeleteModal: boolean;
  setShowDeleteModal: (show: boolean) => void;
  selectedResetFaculty: FacultyRecord | null;
  setSelectedResetFaculty: (f: FacultyRecord | null) => void;
  facultyForm: FacultyFormData;
  setFacultyForm: React.Dispatch<React.SetStateAction<FacultyFormData>>;
  facultyCrudLoading: boolean;
  facultyCrudError: string | null;
  newPasscodeInput: string;
  setNewPasscodeInput: (p: string) => void;
  resetPasscodeLoading: boolean;
  resetPasscodeMessage: { type: "success" | "error"; text: string } | null;
  setResetPasscodeMessage: (msg: { type: "success" | "error"; text: string } | null) => void;
  onAddFaculty: (e: React.FormEvent) => void;
  onUpdateFaculty: (e: React.FormEvent) => void;
  onDeleteFaculty: () => void;
  onResetPasscode: (e: React.FormEvent) => void;
}

export function FacultyModals({
  showAddModal,
  setShowAddModal,
  showEditModal,
  setShowEditModal,
  showDeleteModal,
  setShowDeleteModal,
  selectedResetFaculty,
  setSelectedResetFaculty,
  facultyForm,
  setFacultyForm,
  facultyCrudLoading,
  facultyCrudError,
  newPasscodeInput,
  setNewPasscodeInput,
  resetPasscodeLoading,
  resetPasscodeMessage,
  setResetPasscodeMessage,
  onAddFaculty,
  onUpdateFaculty,
  onDeleteFaculty,
  onResetPasscode,
}: FacultyModalsProps) {
  return (
    <>
      {/* Add Faculty Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#0d2137]">Register New Faculty</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add faculty profiles, assign departments, and configure administrative permissions.
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

            {facultyCrudError && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {facultyCrudError}
              </div>
            )}

            <form onSubmit={onAddFaculty} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Faculty Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Annu Rani"
                  value={facultyForm.name}
                  onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. annu.rani@gdgu.org"
                    value={facultyForm.email}
                    onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={facultyForm.phone}
                    onChange={(e) => setFacultyForm({ ...facultyForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department *
                </label>
                <input
                  type="text"
                  value={facultyForm.department}
                  onChange={(e) => setFacultyForm({ ...facultyForm, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Passcode
                </label>
                <input
                  type="text"
                  value={facultyForm.passcode}
                  onChange={(e) => setFacultyForm({ ...facultyForm, passcode: e.target.value })}
                  placeholder="Defaults to gdgu@2026"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                />
              </div>

              <div className="pt-2 space-y-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={facultyForm.isAdmin}
                    onChange={(e) => setFacultyForm({ ...facultyForm, isAdmin: e.target.checked })}
                    className="rounded text-[#0d2137] focus:ring-[#0d2137] w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-slate-700">Grant Admin Dashboard Access</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={facultyForm.isSpoc}
                    onChange={(e) => setFacultyForm({ ...facultyForm, isSpoc: e.target.checked })}
                    className="rounded text-[#0d2137] focus:ring-[#0d2137] w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-slate-700">Designate as Department SPOC</span>
                </label>

                {facultyForm.isSpoc && (
                  <div className="pl-6 pt-1">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Assigned SPOC Department
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. School of Engineering & Sciences"
                      value={facultyForm.spocDepartment}
                      onChange={(e) => setFacultyForm({ ...facultyForm, spocDepartment: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#0d2137]"
                    />
                  </div>
                )}
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
                  disabled={facultyCrudLoading}
                  className="px-5 py-2 rounded-xl bg-[#0d2137] text-white text-xs font-semibold hover:bg-[#163456] transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {facultyCrudLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Save Faculty</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Faculty Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#0d2137]">Edit Faculty Member</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update faculty profile, department, and role designations.
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

            {facultyCrudError && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {facultyCrudError}
              </div>
            )}

            <form onSubmit={onUpdateFaculty} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Faculty Full Name *
                </label>
                <input
                  type="text"
                  value={facultyForm.name}
                  onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={facultyForm.email}
                    onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={facultyForm.phone}
                    onChange={(e) => setFacultyForm({ ...facultyForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department *
                </label>
                <input
                  type="text"
                  value={facultyForm.department}
                  onChange={(e) => setFacultyForm({ ...facultyForm, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  required
                />
              </div>

              <div className="pt-2 space-y-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={facultyForm.isAdmin}
                    onChange={(e) => setFacultyForm({ ...facultyForm, isAdmin: e.target.checked })}
                    className="rounded text-[#0d2137] focus:ring-[#0d2137] w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-slate-700">Admin Dashboard Access</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={facultyForm.isSpoc}
                    onChange={(e) => setFacultyForm({ ...facultyForm, isSpoc: e.target.checked })}
                    className="rounded text-[#0d2137] focus:ring-[#0d2137] w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-slate-700">Department SPOC</span>
                </label>

                {facultyForm.isSpoc && (
                  <div className="pl-6 pt-1">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Assigned SPOC Department
                    </label>
                    <input
                      type="text"
                      value={facultyForm.spocDepartment}
                      onChange={(e) => setFacultyForm({ ...facultyForm, spocDepartment: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#0d2137]"
                    />
                  </div>
                )}
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
                  disabled={facultyCrudLoading}
                  className="px-5 py-2 rounded-xl bg-[#0d2137] text-white text-xs font-semibold hover:bg-[#163456] transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {facultyCrudLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Update Faculty</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Faculty Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl relative">
            <div className="w-10 h-1 bg-red-600 rounded-full mb-3" />
            <h3 className="text-lg font-bold text-[#0d2137]">Confirm Faculty Removal</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Are you sure you want to delete faculty member{" "}
              <strong className="text-[#0d2137]">{facultyForm.name}</strong> ({facultyForm.email})?
            </p>

            {facultyCrudError && (
              <div className="mt-3 p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {facultyCrudError}
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
                disabled={facultyCrudLoading}
                onClick={onDeleteFaculty}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {facultyCrudLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Password Reset Modal */}
      {selectedResetFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-xl relative">
            <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
            <h3 className="text-lg font-bold text-[#0d2137]">Reset Passcode</h3>
            <p className="text-xs text-slate-600 mt-1">
              Assign a new passcode for{" "}
              <span className="font-semibold text-[#0d2137]">
                {selectedResetFaculty.name}
              </span>{" "}
              ({selectedResetFaculty.email})
            </p>

            {resetPasscodeMessage && (
              <div
                className={`mt-4 p-3 rounded-xl text-xs font-medium border ${
                  resetPasscodeMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}
              >
                {resetPasscodeMessage.text}
              </div>
            )}

            <form onSubmit={onResetPasscode} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Passcode
                </label>
                <input
                  type="text"
                  value={newPasscodeInput}
                  onChange={(e) => setNewPasscodeInput(e.target.value)}
                  placeholder="Enter new passcode (min 6 chars)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewPasscodeInput("gdgu@2026")}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  Set to default (gdgu@2026)
                </button>
              </div>

              <div className="mt-5 flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  disabled={resetPasscodeLoading}
                  onClick={() => {
                    setSelectedResetFaculty(null);
                    setResetPasscodeMessage(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetPasscodeLoading || !newPasscodeInput}
                  className="px-4 py-2 rounded-xl bg-[#0d2137] text-white text-xs font-semibold hover:bg-[#163456] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {resetPasscodeLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Save New Passcode</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
