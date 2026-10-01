import React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { FacultyRecord } from "@/types/admin";

interface SpocManagementCardProps {
  spocDepartments: string[];
  spocsByDept: Record<string, any[]>;
  faculties: FacultyRecord[];
  selectedFacultyForDept: Record<string, string>;
  setSelectedFacultyForDept: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  spocUpdating: string | null;
  onAssignSpoc: (dept: string, facultyId: string) => void;
  onRevokeSpoc: (dept: string, facultyId: string) => void;
}

export function SpocManagementCard({
  spocDepartments,
  spocsByDept,
  faculties,
  selectedFacultyForDept,
  setSelectedFacultyForDept,
  spocUpdating,
  onAssignSpoc,
  onRevokeSpoc,
}: SpocManagementCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative">
      <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#0d2137]">
            Department SPOC (Single Point of Contact) Management
          </h2>
          <p className="text-xs text-slate-500">
            Designate faculty members as department SPOCs to verify project documents, enforce plagiarism guidelines, and review student rosters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {spocDepartments.map((dept) => {
          const currentSpocs = spocsByDept[dept] || [];
          const deptFaculty = faculties.filter((f) => f.department === dept);
          const selectedFaculty = selectedFacultyForDept[dept] || "";

          return (
            <div
              key={dept}
              className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 flex flex-col justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-bold text-[#0d2137] text-xs line-clamp-1" title={dept}>
                    {dept}
                  </span>
                  <Link
                    href="/spoc/portal"
                    className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-0.5 flex-shrink-0"
                  >
                    <span>View Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                {/* Current SPOC info */}
                <div className="mt-2 p-2.5 bg-white rounded-lg border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Active SPOC Profile:
                    </span>
                    {currentSpocs.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </div>
                  {currentSpocs.length > 0 ? (
                    <div className="space-y-2">
                      {currentSpocs.map((s) => (
                        <div key={s.id} className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-900 line-clamp-1">
                              {s.facultyName && s.facultyName !== "N/A" ? s.facultyName : s.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => onRevokeSpoc(dept, s.facultyId || s.id)}
                              disabled={spocUpdating === dept}
                              className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:underline flex-shrink-0"
                            >
                              Revoke
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center justify-between">
                            <span>Faculty Email:</span>
                            <span className="font-mono text-slate-700">{s.facultyEmail || "N/A"}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center justify-between bg-white px-2 py-1 rounded border border-slate-200">
                            <span className="font-semibold text-[#0d2137]">SPOC Login ID:</span>
                            <span className="font-mono font-bold text-[#0d2137] select-all">{s.email}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-xs block py-1">No SPOC assigned</span>
                  )}
                </div>
              </div>

              {/* Assign new SPOC dropdown */}
              <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
                <select
                  value={selectedFaculty}
                  onChange={(e) =>
                    setSelectedFacultyForDept((prev) => ({
                      ...prev,
                      [dept]: e.target.value,
                    }))
                  }
                  className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none"
                >
                  <option value="">Select faculty to assign...</option>
                  {deptFaculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => onAssignSpoc(dept, selectedFaculty)}
                  disabled={!selectedFaculty || spocUpdating === dept}
                  className="px-3 py-1.5 rounded-lg bg-[#0d2137] hover:bg-[#1a3a60] text-white text-[11px] font-bold shadow-sm disabled:opacity-40 transition-all flex-shrink-0"
                >
                  {spocUpdating === dept ? "Saving..." : "Assign"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
