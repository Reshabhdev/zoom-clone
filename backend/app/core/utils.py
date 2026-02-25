import secrets
import string
from typing import Tuple

def generate_meeting_password() -> str:
    """
    Generate a 6-digit numeric password for meeting room.
    Example: 123456
    """
    return ''.join(secrets.choice(string.digits) for _ in range(6))

def generate_invitation_token() -> str:
    """
    Generate a unique token for the invitation link.
    This is a secure, URL-safe string.
    Example: aBc1D2eF3gH4iJ5kL6mN7oP8
    """
    return secrets.token_urlsafe(16)

def generate_meeting_credentials() -> Tuple[str, str]:
    """
    Generate both password and invitation token for a new meeting.
    
    Returns:
        Tuple of (password, invitation_token)
    """
    password = generate_meeting_password()
    token = generate_invitation_token()
    return password, token
