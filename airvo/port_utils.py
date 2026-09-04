import socket


def is_port_in_use(host: str, port: int, timeout: float = 0.5) -> bool:
    """Return True when a TCP port is already accepting connections."""
    sock = None
    try:
        sock = socket.create_connection((host, port), timeout=timeout)
        sock.settimeout(timeout)
        return True
    except OSError:
        return False
    finally:
        if sock is not None:
            sock.close()