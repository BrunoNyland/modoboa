"""Custom tags for Core application."""

import os

from django import template
from django.conf import settings

register = template.Library()


@register.simple_tag
def get_modoboa_logo():
    """Return the auth-page logo.

    Resolution order: ``MODOBOA_CUSTOM_LOGO`` Django setting > bundled static asset.
    """
    try:
        logo = settings.MODOBOA_CUSTOM_LOGO
    except AttributeError:
        logo = None
    if logo is None:
        return os.path.join(settings.STATIC_URL, "css/modoboa-white.png")
    return logo
