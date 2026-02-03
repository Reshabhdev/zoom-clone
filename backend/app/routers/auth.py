from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

# Internal imports based on your folder structure
from backend.app.schemas.user import UserCreate, Token
from backend.app.models.user import User
from backend.app.database.deps import get_db
from backend.app.core.security import get_password_hash, verify_password
from backend.app.core.token import create_access_token

# Prefix is handled in main.py to keep this file flexible
router = APIRouter()

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if the email is already in the database [cite: 120]
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email already registered"
        )
    
    # Hash the password and create a new User record [cite: 121, 124]
    new_user = User(
        email=user.email,
        hashed_password=get_password_hash(user.password)
    )
    
    db.add(new_user)
    db.commit()
    return {"message": "User registered successfully"}

@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    # Retrieve user by the 'username' field (which is the email in our case) [cite: 129, 130]
    user = db.query(User).filter(User.email == form_data.username).first()
    
    # Verify user exists and the password matches [cite: 130]
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid email or password"
        )
    
    # Create the JWT access token with the email as the subject [cite: 133]
    access_token = create_access_token(data={"sub": user.email})
    
    return {"access_token": access_token, "token_type": "bearer"}