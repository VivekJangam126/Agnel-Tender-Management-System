import PageHeader from "../../../components/shared/PageHeader";

export default function Profile() {
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Profile & Settings"
        description="Manage your personal details and preferences"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white border border-neutral-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-neutral-900">
            Personal Information
          </h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-600">
                Full Name
              </label>
              <input
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                defaultValue="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-600">Email</label>
              <input
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                defaultValue="jane.doe@example.com"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-600">Phone</label>
              <input
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                defaultValue="+91 98765 43210"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-600">
                Organization
              </label>
              <input
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                defaultValue="Acme Infra"
              />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">
              Save
            </button>
            <button className="px-4 py-2 rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-50">
              Cancel
            </button>
          </div>
        </section>

        <aside className="bg-white border border-neutral-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-neutral-900">
            Preferences
          </h3>
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-neutral-300"
              />
              Email notifications for updates
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-neutral-300"
              />
              Save viewed tenders automatically
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" className="rounded border-neutral-300" />
              Dark mode
            </label>
          </div>
        </aside>
      </div>
    </div>
  );
}
