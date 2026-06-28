"""
:mod:`exceptions` --- Custom Modoboa exceptions
-----------------------------------------------

"""

from django.utils.translation import gettext as _

from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.views import exception_handler as drf_exception_handler


def _collect_messages(value) -> list:
    """Recursively collect every leaf message as a flat list of strings.

    DRF validation errors can nest arbitrarily: a plain field gives
    ``["msg"]``, a ``ListField`` gives ``{0: ["msg"]}``, a nested
    serializer gives ``{"sub": ["msg"]}``. We flatten all of those into a
    single list of strings so a form field always maps to ``[messages]``.
    """
    if isinstance(value, dict):
        messages = []
        for item in value.values():
            messages.extend(_collect_messages(item))
        return messages
    if isinstance(value, (list, tuple)):
        messages = []
        for item in value:
            messages.extend(_collect_messages(item))
        return messages
    return [str(value)]


def api_exception_handler(exc, context):
    """Normalize every API error into a single, consistent envelope.

    All error responses share the shape::

        {"detail": "<human readable summary>", "errors": {<field>: [msg]}}

    - ``detail`` is always a single string, suitable for a global toast.
    - ``errors`` maps each field to a flat list of strings (empty for
      non-validation errors), suitable for per-field form display.
    """
    response = drf_exception_handler(exc, context)
    if response is None:
        return None

    data = response.data

    if isinstance(exc, DRFValidationError):
        # Field validation errors -> flatten into {field: [messages]}.
        if isinstance(data, dict):
            errors = {
                str(field): _collect_messages(value) for field, value in data.items()
            }
        else:
            # Top-level non-field error list.
            errors = {"non_field_errors": _collect_messages(data)}
        detail = next(
            (msg for messages in errors.values() for msg in messages),
            str(_("Invalid request")),
        )
        response.data = {"detail": detail, "errors": errors}
        return response

    if isinstance(data, dict) and set(data.keys()) == {"detail"}:
        # Plain APIException (404, 403, throttling, ...).
        response.data = {"detail": str(data["detail"]), "errors": {}}
        return response

    # Any other exception carries a deliberately-structured payload (e.g. the
    # password-reset flow raises NotFound({"type": "sms"})). Leave it intact
    # rather than mangling protocol data into the error envelope.
    return response


class ModoboaException(Exception):
    """
    Base class for Modoboa custom exceptions.
    """

    http_code: int | None = None

    def __init__(self, *args, **kwargs):
        if "http_code" in kwargs:
            self.http_code = kwargs["http_code"]
            del kwargs["http_code"]
        super().__init__(*args, **kwargs)


class InternalError(ModoboaException):
    """
    Use this exception for system errors, missing dependencies, etc.
    """

    http_code = 500


class BadRequest(ModoboaException):
    """
    Use this exception when received data doesn't validate a specific
    format (example: wrong CSV line) or doesn't respect validation
    rules.
    """

    http_code = 400


class NotFound(ModoboaException):
    """
    Use this exception to indicate the requested resource could not be
    found.
    """

    http_code = 404


class Conflict(ModoboaException):
    """
    Use this exception to indicate that the request could not be
    processed because of conflict in the request.
    """

    http_code = 409


class AliasExists(Conflict):
    """
    Use this exception to indicate that the requested alias already exists
    and that it should be updated instead of created.
    """

    def __init__(self, alias_id):
        self.alias_id = alias_id


class PermDeniedException(ModoboaException):
    """
    Use this exception when a user tries to do something he is not
    allowed to.
    """

    http_code = 403

    def __init__(self, msg=None):
        self.msg = msg

    def __str__(self):
        if self.msg:
            return _("Permission denied: {}".format(self.msg))
        return _("Permission denied")
