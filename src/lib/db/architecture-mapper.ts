import {
  authenticationMethods,
  authorizationModels,
  connectionProtocols,
  dataClassifications,
  serviceExposures,
  serviceProtocols,
  serviceTypes,
  type ArchitectureSnapshot,
  type ConnectionProtocol,
  type Project,
  type ProjectArchitecture,
  type ServiceConnection,
  type ServiceNode,
  type ServicePosition,
} from "../../types/architecture";

import type {
  NewServiceConnectionRow,
  NewServiceRow,
  ProjectRow,
  ServiceConnectionRow,
  ServiceRow,
} from "./schema";

const MAX_SERVICES = 50;
const MAX_CONNECTIONS = 100;
const MAX_ID_LENGTH = 128;
const MAX_TEXT_LENGTH = 256;
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

const serviceTypeSet = new Set<string>(serviceTypes);
const serviceExposureSet = new Set<string>(serviceExposures);
const serviceProtocolSet = new Set<string>(serviceProtocols);
const authenticationMethodSet = new Set<string>(authenticationMethods);
const authorizationModelSet = new Set<string>(authorizationModels);
const dataClassificationSet = new Set<string>(dataClassifications);
const connectionProtocolSet = new Set<string>(connectionProtocols);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.length <= maxLength &&
    !value.includes("\u0000")
  );
}

function isId(value: unknown): value is string {
  return isString(value, MAX_ID_LENGTH) && ID_PATTERN.test(value);
}

function isEnumValue<T extends string>(
  value: unknown,
  values: ReadonlySet<string>,
): value is T {
  return typeof value === "string" && values.has(value);
}

function parseService(value: unknown): ServiceNode {
  if (
    !isRecord(value) ||
    !isId(value.id) ||
    !isString(value.name, MAX_TEXT_LENGTH) ||
    !isEnumValue<ServiceNode["type"]>(value.type, serviceTypeSet) ||
    !isString(value.technology, MAX_TEXT_LENGTH) ||
    !isEnumValue<ServiceNode["exposure"]>(
      value.exposure,
      serviceExposureSet,
    ) ||
    !isEnumValue<ServiceNode["protocol"]>(value.protocol, serviceProtocolSet) ||
    !isEnumValue<ServiceNode["authentication"]>(
      value.authentication,
      authenticationMethodSet,
    ) ||
    !isEnumValue<ServiceNode["authorization"]>(
      value.authorization,
      authorizationModelSet,
    ) ||
    typeof value.encryptionInTransit !== "boolean" ||
    (value.encryptionAtRest !== undefined &&
      typeof value.encryptionAtRest !== "boolean") ||
    typeof value.rateLimiting !== "boolean" ||
    typeof value.sensitiveData !== "boolean" ||
    !isEnumValue<ServiceNode["dataClassification"]>(
      value.dataClassification,
      dataClassificationSet,
    )
  ) {
    throw new Error("Invalid service persistence input.");
  }

  return {
    id: value.id,
    name: value.name,
    type: value.type,
    technology: value.technology,
    exposure: value.exposure,
    protocol: value.protocol,
    authentication: value.authentication,
    authorization: value.authorization,
    encryptionInTransit: value.encryptionInTransit,
    ...(value.encryptionAtRest === undefined
      ? {}
      : { encryptionAtRest: value.encryptionAtRest }),
    rateLimiting: value.rateLimiting,
    sensitiveData: value.sensitiveData,
    dataClassification: value.dataClassification,
  };
}

function parseServicePosition(value: unknown): ServicePosition {
  if (
    !isRecord(value) ||
    !isId(value.serviceId) ||
    typeof value.x !== "number" ||
    !Number.isFinite(value.x) ||
    typeof value.y !== "number" ||
    !Number.isFinite(value.y)
  ) {
    throw new Error("Invalid service position persistence input.");
  }

  return {
    serviceId: value.serviceId,
    x: value.x,
    y: value.y,
  };
}

function parseConnection(value: unknown): ServiceConnection {
  if (
    !isRecord(value) ||
    !isId(value.id) ||
    !isId(value.source) ||
    !isId(value.target) ||
    !isEnumValue<ConnectionProtocol>(
      value.protocol,
      connectionProtocolSet,
    ) ||
    typeof value.encrypted !== "boolean"
  ) {
    throw new Error("Invalid connection persistence input.");
  }

  return {
    id: value.id,
    source: value.source,
    target: value.target,
    protocol: value.protocol,
    encrypted: value.encrypted,
  };
}

