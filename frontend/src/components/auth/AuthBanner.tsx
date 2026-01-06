interface AuthBannerProps {
  role: "user" | "organizer";
  mode: "login" | "register";
}

export function AuthBanner({ role, mode }: AuthBannerProps) {
  const isUser = role === "user";
  const isLogin = mode === "login";

  const userContent = {
    login: {
      title: "Welcome back!",
      subtitle: "Discover amazing trips and join group adventures",
      features: [
        "Browse curated trips",
        "Request to join experiences",
        "Track your bookings",
      ],
    },
    register: {
      title: "Start your journey",
      subtitle: "Join thousands discovering amazing trips",
      features: [
        "Discover unique experiences",
        "Join group adventures",
        "Manage your bookings",
      ],
    },
  };

  const organizerContent = {
    login: {
      title: "Welcome back!",
      subtitle: "Manage your trips and grow your business",
      features: [
        "Create amazing trips",
        "Manage booking requests",
        "Track seat availability",
      ],
    },
    register: {
      title: "Start organizing trips",
      subtitle: "Share your experiences with travelers",
      features: [
        "Create and publish trips",
        "Manage bookings easily",
        "Track your trip performance",
      ],
    },
  };

  const content = isUser ? userContent[mode] : organizerContent[mode];

  return (
    <div className="hidden lg:flex lg:flex-col lg:justify-center lg:px-12 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {content.title}
        </h1>
        <p className="text-xl text-gray-700 mb-8">{content.subtitle}</p>
        <ul className="space-y-4">
          {content.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

