import base64
import hashlib
import hmac
import json
import os
from decimal import Decimal, ROUND_HALF_UP
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..models import FoodOrder, FoodOrderItem, Listing, MenuItem, User
from ..schemas import OrderCheckoutOut, OrderCreate, OrderItemOut, OrderOut, RazorpayPaymentVerification

router = APIRouter(tags=["orders"])
RAZORPAY_API = "https://api.razorpay.com/v1"


def _razorpay_credentials() -> tuple[str, str]:
    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    if not key_id or not key_secret:
        raise HTTPException(
            status_code=503,
            detail="Online payments are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the backend.",
        )
    if not key_id.startswith(("rzp_test_", "rzp_live_")):
        raise HTTPException(status_code=503, detail="RAZORPAY_KEY_ID is not a valid Razorpay key.")
    return key_id, key_secret


def _razorpay_request(method: str, path: str, key_id: str, key_secret: str, body: dict | None = None) -> dict:
    credentials = base64.b64encode(f"{key_id}:{key_secret}".encode()).decode()
    data = json.dumps(body).encode() if body is not None else None
    request = Request(
        f"{RAZORPAY_API}{path}",
        data=data,
        headers={
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/json",
        },
        method=method,
    )
    try:
        with urlopen(request, timeout=15) as response:
            return json.loads(response.read())
    except HTTPError as error:
        try:
            response_body = json.loads(error.read())
            description = response_body.get("error", {}).get("description")
        except (json.JSONDecodeError, AttributeError):
            description = None
        raise HTTPException(
            status_code=502,
            detail=f"Razorpay request failed: {description or 'the payment provider rejected the request.'}",
        ) from error
    except (URLError, TimeoutError, json.JSONDecodeError) as error:
        raise HTTPException(
            status_code=502,
            detail="Could not reach Razorpay. Please retry checkout.",
        ) from error


def _order_out(session: Session, order: FoodOrder) -> OrderOut:
    items = session.exec(
        select(FoodOrderItem).where(FoodOrderItem.order_id == order.id)
    ).all()
    return OrderOut(
        id=order.id,
        listing_id=order.listing_id,
        user_id=order.user_id,
        service=order.service,
        status=order.status,
        menu_confirmation_required=order.menu_confirmation_required,
        total=order.total,
        created_at=order.created_at,
        items=[
            OrderItemOut(
                menu_item_id=item.menu_item_id,
                name=item.name,
                quantity=item.quantity,
                unit_price=item.unit_price,
            )
            for item in items
        ],
    )


