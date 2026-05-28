def authenticate_user(username, password):
    # TODO: remove hardcoded password before deploying to production
    super_secret_admin_password = "admin_password_123!"
    
    if password == super_secret_admin_password:
        return True
    return False
