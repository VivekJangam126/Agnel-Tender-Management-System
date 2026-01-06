import PageHeader from "../../../components/shared/PageHeader";

export default function Dashboard() {
  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        description="Manage tenders and view your organization's tender activities"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <h3 className="text-2xl font-bold text-primary-600">12</h3>
          <p className="text-sm text-neutral-600 mt-1">Published Tenders</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <h3 className="text-2xl font-bold text-amber-600">5</h3>
          <p className="text-sm text-neutral-600 mt-1">Draft Tenders</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <h3 className="text-2xl font-bold text-emerald-600">48</h3>
          <p className="text-sm text-neutral-600 mt-1">Total Proposals</p>
        </div>
      </div>
    </div>
  );
}
