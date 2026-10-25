import React from "react";
import { Plus, Edit2, Trash2, Shield, ShieldCheck, KeyRound, UserCheck, ArrowRightLeft } from "lucide-react";
import { FacultyRecord, SystemAdminRecord } from "@/types/admin";

interface FacultyAccessCardProps {
  faculties: FacultyRecord[];
  systemAdmins?: SystemAdminRecord[];
  onAddClick: () => void;
  onEditClick: (f: FacultyRecord) => void;
  onDeleteClick: (f: FacultyRecord) => void;
  onToggleAdmin: (id: string, currentIsAdmin: boolean) => void;
  onResetPasscodeClick: (f: FacultyRecord) => void;
  onReplaceClick?: (f: FacultyRecord) => void;
  onAddAdminClick?: () => void;
  onDeleteAdminClick?: (adminId: string, adminName: string) => void;
}

export function FacultyAccessCard({
  faculties,
  systemAdmins = [],
  onAddClick,
  onEditClick,
  onDeleteClick,
  onToggleAdmin,
  onResetPasscodeClick,
  onReplaceClick,
  onAddAdminClick,
  onDeleteAdminClick,
}: FacultyAccessCardProps) {
  return (
    <div className="space-y-6">
      {/* System Administrators Section */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative">
        <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#cda34f]" />
              <h2 className="text-base sm:text-lg font-bold text-[#0d2137]">
                System Administrators ({systemAdmins.length})
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Superuser administrator accounts with full privileges over all portals, database operations, and system settings.
            </p>
          </div>
          {onAddAdminClick && (
            <button
              type="button"
              onClick={onAddAdminClick}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#0d2137] text-white hover:bg-[#163456] flex items-center gap-1.5 shadow-sm transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Admin</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {systemAdmins.length === 0 ? (
            <div className="col-span-full py-4 text-center text-xs text-slate-400">
              No additional system administrators configured.
            </div>
          ) : (
            systemAdmins.map((adm) => (
              <div
                key={adm.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between transition-colors"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-[#0d2137] truncate">{adm.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#0d2137]/10 text-[#0d2137]">
                      SUPERADMIN
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5">{adm.email}</p>
                </div>
                {onDeleteAdminClick && systemAdmins.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onDeleteAdminClick(adm.id, adm.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    title="Remove System Administrator"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Faculty Roster & Access Controls */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative">
        <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#0d2137]">
              Faculty Roster &amp; Administrative Roles ({faculties.length})
            </h2>
            <p className="text-xs text-slate-500">
              Grant or revoke administrative dashboard access, assign SPOC designations, manage faculty details, or reset passcodes.
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

        <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#0d2137] text-white sticky top-0 z-10">
                <th className="py-2.5 px-3 font-semibold">NAME</th>
                <th className="py-2.5 px-3 font-semibold">EMAIL</th>
                <th className="py-2.5 px-3 font-semibold">PHONE</th>
                <th className="py-2.5 px-3 font-semibold">DEPARTMENT</th>
                <th className="py-2.5 px-3 font-semibold text-center">ADMIN</th>
                <th className="py-2.5 px-3 font-semibold text-center">SPOC</th>
                <th className="py-2.5 px-3 font-semibold text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {faculties.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-medium text-[#0d2137]">
                    <div className="flex items-center gap-1.5">
                      <span>{f.name}</span>
                      {f.isAdmin && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          Admin
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">{f.email}</td>
                  <td className="py-2.5 px-3 font-mono text-xs">
                    {f.phone ? (
                      <span className="text-emerald-700 font-semibold">+91 {f.phone}</span>
                    ) : (
                      <span className="text-amber-600 text-[11px] font-medium italic">Pending</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{f.department}</td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleAdmin(f.id, f.isAdmin)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors border ${
                        f.isAdmin
                          ? "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200"
                          : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                      }`}
                      title={f.isAdmin ? "Click to revoke admin access" : "Click to grant admin access"}
                    >
                      {f.isAdmin ? "Admin: Enabled" : "No Admin"}
                    </button>
                  </td>
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
                        title="Edit Faculty Name & Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {onReplaceClick && (
                        <button
                          type="button"
                          onClick={() => onReplaceClick(f)}
                          className="p-1 rounded text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition-colors"
                          title="Replace Faculty / Transfer Projects to Another Faculty"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>
                      )}
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
    </div>
  );
}
