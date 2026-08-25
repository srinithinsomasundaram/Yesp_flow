"use client";

import { useState } from "react";
import { UserPlus, X, Loader2 } from "lucide-react";
import { importContacts } from "@/actions/contacts";

const TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const CONTACT_STATUSES = [
  "New",
  "Active",
  "Replied",
  "Interested",
  "Not Interested",
  "Do Not Contact",
  "Unsubscribed",
];

export function ManualContactForm({ campaigns }: { campaigns: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [status, setStatus] = useState("New");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");

  const resetForm = () => {
    setEmail("");
    setFirstName("");
    setLastName("");
    setCompany("");
    setJobTitle("");
    setPhone("");
    setWebsite("");
    setIndustry("");
    setCity("");
    setTimezone("Asia/Kolkata");
    setStatus("New");
    setSelectedCampaignId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);

    const result = await importContacts(
      [
        {
          email,
          firstName,
          lastName,
          name: [firstName, lastName].filter(Boolean).join(" ") || undefined,
          company,
          jobTitle,
          phone,
          website,
          industry,
          city,
          timezone,
          status,
        },
      ],
      selectedCampaignId || undefined
    );

    setIsSubmitting(false);

    if (result.success) {
      setIsOpen(false);
      resetForm();
    } else {
      alert("Error adding contact");
    }
  };

  const inputClass =
    "w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white";
  const labelClass = "text-xs font-semibold text-slate-600 block mb-1";

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-secondary px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 text-xs"
      >
        <UserPlus className="w-4 h-4 text-blue-600" /> Add Contact
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <UserPlus className="w-4 h-4 text-blue-600" /> Add Contact
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {/* Email */}
              <div>
                <label className={labelClass}>Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="contact@company.com"
                />
              </div>

              {/* First + Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={inputClass}
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className={labelClass}>Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inputClass}
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* Company + Job Title */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Company</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className={inputClass}
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <label className={labelClass}>Job Title</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className={inputClass}
                    placeholder="Head of Growth"
                  />
                </div>
              </div>

              {/* Phone + Website */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                    placeholder="+1 555 000 0000"
                  />
                </div>
                <div>
                  <label className={labelClass}>Website</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className={inputClass}
                    placeholder="https://acme.com"
                  />
                </div>
              </div>

              {/* Industry + City */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Industry</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className={inputClass}
                    placeholder="SaaS"
                  />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={inputClass}
                    placeholder="San Francisco"
                  />
                </div>
              </div>

              {/* Timezone + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className={inputClass}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={inputClass}
                  >
                    {CONTACT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Campaign selector */}
              <div>
                <label className={labelClass}>Add to Campaign (Optional)</label>
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">-- None --</option>
                  {campaigns.map((camp) => (
                    <option key={camp.id} value={camp.id}>
                      {camp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="btn-primary px-6 py-2 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