export function parseArchitectureSnapshot(value: unknown): ArchitectureSnapshot {
  if (
    !isRecord(value) ||
    !Array.isArray(value.services) ||
    !Array.isArray(value.servicePositions) ||
    !Array.isArray(value.connections) ||
    value.services.length > MAX_SERVICES ||
    value.servicePositions.length > MAX_SERVICES ||
    value.connections.length > MAX_CONNECTIONS
  ) {
    throw new Error("Invalid architecture persistence input.");
  }

  const services = value.services.map(parseService);
  const servicePositions = value.servicePositions.map(parseServicePosition);
  const connections = value.connections.map(parseConnection);
  const serviceIds = new Set(services.map((service) => service.id));
  const positionIds = new Set(
    servicePositions.map((position) => position.serviceId),
  );
  const connectionIds = new Set(
    connections.map((connection) => connection.id),
  );
  const connectionPairs = new Set(
    connections.map(
      (connection) => `${connection.source}\u0000${connection.target}`,
    ),
  );

  if (
    serviceIds.size !== services.length ||
    positionIds.size !== servicePositions.length ||
    connectionIds.size !== connections.length ||
    connectionPairs.size !== connections.length ||
    servicePositions.length !== services.length ||
    services.some((service) => !positionIds.has(service.id)) ||
    servicePositions.some((position) => !serviceIds.has(position.serviceId)) ||
    connections.some(
      (connection) =>
        connection.source === connection.target ||
        !serviceIds.has(connection.source) ||
        !serviceIds.has(connection.target),
    )
  ) {
    throw new Error("Architecture persistence input has invalid references.");
  }

  return { services, servicePositions, connections };
}

export function mapServiceToRow(
  projectId: string,
  service: ServiceNode,
  position: ServicePosition,
): NewServiceRow {
  if (position.serviceId !== service.id) {
    throw new Error("Service position does not match service.");
  }

  return {
    projectId,
    id: service.id,
    name: service.name,
    type: service.type,
    technology: service.technology,
    exposure: service.exposure,
    protocol: service.protocol,
    authentication: service.authentication,
    authorization: service.authorization,
    encryptionInTransit: service.encryptionInTransit,
    encryptionAtRest: service.encryptionAtRest ?? null,
    rateLimiting: service.rateLimiting,
    sensitiveData: service.sensitiveData,
    dataClassification: service.dataClassification,
    positionX: position.x,
    positionY: position.y,
  };
}

export function mapServiceFromRow(row: ServiceRow): {
  service: ServiceNode;
  position: ServicePosition;
} {
  return {
    service: {
      id: row.id,
      name: row.name,
      type: row.type,
      technology: row.technology,
      exposure: row.exposure,
      protocol: row.protocol,
      authentication: row.authentication,
      authorization: row.authorization,
      encryptionInTransit: row.encryptionInTransit,
      ...(row.encryptionAtRest === null
        ? {}
        : { encryptionAtRest: row.encryptionAtRest }),
      rateLimiting: row.rateLimiting,
      sensitiveData: row.sensitiveData,
      dataClassification: row.dataClassification,
    },
    position: {
      serviceId: row.id,
      x: row.positionX,
      y: row.positionY,
    },
  };
}

export function mapConnectionToRow(
  projectId: string,
  connection: ServiceConnection,
): NewServiceConnectionRow {
  return {
    projectId,
    id: connection.id,
    sourceServiceId: connection.source,
    targetServiceId: connection.target,
    protocol: connection.protocol,
    encrypted: connection.encrypted,
  };
}

export function mapConnectionFromRow(
  row: ServiceConnectionRow,
): ServiceConnection {
  return {
    id: row.id,
    source: row.sourceServiceId,
    target: row.targetServiceId,
    protocol: row.protocol,
    encrypted: row.encrypted,
  };
}

export function mapArchitectureToRows(
  projectId: string,
  snapshot: ArchitectureSnapshot,
) {
  const positionsByServiceId = new Map(
    snapshot.servicePositions.map((position) => [
      position.serviceId,
      position,
    ]),
  );

  return {
    serviceRows: snapshot.services.map((service) => {
      const position = positionsByServiceId.get(service.id);

      if (!position) {
        throw new Error(`Missing position for service ${service.id}.`);
      }

      return mapServiceToRow(projectId, service, position);
    }),
    connectionRows: snapshot.connections.map((connection) =>
      mapConnectionToRow(projectId, connection),
    ),
  };
}

export function mapArchitectureFromRows(
  projectRow: ProjectRow,
  serviceRows: ServiceRow[],
  connectionRows: ServiceConnectionRow[],
): ProjectArchitecture {
  const mappedServices = serviceRows.map(mapServiceFromRow);

  return {
    project: mapProjectFromRow(projectRow),
    services: mappedServices.map(({ service }) => service),
    servicePositions: mappedServices.map(({ position }) => position),
    connections: connectionRows.map(mapConnectionFromRow),
  };
}

export function mapProjectFromRow(projectRow: ProjectRow): Project {
  return {
    id: projectRow.id,
    name: projectRow.name,
    ...(projectRow.description === null
      ? {}
      : { description: projectRow.description }),
    createdAt: projectRow.createdAt,
    updatedAt: projectRow.updatedAt,
  };
}
