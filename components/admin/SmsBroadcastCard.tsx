import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Users,
  School,
  Sparkles,
} from "lucide-react";

interface SmsBroadcastCardProps {
  schools: string[];
}

export function SmsBroadcastCard({ schools }: SmsBroadcastCardProps) {
  const [targetRole, setTargetRole] = useState<"ALL" | "SPOC" | "FACULTY">("ALL");
  const [selectedSchool, setSelectedSchool] = useState<string>("all");
  const [messageText, setMessageText] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/admin/sms")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  const handleApplyTemplate = (tpl: string) => {
    setMessageText(tpl);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setIsSending(true);
    setErrorMessage(null);
    setSendResult(null);

    try {
      const res = await fetch("/api/admin/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText.trim(),
          targetRole,
          department: selectedSchool,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to dispatch SMS broadcast.");
      } else {
        setSendResult(data.summary);
        setMessageText("");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error while sending SMS.");
    } finally {
      setIsSending(false);
    }
  };

  const charCount = messageText.length;
  const smsSegments = Math.ceil(charCount / 160) || 1;

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative space-y-6">
      <div className="w-10 h-1 bg-[#cda34f] rounded-full" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[#0d2137]">
              Targeted SMS Broadcast Center
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0d2137] text-white">
              ADMIN ONLY
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Send official custom SMS notifications to SPOCs and Faculty filtered by school or department.
          </p>
        </div>

        {stats && (
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <Users className="w-4 h-4 text-slate-500" />
            <span>
              Reach: <strong>{stats.totalFaculty}</strong> Faculty ({stats.totalSpocs} SPOCs)
            </span>
          </div>
        )}
      </div>

      {/* Quick Broadcast Templates */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#cda34f]" />
          <span>Quick Dispatch Templates</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() =>
              handleApplyTemplate(
                "GDGU IDP Alert: Please review and upload semester project milestone reports on the portal before this Friday's deadline."
              )
            }
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-left text-[11px] text-slate-700 transition-colors"
          >
            <div className="font-bold text-[#0d2137] mb-0.5">Milestone Submission Notice</div>
            <div className="line-clamp-2 text-slate-500">Reports deadline notification for all faculty mentors.</div>
          </button>

          <button
            type="button"
            onClick={() =>
              handleApplyTemplate(
                "SPOC Action Required: Pending student project artifacts await your inspection in the departmental review queue."
              )
            }
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-left text-[11px] text-slate-700 transition-colors"
          >
            <div className="font-bold text-[#0d2137] mb-0.5">SPOC Review Action</div>
            <div className="line-clamp-2 text-slate-500">Urgent document inspection request for department SPOCs.</div>
          </button>

          <button
            type="button"
            onClick={() =>
              handleApplyTemplate(
                "GDGU CIE Compliance: Turnitin report (<10% similarity) and signed self-declaration are mandatory for final sign-off."
              )
            }
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-left text-[11px] text-slate-700 transition-colors"
          >
            <div className="font-bold text-[#0d2137] mb-0.5">Turnitin & Plagiarism Alert</div>
            <div className="line-clamp-2 text-slate-500">Plagiarism threshold compliance reminder.</div>
          </button>
        </div>
      </div>

      {/* Broadcast Form */}
      <form onSubmit={handleSendBroadcast} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Target Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Recipient Role *
            </label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137] bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Faculty & SPOCs</option>
              <option value="SPOC">Department SPOCs Only</option>
              <option value="FACULTY">Faculty Mentors Only</option>
            </select>
          </div>

          {/* School Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              School / Department Filter *
            </label>
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137] bg-white font-medium text-slate-700"
            >
              <option value="all">All Schools & Departments (University Wide)</option>
              {schools.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Message Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700">
              Custom SMS Content *
            </label>
            <span className="text-[11px] text-slate-400">
              {charCount} / 160 chars ({smsSegments} SMS segment{smsSegments > 1 ? "s" : ""})
            </span>
          </div>
          <textarea
            rows={3}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your official administrative announcement or reminder here..."
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137] leading-relaxed"
            required
          />
        </div>

        {/* Error / Success Feedback */}
        {errorMessage && (
          <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {sendResult && (
          <div className="p-4 bg-emerald-50 text-emerald-900 text-xs rounded-xl border border-emerald-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>SMS Broadcast Successfully Dispatched!</span>
            </div>
            <div className="text-[11px] text-emerald-700">
              Delivered to <strong>{sendResult.sentCount}</strong> recipient(s) across selected criteria.
              {sendResult.failedCount > 0 && ` (${sendResult.failedCount} failed due to missing mobile records)`}
            </div>

            {/* Recipient summary pills */}
            <div className="pt-2 flex flex-wrap gap-1 max-h-32 overflow-y-auto">
              {sendResult.recipients.slice(0, 15).map((r: any, idx: number) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[10px] bg-white border border-emerald-300 text-emerald-900 font-medium"
                >
                  {r.name} ({r.role}) - {r.status}
                </span>
              ))}
              {sendResult.recipients.length > 15 && (
                <span className="text-[10px] text-emerald-700 italic self-center">
                  +{sendResult.recipients.length - 15} more...
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSending || !messageText.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#0d2137] text-white text-xs font-semibold hover:bg-[#163456] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-[#cda34f]" />
            )}
            <span>{isSending ? "Dispatching SMS..." : "Send Targeted SMS"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
