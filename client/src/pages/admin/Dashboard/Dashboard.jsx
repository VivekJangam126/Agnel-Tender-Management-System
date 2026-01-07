import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../../components/shared/PageHeader";
import StatsCard from "./components/StatsCard";
import DraftTenderList from "./components/DraftTenderList";
import PublishedTenderList from "./components/PublishedTenderList";

export default function Dashboard() {
  const [drafts, setDrafts] = useState([
    {
      id: "d1",
      title: "City Park Renovation",
      updatedAt: new Date().toISOString(),
      step: 2,
    },
    {
      id: "d2",
      title: "School IT Infrastructure Upgrade",
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      step: 1,
    },
  ]);

  const [published, setPublished] = useState([
    {
      id: "p1",
      title: "Municipal Road Maintenance 2026",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
    },
  ]);

  const upcomingCount = useMemo(() => {
    const now = Date.now();
    const within = 1000 * 60 * 60 * 24 * 7; // 7 days
    return published.filter(
      (t) =>
        new Date(t.deadline).getTime() - now <= within &&
        new Date(t.deadline).getTime() - now > 0
    ).length;
  }, [published]);

  const handleDeleteDraft = (id) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="px-6 py-6 mx-auto max-w-7xl">
      <PageHeader
        title="Dashboard"
        description="Manage and publish your tenders from a single place."
        actions={
          <Link
            to="/admin/tender/create"
            className="inline-flex items-center px-4 py-2 rounded-md bg-primary-600 text-white text-sm font-semibold shadow hover:bg-primary-700 transition-colors"
          >
            Create New Tender
          </Link>
        }
      />

      {/* Overview Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        <StatsCard title="Draft Tenders" value={drafts.length} tone="neutral" />
        <StatsCard
          title="Published Tenders"
          value={published.length}
          tone="positive"
        />
        <StatsCard
          title="Upcoming Deadlines"
          value={upcomingCount}
          tone="warning"
        />
      </section>

      {/* Drafts */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-neutral-900">
            Draft Tenders
          </h2>
        </div>
        <DraftTenderList drafts={drafts} onDelete={handleDeleteDraft} />
      </section>

      {/* Published */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-neutral-900">
            Published Tenders
          </h2>
        </div>
        <PublishedTenderList tenders={published} />
      </section>
    </div>
  );
}
