import { Link } from "react-router-dom";
import PageHeader from "../../../components/shared/PageHeader";

const user = {
  fullName: "Jane Doe",
  role: "Bidder",
  email: "jane.doe@example.com",
};

const organization = {
  name: "Acme Infra",
  type: "Bidder",
  industry: "Infrastructure",
  orgId: "ORG-ACME-001",
};

export default function Profile() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader
        title="Profile & Settings"
        description="Confirm your identity and organization"
      >
        <Link
          to="/bidder/dashboard"
          className="px-4 py-2 rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-sm"
        >
          Back to Dashboard
        </Link>
      </PageHeader>

      {/* Profile Summary */}
      <section className="bg-white border border-neutral-200 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-neutral-900">
              {user.fullName}
            </h3>
            <p className="text-sm text-neutral-600">Role: {user.role}</p>
            <p className="text-sm text-neutral-600">Email: {user.email}</p>
            <p className="text-sm text-neutral-600">
              Organization: {organization.name}
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 rounded-md bg-primary-600 text-white text-sm hover:bg-primary-700">
              Edit Profile
            </button>
            <Link
              to="/login"
              className="px-4 py-2 rounded-md border border-neutral-300 text-neutral-700 text-sm hover:bg-neutral-50"
            >
              Logout
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
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
                defaultValue={user.fullName}
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-600">Email</label>
              <input
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm bg-neutral-100"
                defaultValue={user.email}
                readOnly
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-600">Role</label>
              <input
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm bg-neutral-100"
                defaultValue={user.role}
                readOnly
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-600">
                Change Password
              </label>
              <div className="mt-1 grid grid-cols-1 gap-2">
                <input
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  placeholder="New password"
                  type="password"
                />
                <input
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  placeholder="Confirm password"
                  type="password"
                />
              </div>
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

        {/* Preferences */}
        <aside className="bg-white border border-neutral-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-neutral-900">
            Preferences
          </h3>
          <div className="mt-4 space-y-4">
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-neutral-300"
              />
              Notifications
            </label>
            <div>
              <label className="block text-xs text-neutral-600">Language</label>
              <select className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
                <option>English</option>
                <option>Hindi</option>
              </select>
            </div>
          </div>
        </aside>
      </div>

      {/* Organization Information */}
      <section className="bg-white border border-neutral-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-neutral-900">
          Organization Information
        </h3>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-neutral-600">
              Organization Name
            </label>
            <input
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              defaultValue={organization.name}
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-600">
              Organization Type
            </label>
            <input
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm bg-neutral-100"
              defaultValue={organization.type}
              readOnly
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-600">
              Industry / Domain
            </label>
            <input
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              defaultValue={organization.industry}
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-600">
              Organization ID
            </label>
            <input
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm bg-neutral-100"
              defaultValue={organization.orgId}
              readOnly
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
    </div>
  );
}
