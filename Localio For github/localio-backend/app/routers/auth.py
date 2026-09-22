import random
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..models import User
from ..schemas import OtpSendRequest, OtpVerifyRequest

router = APIRouter(prefix="/auth", tags=["auth"])

# Prototype-only in-memory OTP store. Swap this whole module for Firebase Auth
# (phone provider) or Twilio Verify before this touches real users — do not
# ship this in-memory version.
_otp_store: dict[str, str] = {}


@router.post("/otp/send")
def send_otp(payload: OtpSendRequest):
    code = f"{random.randint(0, 999999):06d}"
    _otp_store[payload.phone_number] = code
    # Dev convenience: code is returned directly instead of being SMS'd.
    # Remove `code` from the response once a real SMS provider is wired in.
    return {"message": "OTP sent", "dev_code": code}


@router.post("/otp/verify")
def verify_otp(payload: OtpVerifyRequest, session: Session = Depends(get_session)):
    expected = _otp_store.get(payload.phone_number)
    if not expected or expected != payload.code:
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    del _otp_store[payload.phone_number]

    user = session.exec(select(User).where(User.phone_number == payload.phone_number)).first()
    if not user:
        user = User(phone_number=payload.phone_number, is_vendor=(payload.role == "vendor"))
        session.add(user)
        session.commit()
        session.refresh(user)

    # Prototype: no real JWT yet — returning the user id/phone directly.
    # Swap for a signed JWT before this is exposed publicly.
    return {"user_id": user.id, "phone_number": user.phone_number, "is_vendor": user.is_vendor}
