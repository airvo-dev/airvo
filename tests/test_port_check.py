import socket

from airvo.port_utils import is_port_in_use


def test_is_port_in_use_returns_true_when_socket_connects(monkeypatch):
    calls = []

    class FakeSocket:
        def __init__(self, *args, **kwargs):
            pass

        def settimeout(self, timeout):
            calls.append(("timeout", timeout))

        def connect(self, address):
            calls.append(("connect", address))
            return None

        def close(self):
            calls.append(("close", None))

    monkeypatch.setattr(socket, "create_connection", lambda *args, **kwargs: FakeSocket())

    assert is_port_in_use("127.0.0.1", 8765) is True
    assert calls[0][0] == "timeout"


def test_is_port_in_use_returns_false_when_connection_fails(monkeypatch):
    def raise_err(*args, **kwargs):
        raise OSError("connection refused")

    monkeypatch.setattr(socket, "create_connection", raise_err)

    assert is_port_in_use("127.0.0.1", 8765) is False