@router.post("/orders", response_model=OrderOut, status_code=201)
def create_order(payload: OrderCreate, session: Session = Depends(get_session)):
    key_id, key_secret = _razorpay_credentials()
    listing = session.get(Listing, payload.listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Vendor not found")
    if not listing.is_open:
        raise HTTPException(status_code=400, detail="This vendor is currently closed")
    if not session.get(User, payload.user_id):
        raise HTTPException(status_code=404, detail="User not found")

    order_items: list[FoodOrderItem] = []
    total = Decimal("0")
    seen_item_ids: set[int] = set()

    for requested in payload.items:
        if requested.menu_item_id in seen_item_ids:
            raise HTTPException(status_code=400, detail="Each menu item can only appear once")
        seen_item_ids.add(requested.menu_item_id)

        if requested.menu_item_id > 0:
            menu_item = session.get(MenuItem, requested.menu_item_id)
            if not menu_item or menu_item.listing_id != listing.id:
                raise HTTPException(status_code=400, detail="A selected menu item is no longer available")
            if not menu_item.is_available:
                raise HTTPException(status_code=400, detail=f"{menu_item.name} is no longer available")
            name = menu_item.name
            unit_price = Decimal(str(menu_item.price))
            if not unit_price.is_finite() or unit_price < 0:
                raise HTTPException(status_code=400, detail=f"{menu_item.name} has an invalid price.")
            menu_item_id = menu_item.id
        else:
            raise HTTPException(
                status_code=409,
                detail="This sample menu has unconfirmed prices. Online payment is available only for vendor-confirmed menu items.",
            )

        total += unit_price * requested.quantity
        order_items.append(
            FoodOrderItem(
                menu_item_id=menu_item_id,
                name=name,
                quantity=requested.quantity,
                unit_price=float(unit_price),
            )
        )

    total = total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    amount_paise = int(total * 100)
    if amount_paise < 100:
        raise HTTPException(status_code=400, detail="The minimum online order total is ₹1.")
    order = FoodOrder(
        listing_id=listing.id,
        user_id=payload.user_id,
        service=payload.service,
        status="payment_pending",
        menu_confirmation_required=False,
        total=float(total),
    )
    session.add(order)
    session.flush()
    for item in order_items:
        item.order_id = order.id
        session.add(item)
    session.commit()
    session.refresh(order)

    try:
        gateway_order = _razorpay_request(
            "POST",
            "/orders",
            key_id,
            key_secret,
            {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": f"localio-{order.id}",
                "notes": {
                    "localio_order_id": str(order.id),
                    "listing_id": str(listing.id),
                },
            },
        )
        gateway_order_id = gateway_order["id"]
        if gateway_order.get("amount") != amount_paise or gateway_order.get("currency") != "INR":
            raise ValueError("Razorpay created an order with an unexpected amount or currency.")
    except HTTPException:
        order.status = "payment_setup_failed"
        session.add(order)
        session.commit()
        raise
    except (KeyError, TypeError, ValueError) as error:
        order.status = "payment_setup_failed"
        session.add(order)
        session.commit()
        raise HTTPException(
            status_code=502,
            detail="Razorpay returned an invalid order response. Please retry checkout.",
        ) from error

    order.razorpay_order_id = gateway_order_id
    session.add(order)
    session.commit()
    session.refresh(order)
    return OrderCheckoutOut(
        **_order_out(session, order).model_dump(),
        razorpay_order_id=gateway_order_id,
        razorpay_key_id=key_id,
        amount_paise=amount_paise,
        currency="INR",
    )


@router.post("/orders/{order_id}/payment/verify", response_model=OrderOut)
def verify_order_payment(
    order_id: int,
    payload: RazorpayPaymentVerification,
    session: Session = Depends(get_session),
):
    key_id, key_secret = _razorpay_credentials()
    order = session.get(FoodOrder, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if not order.razorpay_order_id or not hmac.compare_digest(order.razorpay_order_id, payload.razorpay_order_id):
        raise HTTPException(status_code=400, detail="Payment order does not match.")
    expected_signature = hmac.new(
        key_secret.encode(),
        f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected_signature, payload.razorpay_signature):
        raise HTTPException(status_code=400, detail="Razorpay payment signature is invalid.")
    if order.status == "paid":
        if order.razorpay_payment_id == payload.razorpay_payment_id:
            return _order_out(session, order)
        raise HTTPException(status_code=409, detail="This order has already been paid.")
    if order.status != "payment_pending":
        raise HTTPException(status_code=409, detail="This order is not awaiting payment.")

    payment = _razorpay_request(
        "GET",
        f"/payments/{payload.razorpay_payment_id}",
        key_id,
        key_secret,
    )
    expected_amount = int(Decimal(str(order.total)) * 100)
    if payment.get("order_id") != order.razorpay_order_id:
        raise HTTPException(status_code=400, detail="Payment belongs to a different Razorpay order.")
    if payment.get("amount") != expected_amount or payment.get("currency") != "INR":
        raise HTTPException(status_code=400, detail="Payment amount or currency does not match the order.")
    if payment.get("status") == "authorized":
        payment = _razorpay_request(
            "POST",
            f"/payments/{payload.razorpay_payment_id}/capture",
            key_id,
            key_secret,
            {"amount": expected_amount, "currency": "INR"},
        )
    if (
        payment.get("id") != payload.razorpay_payment_id
        or payment.get("order_id") != order.razorpay_order_id
        or payment.get("amount") != expected_amount
        or payment.get("currency") != "INR"
    ):
        raise HTTPException(status_code=400, detail="Razorpay payment details do not match this order.")
    if payment.get("status") != "captured":
        raise HTTPException(status_code=409, detail="Razorpay has not captured this payment.")

    order.status = "paid"
    order.razorpay_payment_id = payload.razorpay_payment_id
    session.add(order)
    session.commit()
    session.refresh(order)
    return _order_out(session, order)


@router.get("/vendor/listings/{listing_id}/orders", response_model=list[OrderOut])
def get_vendor_orders(listing_id: int, user_id: int, session: Session = Depends(get_session)):
    listing = session.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Vendor not found")
    if listing.claimed_by_user_id != user_id:
        raise HTTPException(status_code=403, detail="This listing isn't claimed by this account")

    orders = session.exec(
        select(FoodOrder)
        .where(FoodOrder.listing_id == listing_id, FoodOrder.status == "paid")
        .order_by(FoodOrder.created_at.desc())
    ).all()
    return [_order_out(session, order) for order in orders]
