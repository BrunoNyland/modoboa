"""Per-process pool of authenticated IMAP connections.

The webmail backend opens a fresh IMAP connection on every API request and
authenticates it (``LOGIN``/``AUTHENTICATE``). Against Dovecot that auth step
dominates the request latency, and it is paid again on the very next request.

Modoboa runs under uWSGI with several worker *processes* and **no threads**
(``processes = N`` and no ``enable-threads``), so within a worker requests are
serialised. That lets us keep one authenticated IMAP connection per user *per
worker* and reuse it across requests — without any locking. The pool is plain
module-level state, therefore private to each worker process.

Design notes:

* Connections are created lazily, on first use, **after** uWSGI has forked its
  workers. Nothing here opens a socket at import time, so forked workers never
  share a file descriptor.
* A borrowed connection is health-checked with ``NOOP`` before reuse and
  dropped (then recreated) if the server closed it.
* Isolation is by username. A request only ever reaches this code after the
  OAuth bearer token has been validated for that user by the API layer, so a
  pooled connection is only ever handed back to a request authenticated as the
  same user.
* Everything is gated by the ``WEBMAIL_IMAP_POOL`` setting (default off), so the
  feature can be enabled per instance and instantly reverted to the previous
  login-per-request behaviour.
"""

import atexit
import imaplib
import logging
import time

from django.conf import settings

logger = logging.getLogger("modoboa.webmail")

#: Errors that mean "the pooled IMAP connection is dead, drop it and reconnect"
#: — socket/SSL errors (OSError), a server-closed connection (EOFError) and
#: IMAP protocol errors. Caught narrowly on purpose so real bugs (NameError,
#: TypeError, …) surface instead of being silently swallowed.
_CONNECTION_ERRORS = (OSError, EOFError, imaplib.IMAP4.error)

#: ``{username: (session_dict, last_used_monotonic)}`` — private to the worker.
_pool: dict = {}


def _enabled() -> bool:
    return getattr(settings, "WEBMAIL_IMAP_POOL", False)


def _idle_timeout() -> int:
    """Drop pooled connections idle for longer than this (seconds).

    Kept below Dovecot's own imap idle timeout so we don't hand out a socket
    the server already closed.
    """
    return getattr(settings, "WEBMAIL_IMAP_POOL_IDLE_TIMEOUT", 300)


def _max_entries() -> int:
    """Cap on distinct cached users per worker (bounds sockets/memory)."""
    return getattr(settings, "WEBMAIL_IMAP_POOL_MAX_ENTRIES", 50)


def _close_session(session: dict) -> None:
    """Best-effort logout/close of a pooled connection."""
    try:
        session["m"].logout()
    except _CONNECTION_ERRORS:
        # The socket is probably already gone; nothing to clean up.
        pass


def acquire(connector) -> bool:
    """Try to attach a live, authenticated connection to ``connector``.

    Returns ``True`` when a healthy pooled connection was adopted (the caller
    must then skip ``login``); ``False`` when the caller should authenticate a
    fresh connection as usual.
    """
    if not _enabled():
        return False
    entry = _pool.pop(connector._pool_key(), None)
    if entry is None:
        return False
    session, last_used = entry
    if time.monotonic() - last_used > _idle_timeout():
        _close_session(session)
        return False
    connector._import_session(session)
    try:
        typ, _ = connector.m.noop()
        if typ != "OK":
            raise OSError("NOOP not OK")
    except _CONNECTION_ERRORS as exc:
        # Dead/stale connection => drop it and let the caller reconnect.
        logger.debug("Dropping pooled IMAP connection: %s", exc)
        _close_session(session)
        connector.m = None
        return False
    return True


def release(connector) -> bool:
    """Return ``connector``'s live connection to the pool.

    Returns ``True`` when the connection was stored (the caller must then *not*
    log out); ``False`` when pooling is disabled or there is nothing to store.
    """
    if not _enabled():
        return False
    if getattr(connector, "m", None) is None:
        return False
    key = connector._pool_key()
    previous = _pool.pop(key, None)
    if previous is not None:
        # Should not happen without threads, but never leak a socket.
        _close_session(previous[0])
    _pool[key] = (connector._export_session(), time.monotonic())
    _evict()
    return True


def _evict() -> None:
    """Drop idle connections and enforce the per-worker entry cap (LRU)."""
    now = time.monotonic()
    timeout = _idle_timeout()
    for key in list(_pool):
        if now - _pool[key][1] > timeout:
            _close_session(_pool.pop(key)[0])
    overflow = len(_pool) - _max_entries()
    if overflow > 0:
        for key in sorted(_pool, key=lambda k: _pool[k][1])[:overflow]:
            _close_session(_pool.pop(key)[0])


def clear() -> None:
    """Close and forget every pooled connection (worker shutdown / tests)."""
    while _pool:
        _, (session, _last) = _pool.popitem()
        _close_session(session)


atexit.register(clear)
