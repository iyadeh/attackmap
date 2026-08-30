import type { CreatableServiceType } from "@/lib/architecture/service-factory";
import { ServiceIcon } from "./service-node";

const paletteSections: {
  label: string;
  services: { name: string; type: CreatableServiceType }[];
}[] = [
  {
    label: "Entry points",
    services: [
      { name: "Internet", type: "internet" },
      { name: "Web application", type: "web" },
    ],
  },
  {
    label: "Services",
    services: [
      { name: "API gateway", type: "gateway" },
      { name: "REST API", type: "api" },
      { name: "Auth service", type: "auth" },
    ],
  },
  {
    label: "Data",
    services: [
      { name: "Database", type: "database" },
      { name: "Object storage", type: "storage" },
    ],
  },
];

export function ComponentPalette({
  onCreateService,
}: {
  onCreateService: (type: CreatableServiceType) => void;
}) {
  return (
    <aside
      aria-label="Component palette"
      className="min-h-0 overflow-y-auto border-r border-[#dfdfda] bg-[#fafaf8]"
    >
      <div className="border-b border-[#e7e7e2] px-3.5 py-3">
        <h2 className="text-[11px] font-semibold">Components</h2>
        <p className="mt-1 text-[9px] leading-3.5 text-[#85857e]">
          Select a service type to add it
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
                <button
                  key={service.name}
                  type="button"
                  onClick={() => onCreateService(service.type)}
                  aria-label={`Add ${service.name}`}
                  className="flex w-full cursor-pointer items-center gap-2.5 border border-transparent px-2 py-1.5 text-left text-[10px] text-[#4f4f4a] transition-colors hover:border-[#e2e2dd] hover:bg-white"
                >
                  <span className="text-[#666660]">
                    <ServiceIcon type={service.type} size={15} />
                  </span>
                  <span>{service.name}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
