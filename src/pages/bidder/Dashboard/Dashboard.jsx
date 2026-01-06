import PageHeader from "../../../components/shared/PageHeader";

export default function Dashboard() {
  return (
    <div>
      <PageHeader
        title="Bidder Dashboard"
        description="View available tenders and manage your proposals"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <h3 className="text-2xl font-bold text-primary-600">8</h3>
          <p className="text-sm text-neutral-600 mt-1">Saved Tenders</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <h3 className="text-2xl font-bold text-amber-600">3</h3>
          <p className="text-sm text-neutral-600 mt-1">Active Proposals</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <h3 className="text-2xl font-bold text-emerald-600">2</h3>
          <p className="text-sm text-neutral-600 mt-1">Won Tenders</p>
        </div>
      </div>
    </div>
  );
}
