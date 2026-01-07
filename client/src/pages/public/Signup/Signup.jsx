import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "",
    organizationName: "",
    organizationType: "",
    industry: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Auto-fill organization type based on role
    if (name === "role") {
      setFormData({
        ...formData,
        role: value,
        organizationType:
          value === "authority" ? "Government/Authority" : "Business/Bidder",
      });
    }
    setError("");
  };

  const handleNext = () => {
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.role
    ) {
      setError("Please fill in all required fields");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!formData.organizationName) {
      setError("Organization name is required");
      setIsLoading(false);
      return;
    }

    try {
      const user = await signup({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role.toUpperCase(),
        organizationName: formData.organizationName,
      });

      if (user.role === "authority") {
        navigate("/admin/dashboard");
      } else {
        navigate("/bidder/dashboard");
      }
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-primary-600 mb-2">
                TenderFlow AI
              </h1>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                Create your account
              </h2>
              <p className="text-sm text-neutral-600">Step {step} of 2</p>
            </div>

            {step === 1 ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Full Name
                  </label>
                  <input
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-neutral-300 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-neutral-300 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-neutral-300 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Enter your password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    I am a <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleChange({
                          target: { name: "role", value: "authority" },
                        })
                      }
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        formData.role === "authority"
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-neutral-300 bg-white/50 text-neutral-700 hover:border-primary-300"
                      }`}
                    >
                      Authority
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleChange({
                          target: { name: "role", value: "bidder" },
                        })
                      }
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        formData.role === "bidder"
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-neutral-300 bg-white/50 text-neutral-700 hover:border-primary-300"
                      }`}
                    >
                      Bidder
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    This cannot be changed later
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full px-6 py-3 rounded-lg bg-primary-600 text-white text-base font-semibold shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all"
                >
                  Next
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Organization Name
                  </label>
                  <input
                    name="organizationName"
                    type="text"
                    required
                    value={formData.organizationName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-neutral-300 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Your organization"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Organization Type
                  </label>
                  <input
                    name="organizationType"
                    type="text"
                    value={formData.organizationType}
                    readOnly
                    className="w-full px-4 py-3 bg-neutral-100/50 backdrop-blur-sm border border-neutral-300 rounded-lg text-neutral-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Industry / Domain
                  </label>
                  <input
                    name="industry"
                    type="text"
                    value={formData.industry}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-neutral-300 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="e.g., Construction, IT, Healthcare"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 px-6 py-3 rounded-lg border border-neutral-300 bg-white/50 text-neutral-700 text-base font-semibold hover:bg-neutral-50 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-6 py-3 rounded-lg bg-primary-600 text-white text-base font-semibold shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-neutral-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary-600 font-medium hover:text-primary-700 transition-colors"
              >
                Login
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link
            to="/"
            className="text-sm text-neutral-600 hover:text-primary-600 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
