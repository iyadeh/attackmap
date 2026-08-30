import type {
  ConnectionProtocol,
  ServiceConnection,
} from "@/types/architecture";

function protocolUsesEncryption(protocol: ConnectionProtocol) {
  return protocol === "https" || protocol === "grpc";
}

export function getEncryptionAfterProtocolChange(
  protocol: ConnectionProtocol,
  currentEncrypted: boolean,
) {
  if (protocol === "https") {
    return true;
  }

  if (protocol === "http") {
    return false;
  }

  return currentEncrypted;
}

export function createServiceConnection(
  source: string,
  target: string,
  sequence: number,
  protocol: ConnectionProtocol = "https",
): ServiceConnection {
  return {
    id: `connection-${sequence}`,
    source,
    target,
    protocol,
    encrypted: protocolUsesEncryption(protocol),
  };
}

export function canCreateServiceConnection(
  source: string,
  target: string,
  serviceIds: ReadonlySet<string>,
  connections: readonly ServiceConnection[],
) {
  return (
    source !== target &&
    serviceIds.has(source) &&
    serviceIds.has(target) &&
    !connections.some(
      (connection) =>
        connection.source === source && connection.target === target,
    )
  );
}

export function getConnectionLabel(connection: ServiceConnection) {
  if (connection.protocol === "tcp") {
    return connection.encrypted ? "TCP/TLS" : "TCP";
  }

  if (connection.protocol === "websocket") {
    return connection.encrypted ? "WSS" : "WS";
  }

  if (connection.protocol === "grpc") {
    return connection.encrypted ? "gRPC/TLS" : "gRPC";
  }

  return connection.protocol.toUpperCase();
}
