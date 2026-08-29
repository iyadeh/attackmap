import { ShieldCheck } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type {
  AuthenticationMethod,
  AuthorizationModel,
  DataClassification,
  ServiceExposure,
  ServiceNode,
  ServiceType,
} from "@/types/architecture";
import { ServiceIcon, serviceTypeLabels } from "./service-node";

type EditableServiceField = Exclude<keyof ServiceNode, "id">;

export type ServiceChangeHandler = <Field extends EditableServiceField>(
  field: Field,
  value: ServiceNode[Field],
) => void;

type ServiceInspectorProps = {
  service: ServiceNode | null;
  onChange: ServiceChangeHandler;
};

const serviceTypeOptions = Object.entries(serviceTypeLabels) as [
  ServiceType,
  string,
][];

const exposureLabels: Record<ServiceExposure, string> = {
  public: "Public",
  private: "Private",
  internal: "Internal",
};

const exposureOptions = Object.entries(exposureLabels) as [
  ServiceExposure,
  string,
][];

const authenticationLabels: Record<AuthenticationMethod, string> = {
  none: "None",
  session: "Session",
  jwt: "JWT",
  oauth2: "OAuth 2.0",
  oidc: "OIDC",
  api_key: "API key",
  mtls: "mTLS",
};

const authenticationOptions = Object.entries(authenticationLabels) as [
  AuthenticationMethod,
  string,
][];

const authorizationLabels: Record<AuthorizationModel, string> = {
  none: "None",
  rbac: "RBAC",
  abac: "ABAC",
  acl: "ACL",
  policy: "Policy based",
};

const authorizationOptions = Object.entries(authorizationLabels) as [
  AuthorizationModel,
  string,
][];

const dataClassificationLabels: Record<DataClassification, string> = {
  public: "Public",
  internal: "Internal",
  confidential: "Confidential",
  restricted: "Restricted",
};

const dataClassificationOptions = Object.entries(dataClassificationLabels) as [
  DataClassification,
  string,
][];

const fieldControlClassName =
  "h-7 w-full rounded-[3px] border border-[#d5d5cf] bg-[#fbfbf9] px-2 text-[10px] text-[#2e2e2a] outline-none transition-colors hover:border-[#bcbcb5] focus:border-[#6d6d67] focus:bg-white focus:ring-1 focus:ring-[#6d6d67]/10";

function InspectorSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-[#e7e7e2] py-3.5">
      <h3 className="mb-3 text-[9px] font-semibold uppercase tracking-[0.11em] text-[#777770]">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function InspectorField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-[9px] font-medium text-[#74746d]"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function InspectorToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-6 cursor-pointer items-center justify-between gap-3 text-[10px] text-[#3f3f3a]">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-3.5 w-3.5 shrink-0 accent-[#33332f]"
      />
    </label>
  );
}

export function ServiceInspector({
  service,
  onChange,
}: ServiceInspectorProps) {
  return (
    <aside
      aria-label="Service inspector"
      className="min-h-0 overflow-y-auto border-l border-[#dfdfda] bg-white"
    >
      <div className="flex h-11 items-center justify-between border-b border-[#e7e7e2] px-3.5">
        <h2 className="text-[11px] font-semibold">Service inspector</h2>
        <span className="border border-[#deded8] bg-[#f7f7f4] px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-[#777770]">
          In memory
        </span>
      </div>

      {service ? (
        <form className="px-3.5" onSubmit={(event) => event.preventDefault()}>
          <div className="flex items-start gap-3 border-b border-[#e7e7e2] py-3.5">
            <span className="mt-0.5 text-[#4f4f4a]">
              <ServiceIcon type={service.type} size={19} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold">
                {service.name || "Unnamed service"}
              </p>
              <p className="mt-1 font-mono text-[8px] text-[#85857e]">
                {service.id}
              </p>
            </div>
          </div>

          <InspectorSection title="General">
            <InspectorField label="Name" htmlFor="service-name">
              <input
                id="service-name"
                type="text"
                value={service.name}
                onChange={(event) => onChange("name", event.target.value)}
                autoComplete="off"
                className={fieldControlClassName}
              />
            </InspectorField>
            <InspectorField label="Service type" htmlFor="service-type">
              <select
                id="service-type"
                value={service.type}
                onChange={(event) =>
                  onChange("type", event.target.value as ServiceType)
                }
                className={fieldControlClassName}
              >
                {serviceTypeOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </InspectorField>
            <InspectorField label="Technology" htmlFor="service-technology">
              <input
                id="service-technology"
                type="text"
                value={service.technology}
                onChange={(event) =>
                  onChange("technology", event.target.value)
                }
                autoComplete="off"
                spellCheck={false}
                className={fieldControlClassName}
              />
            </InspectorField>
          </InspectorSection>

          <InspectorSection title="Network">
            <InspectorField label="Exposure" htmlFor="service-exposure">
              <select
                id="service-exposure"
                value={service.exposure}
                onChange={(event) =>
                  onChange(
                    "exposure",
                    event.target.value as ServiceExposure,
                  )
                }
                className={fieldControlClassName}
              >
                {exposureOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </InspectorField>
          </InspectorSection>

          <InspectorSection title="Security">
            <InspectorField
              label="Authentication"
              htmlFor="service-authentication"
            >
              <select
                id="service-authentication"
                value={service.authentication}
                onChange={(event) =>
                  onChange(
                    "authentication",
                    event.target.value as AuthenticationMethod,
                  )
                }
                className={fieldControlClassName}
              >
                {authenticationOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </InspectorField>
            <InspectorField
              label="Authorization"
              htmlFor="service-authorization"
            >
              <select
                id="service-authorization"
                value={service.authorization}
                onChange={(event) =>
                  onChange(
                    "authorization",
                    event.target.value as AuthorizationModel,
                  )
                }
                className={fieldControlClassName}
              >
                {authorizationOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </InspectorField>
            <div className="border-t border-[#eeeeea] pt-2">
              <InspectorToggle
                label="Encryption in transit"
                checked={service.encryptionInTransit}
                onChange={(checked) =>
                  onChange("encryptionInTransit", checked)
                }
              />
              <InspectorToggle
                label="Rate limiting"
                checked={service.rateLimiting}
                onChange={(checked) => onChange("rateLimiting", checked)}
              />
            </div>
          </InspectorSection>

          <InspectorSection title="Data">
            <InspectorToggle
              label="Handles sensitive data"
              checked={service.sensitiveData}
              onChange={(checked) => onChange("sensitiveData", checked)}
            />
            <InspectorField
              label="Data classification"
              htmlFor="service-data-classification"
            >
              <select
                id="service-data-classification"
                value={service.dataClassification}
                onChange={(event) =>
                  onChange(
                    "dataClassification",
                    event.target.value as DataClassification,
                  )
                }
                className={fieldControlClassName}
              >
                {dataClassificationOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </InspectorField>
          </InspectorSection>

          <div className="flex gap-2.5 py-3.5 text-[9px] leading-3.5 text-[#85857e]">
            <ShieldCheck
              className="mt-0.5 shrink-0 text-[#666660]"
              size={14}
              weight="bold"
              aria-hidden="true"
            />
            <p>Changes apply immediately to this in-memory architecture.</p>
          </div>
        </form>
      ) : (
        <div className="px-5 py-8 text-center">
          <p className="text-[11px] font-medium text-[#4e4e49]">
            No service selected
          </p>
          <p className="mt-1.5 text-[9px] leading-4 text-[#85857e]">
            Select a node on the canvas to inspect its configuration.
          </p>
        </div>
      )}
    </aside>
  );
}
