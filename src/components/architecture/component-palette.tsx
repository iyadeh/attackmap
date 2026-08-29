import {
  ServiceIcon,
  type ServiceIconType,
} from "./service-node";

const paletteSections: {
  label: string;
  services: { name: string; icon: ServiceIconType }[];
}[] = [
  {
    label: "Entry points",
    services: [
      { name: "Internet", icon: "internet" },
      { name: "Web application", icon: "web" },
    ],
  },
  {
    label: "Services",
    services: [
      { name: "API gateway", icon: "gateway" },
      { name: "REST API", icon: "api" },
      { name: "Auth service", icon: "auth" },
    ],
  },
  {
    label: "Data",
    services: [
      { name: "Database", icon: "database" },
      { name: "Object storage", icon: "storage" },
    ],
  },
];

export function ComponentPalette() {
  return (
    <aside
      aria-label="Component palette"
      className="min-h-0 overflow-y-auto border-r border-[#dfdfda] bg-[#fafaf8]"
    >
      <div className="border-b border-[#e7e7e2] px-3.5 py-3">
        <h2 className="text-[11px] font-semibold">Components</h2>
        <p className="mt-1 text-[9px] leading-3.5 text-[#85857e]">
          Service types for this architecture
        </p>
      </div>

      <div className="px-2 py-2.5">
        {paletteSections.map((section) => (
          <section key={section.label} className="mb-3.5 last:mb-0">
            <h3 className="px-1.5 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#8b8b84]">
              {section.label}
            </h3>
            <div className="space-y-0.5">
              {section.services.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center gap-2.5 border border-transparent px-2 py-1.5 text-[10px] text-[#4f4f4a]"
                >
                  <span className="text-[#666660]">
                    <ServiceIcon type={service.icon} size={15} />
                  </span>
                  <span>{service.name}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
