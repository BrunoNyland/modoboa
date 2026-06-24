"""Tests for the per-process IMAP connection pool."""

import time
from unittest import mock

from django.test import SimpleTestCase, override_settings

from modoboa.webmail.lib import imap_pool
from modoboa.webmail.lib.imaputils import IMAPconnector
from modoboa.webmail.mocks import IMAP4Mock


class FakeIMAP4:
    """Minimal stand-in for an imaplib connection."""

    def __init__(self, alive: bool = True):
        self.alive = alive
        self.logged_out = False

    def noop(self):
        if not self.alive:
            raise OSError("connection dropped")
        return "OK", [b"ok"]

    def logout(self):
        self.logged_out = True
        return "BYE", [b"bye"]


class FakeConnector:
    """Implements just the pool-facing contract of IMAPconnector."""

    def __init__(self, user: str, m=None):
        self.user = user
        self.m = m

    def _pool_key(self) -> str:
        return self.user

    def _export_session(self) -> dict:
        return {"m": self.m}

    def _import_session(self, session: dict) -> None:
        self.m = session["m"]


class ImapPoolLogicTestCase(SimpleTestCase):
    """Pool algorithm, exercised through the fake connector."""

    def setUp(self):
        imap_pool.clear()
        self.addCleanup(imap_pool.clear)

    def test_disabled_by_default(self):
        """With the flag off, the pool is inert."""
        conn = FakeConnector("a@test.com", FakeIMAP4())
        self.assertFalse(imap_pool.release(conn))
        self.assertFalse(imap_pool.acquire(FakeConnector("a@test.com")))

    @override_settings(WEBMAIL_IMAP_POOL=True)
    def test_release_then_acquire_reuses_connection(self):
        live = FakeIMAP4()
        producer = FakeConnector("a@test.com", live)
        self.assertTrue(imap_pool.release(producer))

        consumer = FakeConnector("a@test.com")
        self.assertTrue(imap_pool.acquire(consumer))
        self.assertIs(consumer.m, live)
        self.assertFalse(live.logged_out)
        # The entry was removed from the pool while in use.
        self.assertEqual(imap_pool._pool, {})

    @override_settings(WEBMAIL_IMAP_POOL=True)
    def test_isolation_between_users(self):
        live_a = FakeIMAP4()
        imap_pool.release(FakeConnector("a@test.com", live_a))

        # Another user must not get a@'s connection.
        other = FakeConnector("b@test.com")
        self.assertFalse(imap_pool.acquire(other))
        self.assertIsNone(other.m)
        # a@'s connection is untouched and still pooled.
        self.assertFalse(live_a.logged_out)
        self.assertIn("a@test.com", imap_pool._pool)

    @override_settings(WEBMAIL_IMAP_POOL=True, WEBMAIL_IMAP_POOL_IDLE_TIMEOUT=300)
    def test_idle_connection_is_dropped(self):
        live = FakeIMAP4()
        imap_pool.release(FakeConnector("a@test.com", live))
        # Backdate the entry well beyond the idle timeout.
        session, _ = imap_pool._pool["a@test.com"]
        imap_pool._pool["a@test.com"] = (session, time.monotonic() - 10000)

        self.assertFalse(imap_pool.acquire(FakeConnector("a@test.com")))
        self.assertTrue(live.logged_out)

    @override_settings(WEBMAIL_IMAP_POOL=True)
    def test_dead_connection_is_dropped(self):
        dead = FakeIMAP4(alive=False)
        imap_pool.release(FakeConnector("a@test.com", dead))

        consumer = FakeConnector("a@test.com")
        self.assertFalse(imap_pool.acquire(consumer))
        self.assertIsNone(consumer.m)
        self.assertTrue(dead.logged_out)

    @override_settings(WEBMAIL_IMAP_POOL=True, WEBMAIL_IMAP_POOL_MAX_ENTRIES=2)
    def test_entry_cap_evicts_lru(self):
        conns = {}
        for name in ("a", "b", "c"):
            conns[name] = FakeIMAP4()
            imap_pool.release(FakeConnector(name, conns[name]))
            time.sleep(0.001)  # ensure distinct last_used ordering

        self.assertEqual(len(imap_pool._pool), 2)
        # Oldest ("a") evicted and closed.
        self.assertNotIn("a", imap_pool._pool)
        self.assertTrue(conns["a"].logged_out)
        self.assertIn("b", imap_pool._pool)
        self.assertIn("c", imap_pool._pool)

    @override_settings(WEBMAIL_IMAP_POOL=True)
    def test_clear_closes_everything(self):
        live = FakeIMAP4()
        imap_pool.release(FakeConnector("a@test.com", live))
        imap_pool.clear()
        self.assertEqual(imap_pool._pool, {})
        self.assertTrue(live.logged_out)


@override_settings(WEBMAIL_IMAP_POOL=True)
class ImapPoolIntegrationTestCase(SimpleTestCase):
    """The real IMAPconnector context manager, with IMAP mocked out."""

    def setUp(self):
        imap_pool.clear()
        self.addCleanup(imap_pool.clear)
        patcher = mock.patch("imaplib.IMAP4")
        self.mock_imap4 = patcher.start()
        self.mock_imap4.side_effect = lambda *a, **k: IMAP4Mock()
        self.addCleanup(patcher.stop)
        params = mock.patch(
            "modoboa.webmail.lib.imaputils.param_tools.get_global_parameters",
            return_value={
                "imap_server": "localhost",
                "imap_port": 143,
                "imap_secured": False,
            },
        )
        params.start()
        self.addCleanup(params.stop)

    def test_connection_reused_across_requests(self):
        with IMAPconnector("user@test.com", "tok"):
            pass
        self.assertEqual(self.mock_imap4.call_count, 1)
        # Second "request": the pooled connection is reused, no new login.
        with IMAPconnector("user@test.com", "tok"):
            pass
        self.assertEqual(self.mock_imap4.call_count, 1)

    def test_different_users_get_their_own_connection(self):
        with IMAPconnector("a@test.com", "tok"):
            pass
        with IMAPconnector("b@test.com", "tok"):
            pass
        self.assertEqual(self.mock_imap4.call_count, 2)

    def test_dropped_connection_triggers_reconnect(self):
        with IMAPconnector("user@test.com", "tok"):
            pass
        self.assertEqual(self.mock_imap4.call_count, 1)
        # Simulate the server having closed the pooled socket.
        session, ts = imap_pool._pool["user@test.com"]
        session["m"] = FakeIMAP4(alive=False)
        imap_pool._pool["user@test.com"] = (session, ts)
        with IMAPconnector("user@test.com", "tok"):
            pass
        self.assertEqual(self.mock_imap4.call_count, 2)

    def test_error_inside_block_does_not_pool(self):
        with self.assertRaises(ValueError):
            with IMAPconnector("user@test.com", "tok"):
                raise ValueError("boom")
        # A connection that errored mid-use must not be returned to the pool.
        self.assertEqual(imap_pool._pool, {})
