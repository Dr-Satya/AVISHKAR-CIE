import React from "react";
import { Search, Loader2 } from "lucide-react";
import { PaginationBar } from "@/components/common/PaginationBar";

interface ProjectsTableCardProps {
  projects: any[];
  projectTotal: number;
  projectSearch: string;
  setProjectSearch: (v: string) => void;
  projectCategoryFilter: string;
  setProjectCategoryFilter: (v: string) => void;
  projectPage: number;
  projectTotalPages: number;
  loadingProjects: boolean;
  onFetchProjects: (page: number, search?: string, cat?: string) => void;
}

export function ProjectsTableCard({
  projects,
  projectTotal,
  projectSearch,
  setProjectSearch,
  projectCategoryFilter,
  setProjectCategoryFilter,
  projectPage,
  projectTotalPages,
  loadingProjects,
  onFetchProjects,
}: ProjectsTableCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative">
      <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h2 className="text-base sm:text-lg font-bold text-[#0d2137]">
          Projects ({projectTotal})
        </h2>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search project ID or title..."
              aria-label="Search projects by ID or title"
              value={projectSearch}
              onChange={(e) => {
                setProjectSearch(e.target.value);
                onFetchProjects(1, e.target.value, projectCategoryFilter);
              }}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#0d2137] w-48 sm:w-64"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <select
            value={projectCategoryFilter}
            aria-label="Filter projects by category"
            onChange={(e) => {
              setProjectCategoryFilter(e.target.value);
              onFetchProjects(1, projectSearch, e.target.value);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none bg-white"
          >
            <option value="all">All Categories</option>
            <option value="IDP2501">IDP2501</option>
            <option value="IDP2502">IDP2502</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#0d2137] text-white">
              <th className="py-2.5 px-3 font-semibold">PROJECT ID</th>
              <th className="py-2.5 px-3 font-semibold">TITLE</th>
              <th className="py-2.5 px-3 font-semibold">FACULTY</th>
              <th className="py-2.5 px-3 font-semibold">DEPARTMENT</th>
              <th className="py-2.5 px-3 font-semibold">THEME</th>
              <th className="py-2.5 px-3 font-semibold">CATEGORY</th>
              <th className="py-2.5 px-3 font-semibold">SEATS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loadingProjects ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#0d2137]" />
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400">
                  No projects found.
                </td>
              </tr>
            ) : (
              projects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-mono font-bold text-[#0d2137]">{p.projectId}</td>
                  <td className="py-3 px-3 font-medium text-slate-800 max-w-xs">{p.title}</td>
                  <td className="py-3 px-3 text-slate-700">{p.faculty}</td>
                  <td className="py-3 px-3 text-slate-600">{p.department}</td>
                  <td className="py-3 px-3 text-slate-600">{p.theme}</td>
                  <td className="py-3 px-3 text-slate-600">{p.category}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{p.seatsRatio}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaginationBar
        page={projectPage}
        totalPages={projectTotalPages}
        totalItems={projectTotal}
        disabled={loadingProjects}
        onPageChange={(newPage) =>
          onFetchProjects(newPage, projectSearch, projectCategoryFilter)
        }
      />
    </div>
  );
}
