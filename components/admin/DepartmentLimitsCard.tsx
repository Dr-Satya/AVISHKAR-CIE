import React from "react";
import { Trash2 } from "lucide-react";
import { DeptLimit } from "@/types/admin";

interface DepartmentLimitsCardProps {
  deptLimits: DeptLimit[];
  deptInput: string;
  setDeptInput: (v: string) => void;
  sameDeptInput: string;
  setSameDeptInput: (v: string) => void;
  otherDeptInput: string;
  setOtherDeptInput: (v: string) => void;
  deptSaving: boolean;
  onSave: (e: React.FormEvent) => void;
  onDelete: (id: string) => void;
}

export function DepartmentLimitsCard({
  deptLimits,
  deptInput,
  setDeptInput,
  sameDeptInput,
  setSameDeptInput,
  otherDeptInput,
  setOtherDeptInput,
  deptSaving,
  onSave,
  onDelete,
}: DepartmentLimitsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative">
      <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
      <h2 className="text-base sm:text-lg font-bold text-[#0d2137] mb-1">
        Department-wise Registration Limits
      </h2>
      <p className="text-xs text-slate-500 mb-5 leading-relaxed max-w-4xl">
        Set a Same-Department and Other-Department seat limit per department (e.g. CSE: Same 5 / Other 2, Civil: Same 4 / Other 3). This applies to every project whose faculty belongs to that department, overriding both that project&apos;s own limits and the global defaults above. A department left unset here just falls back to the project&apos;s own limits, then the global defaults.
      </p>

      <form onSubmit={onSave} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
          <input
            type="text"
            placeholder="Enter department name"
            value={deptInput}
            onChange={(e) => setDeptInput(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Same Dept Limit</label>
          <input
            type="number"
            min="0"
            value={sameDeptInput}
            onChange={(e) => setSameDeptInput(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Other Dept Limit</label>
          <input
            type="number"
            min="0"
            value={otherDeptInput}
            onChange={(e) => setOtherDeptInput(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
            required
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={deptSaving}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0d2137] hover:bg-[#163456] text-white font-medium text-xs sm:text-sm transition-colors"
          >
            {deptSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>

      {/* Department Limits Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#0d2137] text-white">
              <th className="py-2.5 px-4 font-semibold">DEPARTMENT</th>
              <th className="py-2.5 px-4 font-semibold">SAME DEPT LIMIT</th>
              <th className="py-2.5 px-4 font-semibold">OTHER DEPT LIMIT</th>
              <th className="py-2.5 px-4 font-semibold text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deptLimits.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 px-4 text-center text-slate-400">
                  No department-specific limits set yet. Projects fall back to their own limits, then the global defaults above.
                </td>
              </tr>
            ) : (
              deptLimits.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-[#0d2137]">{l.department}</td>
                  <td className="py-3 px-4 text-slate-600">{l.sameDeptLimit}</td>
                  <td className="py-3 px-4 text-slate-600">{l.otherDeptLimit}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onDelete(l.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
