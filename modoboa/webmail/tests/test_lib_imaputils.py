"""mailutils tests"""

import unittest
from unittest import mock

from modoboa.webmail.lib.imaputils import IMAPconnector


class ImapUtilsTestCase(unittest.TestCase):
    """Test mail utils library"""

    def setUp(self):
        self.imap_connector = IMAPconnector(user="test", password="test")

    def test_select_mailbox_mode_aware_cache(self):
        """SELECT/EXAMINE caching must account for the access mode."""
        conn = self.imap_connector
        conn.m = mock.Mock()
        conn.m.untagged_responses = {"STALE": ["x"]}
        conn._cmd = mock.Mock()

        # First read-only select issues an EXAMINE and resets stale responses.
        conn.select_mailbox("INBOX", readonly=True)
        self.assertEqual(conn._cmd.call_args[0][0], "EXAMINE")
        self.assertTrue(conn.m.is_readonly)
        self.assertEqual(conn.m.untagged_responses, {})
        self.assertEqual(conn.m.state, "SELECTED")

        # Same mailbox + same mode => cache hit, no new command.
        conn._cmd.reset_mock()
        conn.select_mailbox("INBOX", readonly=True)
        conn._cmd.assert_not_called()

        # Same mailbox but switching to read-write => must re-issue a SELECT.
        conn.select_mailbox("INBOX", readonly=False)
        self.assertEqual(conn._cmd.call_args[0][0], "SELECT")
        self.assertFalse(conn.m.is_readonly)

    def test_criterions_one_criterion_with_pattern(self):
        """Test with Criterion and pattern"""
        self.imap_connector.criterions = []
        self.imap_connector.parse_search_parameters("from_addr", "bob")
        result = [bytearray('(FROM "bob")', "utf8")]
        self.assertEqual(self.imap_connector.criterions, result)

    def test_criterions_both_criterion_with_pattern(self):
        """Test with both Criterion and pattern"""
        self.imap_connector.criterions = []
        self.imap_connector.parse_search_parameters("both", "bob")
        result = [bytearray('OR (FROM "bob") (SUBJECT "bob")', "utf8")]
        self.assertEqual(self.imap_connector.criterions, result)

    def test_criterions_one_criterion_without_pattern(self):
        """Test with Criterion and empty pattern"""
        self.imap_connector.criterions = []
        self.imap_connector.parse_search_parameters("SEEN", "")
        result = [bytearray("ALL", "utf8")]
        self.assertEqual(self.imap_connector.criterions, result)
