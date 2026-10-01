import React from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { FacultyRecord } from "@/types/admin";

interface FacultyAccessCardProps {
  faculties: FacultyRecord[];
  onAddClick: () => void;
  onEditClick: (f: FacultyRecord) => void;
  onDeleteClick: (f: FacultyRecord) => void;
  onToggleAdmin: (id: string, currentIsAdmin: boolean) => void;
  onResetPasscodeClick: (f: FacultyRecord) => void;
}

export function FacultyAccessCard({
  faculties,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onToggleAdmin,
  onResetPasscodeClick,
}: FacultyAccessCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative">
      <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#0d2137]">
            Faculty Access &amp; Administrative Roles
          </h2>
          <p className="text-xs text-slate-500">
            Grant or revoke administrative dashboard and SPOC access, manage faculty rosters, or update credentials.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddClick}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0d2137] text-white hover:bg-[#163456] flex items-center gap-1 shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Faculty</span>
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#0d2137] text-white">
              <th className="py-2.5 px-3 font-semibold">NAME</th>
              <th className="py-2.5 px-3 font-semibold">EMAIL</th>
              <th className="py-2.5 px-3 font-semibold">DEPARTMENT</th>
              <th className="py-2.5 px-3 font-semibold text-center">SPOC STATUS</th>
              <th className="py-2.5 px-3 font-semibold text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {faculties.map((f) => (
              <tr key={f.id} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-medium text-[#0d2137]">{f.name}</td>
                <td className="py-2.5 px-3 text-slate-600">{f.email}</td>
                <td className="py-2.5 px-3 text-slate-500">{f.department}</td>
                <td className="py-2.5 px-3 text-center">
                  {f.isSpoc ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      SPOC: {f.spocDepartment || f.department}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">No</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onEditClick(f)}
                      className="p-1 rounded text-slate-600 hover:text-[#0d2137] hover:bg-slate-200 transition-colors"
                      title="Edit Faculty"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteClick(f)}
                      className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                      title="Delete Faculty"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleAdmin(f.id, f.isAdmin)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors ${
                        f.isAdmin
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {f.isAdmin ? "Revoke Admin" : "Grant Admin"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onResetPasscodeClick(f)}
                      className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      Reset Passcode
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
