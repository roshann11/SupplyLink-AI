"use client";

import { useEffect, useState } from "react";
import { rfqsApi, RFQResponse, QuoteResponse } from "@/lib/api-client";
import { Plus, X, Search, Globe, FolderOpen, Calendar, DollarSign, Archive, Award, CheckCircle } from "lucide-react";

export default function RFQsPage() {
  const [activeTab, setActiveTab] = useState<"board" | "my">("board");
  const [rfqs, setRfqs] = useState<RFQResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Detailed RFQ view state
  const [selectedRfq, setSelectedRfq] = useState<RFQResponse | null>(null);
  const [quotes, setQuotes] = useState<QuoteResponse[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);

  // New RFQ Form
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [rfqForm, setRfqForm] = useState({
    title: "",
    description: "",
    quantity: "1",
    target_price: "",
    expires_at: "",
  });
  const [rfqError, setRfqError] = useState<string | null>(null);

  // Quote Bid Form
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [bidForm, setBidForm] = useState({
    price: "",
    lead_time_days: "5",
    notes: "",
  });
  const [bidError, setBidError] = useState<string | null>(null);

  useEffect(() => {
    loadRfqs();
    setSelectedRfq(null);
  }, [activeTab]);

  function loadRfqs() {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    if (activeTab === "my" && token) {
      rfqsApi
        .listMy(token)
        .then(setRfqs)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      rfqsApi
        .listOpen(token || "")
        .then(setRfqs)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }

  async function handleSelectRfq(rfq: RFQResponse) {
    setSelectedRfq(rfq);
    setQuotes([]);
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setQuotesLoading(true);
    try {
      const data = await rfqsApi.listQuotes(rfq.id, token);
      setQuotes(data);
    } catch (err) {
      console.error("Error loading quotes", err);
    } finally {
      setQuotesLoading(false);
    }
  }

  async function handleCreateRfq(e: React.FormEvent) {
    e.preventDefault();
    setRfqError(null);
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const data = {
      ...rfqForm,
      quantity: parseInt(rfqForm.quantity) || 1,
      target_price: rfqForm.target_price ? parseFloat(rfqForm.target_price) : null,
      expires_at: rfqForm.expires_at ? new Date(rfqForm.expires_at).toISOString() : null,
    };

    try {
      await rfqsApi.create(data, token);
      setIsRfqModalOpen(false);
      loadRfqs();
    } catch (err) {
      setRfqError(err instanceof Error ? err.message : "Error creating RFQ");
    }
  }

  async function handleSubmitQuote(e: React.FormEvent) {
    e.preventDefault();
    setBidError(null);
    const token = localStorage.getItem("access_token");
    if (!token || !selectedRfq) return;

    const data = {
      price: parseFloat(bidForm.price) || 0,
      lead_time_days: parseInt(bidForm.lead_time_days) || 1,
      notes: bidForm.notes || null,
    };

    try {
      await rfqsApi.submitQuote(selectedRfq.id, data, token);
      setIsBidModalOpen(false);
      // Reload quotes
      handleSelectRfq(selectedRfq);
    } catch (err) {
      setBidError(err instanceof Error ? err.message : "Error submitting quote");
    }
  }

  async function handleAwardQuote(quoteId: string) {
    if (!confirm("Are you sure you want to award this bid? This will close the RFQ.")) return;
    const token = localStorage.getItem("access_token");
    if (!token || !selectedRfq) return;

    try {
      const updatedRfq = await rfqsApi.awardQuote(selectedRfq.id, quoteId, token);
      setSelectedRfq(updatedRfq);
      loadRfqs();
      // Reload quotes
      const updatedQuotes = await rfqsApi.listQuotes(selectedRfq.id, token);
      setQuotes(updatedQuotes);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error awarding quote");
    }
  }

  const filteredRfqs = rfqs.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3 font-sans animate-fade-in">
      {/* List Panel */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">RFQ Workspace</h2>
            <p className="mt-1 text-sm text-slate-500">
              Submit bids to active buyers or request manufacturing quotes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-48">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => {
                setRfqForm({ title: "", description: "", quantity: "1", target_price: "", expires_at: "" });
                setRfqError(null);
                setIsRfqModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create RFQ
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("board")}
            className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition-colors ${
              activeTab === "board"
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Globe className="h-4 w-4" />
            Open Bids Board
          </button>
          <button
            onClick={() => setActiveTab("my")}
            className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition-colors ${
              activeTab === "my"
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            My RFQs
          </button>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
          </div>
        ) : filteredRfqs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-16 text-center">
            <Archive className="h-12 w-12 text-slate-300 mx-auto" />
            <h3 className="mt-4 text-lg font-bold text-slate-800">No RFQs found</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
              {activeTab === "my"
                ? "You haven't posted any RFQs yet. Create a quote request to source suppliers."
                : "There are no open RFQs currently on the board."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRfqs.map((rfq) => (
              <div
                key={rfq.id}
                onClick={() => handleSelectRfq(rfq)}
                className={`rounded-xl border p-6 bg-white cursor-pointer hover:border-brand-300 hover:shadow-sm transition-all duration-200 ${
                  selectedRfq?.id === rfq.id ? "border-brand-500 ring-1 ring-brand-500" : "border-slate-100"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      rfq.status === "open" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-700"
                    }`}>
                      {rfq.status.toUpperCase()}
                    </span>
                    <h4 className="mt-2 text-lg font-bold text-slate-800">{rfq.title}</h4>
                  </div>
                  <p className="text-xs font-semibold text-slate-400">
                    Qty: <span className="text-slate-700 font-bold">{rfq.quantity} units</span>
                  </p>
                </div>
                <p className="mt-2 text-sm text-slate-500 line-clamp-2">{rfq.description}</p>
                
                <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-slate-400 border-t border-slate-50 pt-4">
                  {rfq.target_price && (
                    <span className="flex items-center gap-1 text-slate-600">
                      <DollarSign className="h-3.5 w-3.5" />
                      Target: {rfq.target_price.toFixed(2)}
                    </span>
                  )}
                  {rfq.expires_at && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      Expiry: {new Date(rfq.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details / Management Panel */}
      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm h-fit">
        {selectedRfq ? (
          <div className="space-y-6">
            <div>
              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                selectedRfq.status === "open" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-700"
              }`}>
                {selectedRfq.status.toUpperCase()}
              </span>
              <h3 className="mt-2 text-xl font-bold text-slate-800 tracking-tight">{selectedRfq.title}</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">{selectedRfq.description}</p>
            </div>

            <div className="grid gap-3 rounded-lg bg-slate-50 p-4 text-xs font-medium text-slate-600">
              <div className="flex justify-between">
                <span>Quantity Requested:</span>
                <span className="font-bold text-slate-800">{selectedRfq.quantity} units</span>
              </div>
              {selectedRfq.target_price && (
                <div className="flex justify-between">
                  <span>Target Budget Price:</span>
                  <span className="font-bold text-slate-800">${selectedRfq.target_price.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {activeTab === "board" && selectedRfq.status === "open" && (
              <button
                onClick={() => {
                  setBidForm({ price: "", lead_time_days: "5", notes: "" });
                  setBidError(null);
                  setIsBidModalOpen(true);
                }}
                className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
              >
                Submit Proposal Bid
              </button>
            )}

            {/* Submitted Quotes/Bids List */}
            <div className="border-t border-slate-100 pt-6">
              <h4 className="font-bold text-slate-800">Quotes & Proposals</h4>
              {quotesLoading ? (
                <div className="flex justify-center py-6">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent"></div>
                </div>
              ) : quotes.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">No quotes submitted yet.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {quotes.map((q) => (
                    <div key={q.id} className="rounded-lg border border-slate-100 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-extrabold text-slate-800">${q.price.toFixed(2)}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          q.status === "accepted" ? "bg-green-50 text-green-700" :
                          q.status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {q.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500">Lead time: {q.lead_time_days} days</p>
                      {q.notes && <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded mt-1">{q.notes}</p>}

                      {activeTab === "my" && selectedRfq.status === "open" && (
                        <button
                          onClick={() => handleAwardQuote(q.id)}
                          className="flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-700 mt-2"
                        >
                          <Award className="h-3.5 w-3.5" />
                          Award Order
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 font-medium">
            Select an RFQ from the workspace list to view pricing bids, lead times, and proposal summaries.
          </div>
        )}
      </div>

      {/* Create RFQ Modal */}
      {isRfqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl border border-slate-100 animate-scale-up mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Request Manufacturing Quote</h3>
              <button
                onClick={() => setIsRfqModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRfq} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">RFQ Title / Product Required</label>
                <input
                  required
                  placeholder="e.g. 500x Stainless Steel M8 Bolts"
                  value={rfqForm.title}
                  onChange={(e) => setRfqForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Total Quantity Required</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={rfqForm.quantity}
                    onChange={(e) => setRfqForm((f) => ({ ...f, quantity: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Target Budget (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1500"
                    value={rfqForm.target_price}
                    onChange={(e) => setRfqForm((f) => ({ ...f, target_price: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Expiration Date (Optional)</label>
                <input
                  type="date"
                  value={rfqForm.expires_at}
                  onChange={(e) => setRfqForm((f) => ({ ...f, expires_at: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Detailed Specs & Requirements</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe material grades, shipping details, testing requirements, or packaging needs."
                  value={rfqForm.description}
                  onChange={(e) => setRfqForm((f) => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              {rfqError && <p className="text-sm font-semibold text-red-600">{rfqError}</p>}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRfqModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Post RFQ Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quote Submission Modal */}
      {isBidModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-100 animate-scale-up mx-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Submit Bid Proposal</h3>
              <button
                onClick={() => setIsBidModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitQuote} className="mt-6 space-y-4">
              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Bid Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={bidForm.price}
                    onChange={(e) => setBidForm((f) => ({ ...f, price: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Lead Time (Days)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={bidForm.lead_time_days}
                    onChange={(e) => setBidForm((f) => ({ ...f, lead_time_days: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Proposal Notes / Terms</label>
                <textarea
                  rows={3}
                  placeholder="Mention availability, shipping constraints, or discounts."
                  value={bidForm.notes}
                  onChange={(e) => setBidForm((f) => ({ ...f, notes: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              {bidError && <p className="text-sm font-semibold text-red-600">{bidError}</p>}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBidModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Submit Proposal Bid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
