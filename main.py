import base64
import calendar
import datetime
import ipaddress
import re

from fastapi import Body, Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from database import session,engine
import database_models
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
MAX_IP_ADDRESSES = 30

app = FastAPI()
app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

database_models.Base.metadata.create_all(bind=engine)

def get_db():
    db = session()
    try:
        yield db
    finally:
        db.close()

def resolve_network_access(network_access: str, ip_addresses: list[str] | None):
    if network_access not in (database_models.NetworkAccess.OPEN.value, database_models.NetworkAccess.LIMITED.value):
        raise HTTPException(status_code=400, detail="network_access must be 'open' or 'limited'")

    if network_access == database_models.NetworkAccess.OPEN.value:
        return network_access, None

    if not ip_addresses:
        raise HTTPException(status_code=400, detail="At least one IP address is required for limited network access")
    if len(ip_addresses) > MAX_IP_ADDRESSES:
        raise HTTPException(status_code=400, detail=f"At most {MAX_IP_ADDRESSES} IP addresses are allowed")
    for ip in ip_addresses:
        try:
            ipaddress.ip_address(ip)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"'{ip}' is not a valid IP address")

    return network_access, ip_addresses

def months_ago(d: datetime.date, months: int) -> datetime.date:
    month_index = d.month - 1 - months
    year = d.year + month_index // 12
    month = month_index % 12 + 1
    day = min(d.day, calendar.monthrange(year, month)[1])
    return datetime.date(year, month, day)

def resolve_transaction_date(transaction_date: str) -> str:
    try:
        parsed = datetime.date.fromisoformat(transaction_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="transaction_date must be in YYYY-MM-DD format")
    today = datetime.date.today()
    earliest = months_ago(today, 3)
    if parsed > today:
        raise HTTPException(status_code=400, detail="transaction_date cannot be in the future")
    if parsed < earliest:
        raise HTTPException(status_code=400, detail="transaction_date cannot be more than 3 months old")
    return transaction_date

def resolve_usergroup_fk(usergroup_fk: int | None, db: Session):
    if usergroup_fk is None:
        raise HTTPException(status_code=400, detail="usergroup_fk is required")
    if not db.query(database_models.usergroup).filter(database_models.usergroup.id == usergroup_fk).first():
        raise HTTPException(status_code=400, detail="usergroup_fk does not reference an existing user group")
    return usergroup_fk

def resolve_optional_fk(value: int | None, model, field_name: str, db: Session):
    if value is None:
        return None
    if not db.query(model).filter(model.id == value).first():
        raise HTTPException(status_code=400, detail=f"{field_name} does not reference an existing {model.__tablename__}")
    return value

def resolve_gender_fk(gender_fk: int | None, db: Session):
    if gender_fk is None:
        return None
    row = db.query(database_models.commonmaster).filter(database_models.commonmaster.id == gender_fk).first()
    if not row or row.tag != "gender":
        raise HTTPException(status_code=400, detail="gender_fk must reference a commonmaster row tagged 'gender'")
    return gender_fk

def serialize_user(db_user: database_models.User, db: Session):
    usergroup_description = None
    capabilities = []
    if db_user.usergroup_fk:
        db_usergroup = db.query(database_models.usergroup).filter(database_models.usergroup.id == db_user.usergroup_fk).first()
        if db_usergroup:
            usergroup_description = db_usergroup.description
            capability_ids = (db_usergroup.capabilitymaster_fk or {}).get("capability_ids", [])
            if capability_ids:
                rows = db.query(database_models.capabilitymaster).filter(database_models.capabilitymaster.id.in_(capability_ids)).all()
                capabilities = [row.name for row in rows]

    gender_name = None
    if db_user.gender_fk:
        gender_row = db.query(database_models.commonmaster).filter(database_models.commonmaster.id == db_user.gender_fk).first()
        gender_name = gender_row.name if gender_row else None

    country_name = None
    if db_user.country_fk:
        country_row = db.query(database_models.country).filter(database_models.country.id == db_user.country_fk).first()
        country_name = country_row.country if country_row else None

    pincode_value = None
    city = None
    state_name = None
    if db_user.pincode_fk:
        pincode_row = db.query(database_models.pincode).filter(database_models.pincode.id == db_user.pincode_fk).first()
        if pincode_row:
            pincode_value = pincode_row.pincode
            district_row = db.query(database_models.district).filter(database_models.district.id == pincode_row.district_fk).first()
            if district_row:
                city = district_row.city
                state_row = db.query(database_models.state).filter(database_models.state.id == district_row.state_fk).first()
                state_name = state_row.state if state_row else None

    return {
        "id": db_user.id,
        "username": db_user.username,
        "email": db_user.email,
        "full_name": db_user.full_name,
        "is_active": db_user.is_active,
        "network_access": db_user.network_access,
        "ip_addresses": db_user.ip_addresses or [],
        "usergroup_fk": db_user.usergroup_fk,
        "usergroup_description": usergroup_description,
        "capabilities": capabilities,
        "profile_photo": db_user.profile_photo,
        "gender_fk": db_user.gender_fk,
        "gender_name": gender_name,
        "country_fk": db_user.country_fk,
        "country_name": country_name,
        "pincode_fk": db_user.pincode_fk,
        "pincode_value": pincode_value,
        "city": city,
        "state_name": state_name,
    }

@app.get("/")
def greet():
    return "Welcome, SmartSpend!"

def serialize_commonmaster(db_commonmaster: database_models.commonmaster, db: Session):
    owner = db.query(database_models.User).filter(database_models.User.id == db_commonmaster.userid_fk).first()
    return {
        "id": db_commonmaster.id,
        "name": db_commonmaster.name,
        "description": db_commonmaster.description,
        "tag": db_commonmaster.tag,
        "userid_fk": db_commonmaster.userid_fk,
        "owner_username": owner.username if owner else None,
    }

def serialize_categorymaster(db_categorymaster: database_models.categorymaster, db: Session):
    common = db.query(database_models.commonmaster).filter(database_models.commonmaster.id == db_categorymaster.commonmaster_fk).first()
    owner = db.query(database_models.User).filter(database_models.User.id == db_categorymaster.userid_fk).first()
    return {
        "id": db_categorymaster.id,
        "name": db_categorymaster.name,
        "commonmaster_fk": db_categorymaster.commonmaster_fk,
        "commonmaster_name": common.name if common else None,
        "tag": db_categorymaster.tag,
        "userid_fk": db_categorymaster.userid_fk,
        "owner_username": owner.username if owner else None,
    }

def serialize_productsandservices(db_p: database_models.productsandservices, db: Session):
    category = db.query(database_models.categorymaster).filter(database_models.categorymaster.id == db_p.categorymaster_fk).first()
    owner = db.query(database_models.User).filter(database_models.User.id == db_p.userid_fk).first()
    return {
        "id": db_p.id,
        "name": db_p.name,
        "description": db_p.description,
        "categorymaster_fk": db_p.categorymaster_fk,
        "category_name": category.name if category else None,
        "userid_fk": db_p.userid_fk,
        "owner_username": owner.username if owner else None,
    }

@app.get("/commonmaster/")
def read_commonmasters(db: Session = Depends(get_db)):
    return [serialize_commonmaster(c, db) for c in db.query(database_models.commonmaster).all()]

@app.get("/commonmaster/{commonmaster_id}")
def read_commonmaster(commonmaster_id: int, db: Session = Depends(get_db)):
    db_commonmaster = db.query(database_models.commonmaster).filter(database_models.commonmaster.id == commonmaster_id).first()
    if db_commonmaster:
        return serialize_commonmaster(db_commonmaster, db)
    return {"message": "Common master not found!"}

@app.post("/commonmaster/")
def create_commonmaster(name: str, userid_fk: int, description: str = None, tag: str = None, db: Session = Depends(get_db)):
    db_commonmaster = database_models.commonmaster(name=name, description=description, tag=tag, userid_fk=userid_fk)
    db.add(db_commonmaster)
    db.commit()
    db.refresh(db_commonmaster)
    return serialize_commonmaster(db_commonmaster, db)

@app.put("/commonmaster/{commonmaster_id}")
def update_commonmaster(commonmaster_id: int, name: str = None, description: str = None, tag: str = None, userid_fk: int = None, db: Session = Depends(get_db)):
    db_commonmaster = db.query(database_models.commonmaster).filter(database_models.commonmaster.id == commonmaster_id).first()
    if not db_commonmaster:
        return {"message": "Common master not found!"}
    if name is not None:
        db_commonmaster.name = name
    if description is not None:
        db_commonmaster.description = description
    if tag is not None:
        db_commonmaster.tag = tag
    if userid_fk is not None:
        db_commonmaster.userid_fk = userid_fk
    db.commit()
    db.refresh(db_commonmaster)
    return serialize_commonmaster(db_commonmaster, db)

@app.delete("/commonmaster/{commonmaster_id}")
def delete_commonmaster(commonmaster_id: int, db: Session = Depends(get_db)):
    db_commonmaster = db.query(database_models.commonmaster).filter(database_models.commonmaster.id == commonmaster_id).first()
    if not db_commonmaster:
        return {"message": "Common master not found!"}
    in_use = db.query(database_models.categorymaster).filter(database_models.categorymaster.commonmaster_fk == commonmaster_id).first()
    if in_use:
        raise HTTPException(status_code=400, detail="This common master is still used by one or more categories and can't be deleted")
    db.delete(db_commonmaster)
    db.commit()
    return {"message": "Common master deleted"}

@app.get("/categorymaster/")
def read_categorymasters(db: Session = Depends(get_db)):
    return [serialize_categorymaster(c, db) for c in db.query(database_models.categorymaster).all()]

@app.get("/categorymaster/{categorymaster_id}")
def read_categorymaster(categorymaster_id: int, db: Session = Depends(get_db)):
    db_categorymaster = db.query(database_models.categorymaster).filter(database_models.categorymaster.id == categorymaster_id).first()
    if db_categorymaster:
        return serialize_categorymaster(db_categorymaster, db)
    return {"message": "Category master not found!"}

@app.post("/categorymaster/")
def create_categorymaster(name: str, commonmaster_fk: int, userid_fk: int, tag: str = None, db: Session = Depends(get_db)):
    db_categorymaster = database_models.categorymaster(name=name, commonmaster_fk=commonmaster_fk, tag=tag, userid_fk=userid_fk)
    db.add(db_categorymaster)
    db.commit()
    db.refresh(db_categorymaster)
    return serialize_categorymaster(db_categorymaster, db)

@app.put("/categorymaster/{categorymaster_id}")
def update_categorymaster(categorymaster_id: int, name: str = None, commonmaster_fk: int = None, tag: str = None, userid_fk: int = None, db: Session = Depends(get_db)):
    db_categorymaster = db.query(database_models.categorymaster).filter(database_models.categorymaster.id == categorymaster_id).first()
    if not db_categorymaster:
        return {"message": "Category master not found!"}
    if name is not None:
        db_categorymaster.name = name
    if commonmaster_fk is not None:
        db_categorymaster.commonmaster_fk = commonmaster_fk
    if tag is not None:
        db_categorymaster.tag = tag
    if userid_fk is not None:
        db_categorymaster.userid_fk = userid_fk
    db.commit()
    db.refresh(db_categorymaster)
    return serialize_categorymaster(db_categorymaster, db)

@app.delete("/categorymaster/{categorymaster_id}")
def delete_categorymaster(categorymaster_id: int, db: Session = Depends(get_db)):
    db_categorymaster = db.query(database_models.categorymaster).filter(database_models.categorymaster.id == categorymaster_id).first()
    if not db_categorymaster:
        return {"message": "Category master not found!"}
    in_use = db.query(database_models.productsandservices).filter(database_models.productsandservices.categorymaster_fk == categorymaster_id).first()
    if in_use:
        raise HTTPException(status_code=400, detail="This category is still used by one or more products/services and can't be deleted")
    db.delete(db_categorymaster)
    db.commit()
    return {"message": "Category master deleted"}

@app.get("/productsandservices/")
def read_productsandservices_list(db: Session = Depends(get_db)):
    return [serialize_productsandservices(p, db) for p in db.query(database_models.productsandservices).all()]

@app.get("/productsandservices/{productsandservices_id}")
def read_productsandservices(productsandservices_id: int, db: Session = Depends(get_db)):
    db_p = db.query(database_models.productsandservices).filter(database_models.productsandservices.id == productsandservices_id).first()
    if db_p:
        return serialize_productsandservices(db_p, db)
    return {"message": "Product/service not found!"}

@app.post("/productsandservices/")
def create_productsandservices(name: str, categorymaster_fk: int, userid_fk: int, description: str = None, db: Session = Depends(get_db)):
    db_productsandservices = database_models.productsandservices(name=name, categorymaster_fk=categorymaster_fk, description=description, userid_fk=userid_fk)
    db.add(db_productsandservices)
    db.commit()
    db.refresh(db_productsandservices)
    return serialize_productsandservices(db_productsandservices, db)

@app.put("/productsandservices/{productsandservices_id}")
def update_productsandservices(productsandservices_id: int, name: str = None, categorymaster_fk: int = None, description: str = None, userid_fk: int = None, db: Session = Depends(get_db)):
    db_p = db.query(database_models.productsandservices).filter(database_models.productsandservices.id == productsandservices_id).first()
    if not db_p:
        return {"message": "Product/service not found!"}
    if name is not None:
        db_p.name = name
    if categorymaster_fk is not None:
        db_p.categorymaster_fk = categorymaster_fk
    if description is not None:
        db_p.description = description
    if userid_fk is not None:
        db_p.userid_fk = userid_fk
    db.commit()
    db.refresh(db_p)
    return serialize_productsandservices(db_p, db)

@app.delete("/productsandservices/{productsandservices_id}")
def delete_productsandservices(productsandservices_id: int, db: Session = Depends(get_db)):
    db_p = db.query(database_models.productsandservices).filter(database_models.productsandservices.id == productsandservices_id).first()
    if not db_p:
        return {"message": "Product/service not found!"}
    in_use = db.query(database_models.transactions).filter(database_models.transactions.products_services_fk == productsandservices_id).first()
    if in_use:
        raise HTTPException(status_code=400, detail="This product/service is still used by one or more transactions and can't be deleted")
    db.delete(db_p)
    db.commit()
    return {"message": "Product/service deleted"}

def resolve_products_services_fk(products_services_fk: int, db: Session):
    if not db.query(database_models.productsandservices).filter(database_models.productsandservices.id == products_services_fk).first():
        raise HTTPException(status_code=400, detail="products_services_fk does not reference an existing product/service")
    return products_services_fk

def serialize_transaction(db_t: database_models.transactions, db: Session):
    product = db.query(database_models.productsandservices).filter(database_models.productsandservices.id == db_t.products_services_fk).first()
    category = None
    common = None
    if product:
        category = db.query(database_models.categorymaster).filter(database_models.categorymaster.id == product.categorymaster_fk).first()
        if category:
            common = db.query(database_models.commonmaster).filter(database_models.commonmaster.id == category.commonmaster_fk).first()
    owner = db.query(database_models.User).filter(database_models.User.id == db_t.userid_fk).first()
    return {
        "id": db_t.id,
        "amount": db_t.amount,
        "transaction_date": db_t.transaction_date,
        "note": db_t.note,
        "products_services_fk": db_t.products_services_fk,
        "product_name": product.name if product else None,
        "categorymaster_fk": category.id if category else None,
        "category_name": category.name if category else None,
        "commonmaster_fk": common.id if common else None,
        "commonmaster_name": common.name if common else None,
        "userid_fk": db_t.userid_fk,
        "owner_username": owner.username if owner else None,
    }

@app.get("/transactions/")
def read_transactions(
    userid_fk: int | None = None,
    from_date: str | None = None,
    to_date: str | None = None,
    db: Session = Depends(get_db),
):
    if (from_date is None) != (to_date is None):
        raise HTTPException(status_code=400, detail="from_date and to_date must be provided together")
    if from_date is not None and to_date is not None:
        try:
            parsed_from = datetime.date.fromisoformat(from_date)
            parsed_to = datetime.date.fromisoformat(to_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="from_date and to_date must be in YYYY-MM-DD format")
        if parsed_from > parsed_to:
            raise HTTPException(status_code=400, detail="from_date must not be after to_date")
        if parsed_to > months_ago(parsed_from, -6):
            raise HTTPException(status_code=400, detail="Date range cannot exceed 6 months")

    query = db.query(database_models.transactions)
    if userid_fk is not None:
        query = query.filter(database_models.transactions.userid_fk == userid_fk)
    if from_date is not None:
        query = query.filter(database_models.transactions.transaction_date >= from_date)
    if to_date is not None:
        query = query.filter(database_models.transactions.transaction_date <= to_date)
    return [serialize_transaction(t, db) for t in query.all()]

@app.get("/transactions/{transaction_id}")
def read_transaction(transaction_id: int, db: Session = Depends(get_db)):
    db_transactions = db.query(database_models.transactions).filter(database_models.transactions.id == transaction_id).first()
    if db_transactions:
        return serialize_transaction(db_transactions, db)
    return {"message": "Transaction not found!"}

@app.post("/transactions/")
def create_transactions(amount: float, products_services_fk: int, transaction_date: str, userid_fk: int, note: str = None, db: Session = Depends(get_db)):
    products_services_fk = resolve_products_services_fk(products_services_fk, db)
    transaction_date = resolve_transaction_date(transaction_date)
    if not db.query(database_models.User).filter(database_models.User.id == userid_fk).first():
        raise HTTPException(status_code=400, detail="userid_fk does not reference an existing user")
    db_transactions = database_models.transactions(amount=amount, products_services_fk=products_services_fk, transaction_date=transaction_date, userid_fk=userid_fk, note=note)
    db.add(db_transactions)
    db.commit()
    db.refresh(db_transactions)
    return serialize_transaction(db_transactions, db)

@app.put("/transactions/{transaction_id}")
def update_transaction(transaction_id: int, amount: float = None, products_services_fk: int = None, transaction_date: str = None, userid_fk: int = None, note: str = None, db: Session = Depends(get_db)):
    db_transactions = db.query(database_models.transactions).filter(database_models.transactions.id == transaction_id).first()
    if not db_transactions:
        return {"message": "Transaction not found!"}
    if amount is not None:
        db_transactions.amount = amount
    if products_services_fk is not None:
        db_transactions.products_services_fk = resolve_products_services_fk(products_services_fk, db)
    if transaction_date is not None:
        db_transactions.transaction_date = resolve_transaction_date(transaction_date)
    if userid_fk is not None:
        if not db.query(database_models.User).filter(database_models.User.id == userid_fk).first():
            raise HTTPException(status_code=400, detail="userid_fk does not reference an existing user")
        db_transactions.userid_fk = userid_fk
    if note is not None:
        db_transactions.note = note
    db.commit()
    db.refresh(db_transactions)
    return serialize_transaction(db_transactions, db)

@app.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    db_transactions = db.query(database_models.transactions).filter(database_models.transactions.id == transaction_id).first()
    if not db_transactions:
        return {"message": "Transaction not found!"}
    db.delete(db_transactions)
    db.commit()
    return {"message": "Transaction deleted"}

@app.post("/login")
def login(username: str, password: str, db: Session = Depends(get_db)):
    db_user = db.query(database_models.User).filter(database_models.User.username == username).first()
    if not db_user or not pwd_context.verify(password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not db_user.is_active:
        raise HTTPException(status_code=403, detail="User is deactivated")
    return serialize_user(db_user, db)

@app.get("/users/")
def read_users(db: Session = Depends(get_db)):
    return [serialize_user(u, db) for u in db.query(database_models.User).all()]

@app.get("/users/{user_id}")
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(database_models.User).filter(database_models.User.id == user_id).first()
    if db_user:
        return serialize_user(db_user, db)
    return {"message": "User not found!"}

@app.post("/users/")
def create_user(
    username: str,
    email: str,
    full_name: str,
    password: str,
    usergroup_fk: int,
    network_access: str = database_models.NetworkAccess.OPEN.value,
    ip_addresses: list[str] | None = Query(default=None),
    is_active: int = 1,
    gender_fk: int | None = None,
    country_fk: int | None = None,
    pincode_fk: int | None = None,
    profile_photo: str | None = Body(default=None),
    db: Session = Depends(get_db),
):
    usergroup_fk = resolve_usergroup_fk(usergroup_fk, db)
    network_access, ip_addresses = resolve_network_access(network_access, ip_addresses)
    gender_fk = resolve_gender_fk(gender_fk, db)
    country_fk = resolve_optional_fk(country_fk, database_models.country, "country_fk", db)
    pincode_fk = resolve_optional_fk(pincode_fk, database_models.pincode, "pincode_fk", db)
    profile_photo = validate_flag(profile_photo)
    db_user = database_models.User(
        username=username,
        email=email,
        full_name=full_name,
        hashed_password=pwd_context.hash(password),
        is_active=is_active,
        network_access=network_access,
        ip_addresses=ip_addresses,
        usergroup_fk=usergroup_fk,
        gender_fk=gender_fk,
        country_fk=country_fk,
        pincode_fk=pincode_fk,
        profile_photo=profile_photo,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return serialize_user(db_user, db)

@app.put("/users/{user_id}")
def update_user(
    user_id: int,
    username: str = None,
    email: str = None,
    full_name: str = None,
    password: str = None,
    network_access: str = None,
    ip_addresses: list[str] | None = Query(default=None),
    usergroup_fk: int | None = None,
    is_active: int = None,
    gender_fk: int | None = None,
    country_fk: int | None = None,
    pincode_fk: int | None = None,
    profile_photo: str | None = Body(default=None),
    db: Session = Depends(get_db),
):
    db_user = db.query(database_models.User).filter(database_models.User.id == user_id).first()
    if not db_user:
        return {"message": "User not found!"}
    if username is not None:
        db_user.username = username
    if email is not None:
        db_user.email = email
    if full_name is not None:
        db_user.full_name = full_name
    if password is not None:
        db_user.hashed_password = pwd_context.hash(password)
    if is_active is not None:
        db_user.is_active = is_active
    if gender_fk is not None:
        db_user.gender_fk = resolve_gender_fk(gender_fk, db)
    if country_fk is not None:
        db_user.country_fk = resolve_optional_fk(country_fk, database_models.country, "country_fk", db)
    if pincode_fk is not None:
        db_user.pincode_fk = resolve_optional_fk(pincode_fk, database_models.pincode, "pincode_fk", db)
    if profile_photo is not None:
        db_user.profile_photo = validate_flag(profile_photo)
    effective_usergroup_fk = usergroup_fk if usergroup_fk is not None else db_user.usergroup_fk
    db_user.usergroup_fk = resolve_usergroup_fk(effective_usergroup_fk, db)
    if network_access is not None or ip_addresses is not None:
        effective_network_access = network_access if network_access is not None else db_user.network_access
        effective_ip_addresses = ip_addresses if ip_addresses is not None else db_user.ip_addresses
        effective_network_access, effective_ip_addresses = resolve_network_access(effective_network_access, effective_ip_addresses)
        db_user.network_access = effective_network_access
        db_user.ip_addresses = effective_ip_addresses
    db.commit()
    db.refresh(db_user)
    return serialize_user(db_user, db)

def resolve_capabilitymaster_fk(capabilitymaster_fk: dict, db: Session):
    capability_ids = capabilitymaster_fk.get("capability_ids", []) if capabilitymaster_fk else []
    if not isinstance(capability_ids, list):
        raise HTTPException(status_code=400, detail="capability_ids must be a list")
    valid_count = (
        db.query(database_models.capabilitymaster)
        .filter(database_models.capabilitymaster.id.in_(capability_ids))
        .count()
        if capability_ids
        else 0
    )
    if valid_count != len(set(capability_ids)):
        raise HTTPException(status_code=400, detail="One or more capability ids are invalid")
    return {"capability_ids": capability_ids}

def serialize_usergroup(db_usergroup: database_models.usergroup, db: Session):
    owner = db.query(database_models.User).filter(database_models.User.id == db_usergroup.userid_fk).first()
    capability_ids = (db_usergroup.capabilitymaster_fk or {}).get("capability_ids", [])
    return {
        "id": db_usergroup.id,
        "name": db_usergroup.name,
        "description": db_usergroup.description,
        "tag": db_usergroup.tag,
        "userid_fk": db_usergroup.userid_fk,
        "owner_username": owner.username if owner else None,
        "capabilitymaster_fk": db_usergroup.capabilitymaster_fk,
        "capability_ids": capability_ids,
    }

@app.get("/usergroup/")
def read_usergroups(db: Session = Depends(get_db)):
    return [serialize_usergroup(g, db) for g in db.query(database_models.usergroup).all()]

@app.get("/usergroup/{usergroup_id}")
def read_usergroup(usergroup_id: int, db: Session = Depends(get_db)):
    db_usergroup = db.query(database_models.usergroup).filter(database_models.usergroup.id == usergroup_id).first()
    if db_usergroup:
        return serialize_usergroup(db_usergroup, db)
    return {"message": "User group not found!"}

@app.post("/usergroup/")
def create_usergroup(name: str, userid_fk: int, capabilitymaster_fk: dict, description: str = None, tag: str = None, db: Session = Depends(get_db)):
    capabilitymaster_fk = resolve_capabilitymaster_fk(capabilitymaster_fk, db)
    db_usergroup = database_models.usergroup(name=name, description=description, tag=tag, userid_fk=userid_fk, capabilitymaster_fk=capabilitymaster_fk)
    db.add(db_usergroup)
    db.commit()
    db.refresh(db_usergroup)
    return serialize_usergroup(db_usergroup, db)

@app.put("/usergroup/{usergroup_id}")
def update_usergroup(usergroup_id: int, name: str = None, description: str = None, tag: str = None, userid_fk: int = None, capabilitymaster_fk: dict = None, db: Session = Depends(get_db)):
    db_usergroup = db.query(database_models.usergroup).filter(database_models.usergroup.id == usergroup_id).first()
    if not db_usergroup:
        return {"message": "User group not found!"}
    if name is not None:
        db_usergroup.name = name
    if description is not None:
        db_usergroup.description = description
    if tag is not None:
        db_usergroup.tag = tag
    if userid_fk is not None:
        db_usergroup.userid_fk = userid_fk
    if capabilitymaster_fk is not None:
        db_usergroup.capabilitymaster_fk = resolve_capabilitymaster_fk(capabilitymaster_fk, db)
    db.commit()
    db.refresh(db_usergroup)
    return serialize_usergroup(db_usergroup, db)

@app.delete("/usergroup/{usergroup_id}")
def delete_usergroup(usergroup_id: int, db: Session = Depends(get_db)):
    db_usergroup = db.query(database_models.usergroup).filter(database_models.usergroup.id == usergroup_id).first()
    if not db_usergroup:
        return {"message": "User group not found!"}
    try:
        db.delete(db_usergroup)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="This user group is still assigned to one or more users and can't be deleted")
    return {"message": "User group deleted"}

@app.get("/capabilitymaster/")
def read_capabilitymasters(db: Session = Depends(get_db)):
    return db.query(database_models.capabilitymaster).all()

@app.get("/capabilitymaster/{capability_id}")
def read_capabilitymaster(capability_id: int, db: Session = Depends(get_db)):
    db_capabilitymaster = db.query(database_models.capabilitymaster).filter(database_models.capabilitymaster.id == capability_id).first()
    if db_capabilitymaster:
        return db_capabilitymaster
    return {"message": "Capability not found!"}

@app.post("/capabilitymaster/")
def create_capabilitymaster(name: str, description: str = None, tag: str = None, db: Session = Depends(get_db)):
    db_capabilitymaster = database_models.capabilitymaster(name=name, description=description, tag=tag)
    db.add(db_capabilitymaster)
    db.commit()
    db.refresh(db_capabilitymaster)
    return db_capabilitymaster

@app.put("/capabilitymaster/{capability_id}")
def update_capabilitymaster(capability_id: int, name: str = None, description: str = None, tag: str = None, db: Session = Depends(get_db)):
    db_capabilitymaster = db.query(database_models.capabilitymaster).filter(database_models.capabilitymaster.id == capability_id).first()
    if not db_capabilitymaster:
        return {"message": "Capability not found!"}
    if name is not None:
        db_capabilitymaster.name = name
    if description is not None:
        db_capabilitymaster.description = description
    if tag is not None:
        db_capabilitymaster.tag = tag
    db.commit()
    db.refresh(db_capabilitymaster)
    return db_capabilitymaster

# --- Geography: country / state / district / pincode ---

ALPHANUMERIC_RE = re.compile(r"^[A-Za-z0-9]+$")
ALPHANUMERIC_SPACE_RE = re.compile(r"^[A-Za-z0-9 ]+$")
ALPHA_RE = re.compile(r"^[A-Za-z ]+$")
PHONE_CODE_RE = re.compile(r"^\+?[0-9]+$")

def require_alphanumeric(value: str, field_name: str, max_length: int):
    if not value or len(value) > max_length or not ALPHANUMERIC_RE.match(value):
        raise HTTPException(status_code=400, detail=f"{field_name} must be 1-{max_length} alphanumeric characters")
    return value

# Country names are alphanumeric like the other geography fields, but
# realistically need spaces ("United States", "New Zealand") -- unlike the
# short codes (country_code, country_phone_code, pincode) which don't.
def require_alphanumeric_name(value: str, field_name: str, max_length: int):
    if not value or len(value) > max_length or not ALPHANUMERIC_SPACE_RE.match(value):
        raise HTTPException(status_code=400, detail=f"{field_name} must be 1-{max_length} alphanumeric characters")
    return value

# Phone codes are conventionally written with a leading "+" (e.g. "+91",
# "+44"), which isn't alphanumeric -- allow an optional leading "+" followed
# by digits instead of reusing require_alphanumeric.
def require_phone_code(value: str, field_name: str, max_length: int):
    if not value or len(value) > max_length or not PHONE_CODE_RE.match(value):
        raise HTTPException(status_code=400, detail=f"{field_name} must be up to {max_length} characters: an optional leading '+' followed by digits")
    return value

def require_alpha(value: str, field_name: str, max_length: int):
    if not value or len(value) > max_length or not ALPHA_RE.match(value):
        raise HTTPException(status_code=400, detail=f"{field_name} must be 1-{max_length} alphabetic characters")
    return value

def require_fixed_alphanumeric(value: str, field_name: str, length: int):
    if not value or len(value) != length or not ALPHANUMERIC_RE.match(value):
        raise HTTPException(status_code=400, detail=f"{field_name} must be exactly {length} alphanumeric characters")
    return value

def validate_flag(flag: str | None):
    if flag is None:
        return None
    try:
        base64.b64decode(flag, validate=True)
    except Exception:
        raise HTTPException(status_code=400, detail="flag must be valid base64")
    return flag

def commit_or_conflict(db: Session, message: str):
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail=message)

def resolve_country_fk(country_fk: int, db: Session):
    if not db.query(database_models.country).filter(database_models.country.id == country_fk).first():
        raise HTTPException(status_code=400, detail="country_fk does not reference an existing country")
    return country_fk

def resolve_state_fk(state_fk: int, db: Session):
    if not db.query(database_models.state).filter(database_models.state.id == state_fk).first():
        raise HTTPException(status_code=400, detail="state_fk does not reference an existing state")
    return state_fk

def resolve_district_fk(district_fk: int, db: Session):
    if not db.query(database_models.district).filter(database_models.district.id == district_fk).first():
        raise HTTPException(status_code=400, detail="district_fk does not reference an existing district")
    return district_fk

def serialize_country(db_country: database_models.country):
    return {
        "id": db_country.id,
        "country": db_country.country,
        "flag": db_country.flag,
        "country_code": db_country.country_code,
        "country_phone_code": db_country.country_phone_code,
        "currency": db_country.currency,
    }

def serialize_state(db_state: database_models.state, db: Session):
    country_row = db.query(database_models.country).filter(database_models.country.id == db_state.country_fk).first()
    return {
        "id": db_state.id,
        "state": db_state.state,
        "country_fk": db_state.country_fk,
        "country_name": country_row.country if country_row else None,
    }

def serialize_district(db_district: database_models.district, db: Session):
    state_row = db.query(database_models.state).filter(database_models.state.id == db_district.state_fk).first()
    country_row = None
    if state_row:
        country_row = db.query(database_models.country).filter(database_models.country.id == state_row.country_fk).first()
    return {
        "id": db_district.id,
        "city": db_district.city,
        "district": db_district.district,
        "tag": db_district.tag,
        "state_fk": db_district.state_fk,
        "state_name": state_row.state if state_row else None,
        "country_name": country_row.country if country_row else None,
    }

def serialize_pincode(db_pincode: database_models.pincode, db: Session):
    district_row = db.query(database_models.district).filter(database_models.district.id == db_pincode.district_fk).first()
    state_row = None
    country_row = None
    if district_row:
        state_row = db.query(database_models.state).filter(database_models.state.id == district_row.state_fk).first()
        if state_row:
            country_row = db.query(database_models.country).filter(database_models.country.id == state_row.country_fk).first()
    return {
        "id": db_pincode.id,
        "pincode": db_pincode.pincode,
        "district_fk": db_pincode.district_fk,
        "district_name": district_row.district if district_row else None,
        "city": district_row.city if district_row else None,
        "state_name": state_row.state if state_row else None,
        "country_name": country_row.country if country_row else None,
    }

@app.get("/country/")
def read_countries(db: Session = Depends(get_db)):
    return [serialize_country(c) for c in db.query(database_models.country).all()]

@app.get("/country/{country_id}")
def read_country(country_id: int, db: Session = Depends(get_db)):
    db_country = db.query(database_models.country).filter(database_models.country.id == country_id).first()
    if db_country:
        return serialize_country(db_country)
    return {"message": "Country not found!"}

@app.post("/country/")
def create_country(
    country: str,
    country_code: str,
    country_phone_code: str,
    flag: str | None = Body(default=None),
    currency: dict | None = Body(default=None),
    db: Session = Depends(get_db),
):
    country = require_alphanumeric_name(country, "country", 50)
    country_code = require_alphanumeric(country_code, "country_code", 3)
    country_phone_code = require_phone_code(country_phone_code, "country_phone_code", 3)
    flag = validate_flag(flag)
    db_country = database_models.country(
        country=country,
        flag=flag,
        country_code=country_code,
        country_phone_code=country_phone_code,
        currency=currency,
    )
    db.add(db_country)
    commit_or_conflict(db, "A country with this name, code, or phone code already exists")
    db.refresh(db_country)
    return serialize_country(db_country)

@app.put("/country/{country_id}")
def update_country(
    country_id: int,
    country: str = None,
    country_code: str = None,
    country_phone_code: str = None,
    flag: str | None = Body(default=None),
    currency: dict | None = Body(default=None),
    db: Session = Depends(get_db),
):
    db_country = db.query(database_models.country).filter(database_models.country.id == country_id).first()
    if not db_country:
        return {"message": "Country not found!"}
    if country is not None:
        db_country.country = require_alphanumeric_name(country, "country", 50)
    if country_code is not None:
        db_country.country_code = require_alphanumeric(country_code, "country_code", 3)
    if country_phone_code is not None:
        db_country.country_phone_code = require_phone_code(country_phone_code, "country_phone_code", 3)
    if flag is not None:
        db_country.flag = validate_flag(flag)
    if currency is not None:
        db_country.currency = currency
    commit_or_conflict(db, "A country with this name, code, or phone code already exists")
    db.refresh(db_country)
    return serialize_country(db_country)

@app.delete("/country/{country_id}")
def delete_country(country_id: int, db: Session = Depends(get_db)):
    db_country = db.query(database_models.country).filter(database_models.country.id == country_id).first()
    if not db_country:
        return {"message": "Country not found!"}
    in_use = db.query(database_models.state).filter(database_models.state.country_fk == country_id).first()
    if in_use:
        raise HTTPException(status_code=400, detail="This country is still used by one or more states and can't be deleted")
    db.delete(db_country)
    db.commit()
    return {"message": "Country deleted"}

@app.get("/state/")
def read_states(db: Session = Depends(get_db)):
    return [serialize_state(s, db) for s in db.query(database_models.state).all()]

@app.get("/state/{state_id}")
def read_state(state_id: int, db: Session = Depends(get_db)):
    db_state = db.query(database_models.state).filter(database_models.state.id == state_id).first()
    if db_state:
        return serialize_state(db_state, db)
    return {"message": "State not found!"}

@app.post("/state/")
def create_state(state: str, country_fk: int, db: Session = Depends(get_db)):
    state = require_alpha(state, "state", 25)
    country_fk = resolve_country_fk(country_fk, db)
    db_state = database_models.state(state=state, country_fk=country_fk)
    db.add(db_state)
    commit_or_conflict(db, "A state with this name already exists")
    db.refresh(db_state)
    return serialize_state(db_state, db)

@app.put("/state/{state_id}")
def update_state(state_id: int, state: str = None, country_fk: int = None, db: Session = Depends(get_db)):
    db_state = db.query(database_models.state).filter(database_models.state.id == state_id).first()
    if not db_state:
        return {"message": "State not found!"}
    if state is not None:
        db_state.state = require_alpha(state, "state", 25)
    if country_fk is not None:
        db_state.country_fk = resolve_country_fk(country_fk, db)
    commit_or_conflict(db, "A state with this name already exists")
    db.refresh(db_state)
    return serialize_state(db_state, db)

@app.delete("/state/{state_id}")
def delete_state(state_id: int, db: Session = Depends(get_db)):
    db_state = db.query(database_models.state).filter(database_models.state.id == state_id).first()
    if not db_state:
        return {"message": "State not found!"}
    in_use = db.query(database_models.district).filter(database_models.district.state_fk == state_id).first()
    if in_use:
        raise HTTPException(status_code=400, detail="This state is still used by one or more districts and can't be deleted")
    db.delete(db_state)
    db.commit()
    return {"message": "State deleted"}

@app.get("/district/")
def read_districts(db: Session = Depends(get_db)):
    return [serialize_district(d, db) for d in db.query(database_models.district).all()]

@app.get("/district/{district_id}")
def read_district(district_id: int, db: Session = Depends(get_db)):
    db_district = db.query(database_models.district).filter(database_models.district.id == district_id).first()
    if db_district:
        return serialize_district(db_district, db)
    return {"message": "District not found!"}

@app.post("/district/")
def create_district(city: str, district: str, state_fk: int, tag: dict | None = None, db: Session = Depends(get_db)):
    city = require_alpha(city, "city", 25)
    district = require_alpha(district, "district", 25)
    state_fk = resolve_state_fk(state_fk, db)
    db_district = database_models.district(city=city, district=district, tag=tag, state_fk=state_fk)
    db.add(db_district)
    commit_or_conflict(db, "A district with this name already exists")
    db.refresh(db_district)
    return serialize_district(db_district, db)

@app.put("/district/{district_id}")
def update_district(district_id: int, city: str = None, district: str = None, state_fk: int = None, tag: dict = None, db: Session = Depends(get_db)):
    db_district = db.query(database_models.district).filter(database_models.district.id == district_id).first()
    if not db_district:
        return {"message": "District not found!"}
    if city is not None:
        db_district.city = require_alpha(city, "city", 25)
    if district is not None:
        db_district.district = require_alpha(district, "district", 25)
    if state_fk is not None:
        db_district.state_fk = resolve_state_fk(state_fk, db)
    if tag is not None:
        db_district.tag = tag
    commit_or_conflict(db, "A district with this name already exists")
    db.refresh(db_district)
    return serialize_district(db_district, db)

@app.delete("/district/{district_id}")
def delete_district(district_id: int, db: Session = Depends(get_db)):
    db_district = db.query(database_models.district).filter(database_models.district.id == district_id).first()
    if not db_district:
        return {"message": "District not found!"}
    in_use = db.query(database_models.pincode).filter(database_models.pincode.district_fk == district_id).first()
    if in_use:
        raise HTTPException(status_code=400, detail="This district is still used by one or more pincodes and can't be deleted")
    db.delete(db_district)
    db.commit()
    return {"message": "District deleted"}

@app.get("/pincode/")
def read_pincodes(db: Session = Depends(get_db)):
    return [serialize_pincode(p, db) for p in db.query(database_models.pincode).all()]

@app.get("/pincode/{pincode_id}")
def read_pincode(pincode_id: int, db: Session = Depends(get_db)):
    db_pincode = db.query(database_models.pincode).filter(database_models.pincode.id == pincode_id).first()
    if db_pincode:
        return serialize_pincode(db_pincode, db)
    return {"message": "Pincode not found!"}

@app.post("/pincode/")
def create_pincode(pincode: str, district_fk: int, db: Session = Depends(get_db)):
    pincode = require_fixed_alphanumeric(pincode, "pincode", 6)
    district_fk = resolve_district_fk(district_fk, db)
    db_pincode = database_models.pincode(pincode=pincode, district_fk=district_fk)
    db.add(db_pincode)
    db.commit()
    db.refresh(db_pincode)
    return serialize_pincode(db_pincode, db)

@app.put("/pincode/{pincode_id}")
def update_pincode(pincode_id: int, pincode: str = None, district_fk: int = None, db: Session = Depends(get_db)):
    db_pincode = db.query(database_models.pincode).filter(database_models.pincode.id == pincode_id).first()
    if not db_pincode:
        return {"message": "Pincode not found!"}
    if pincode is not None:
        db_pincode.pincode = require_fixed_alphanumeric(pincode, "pincode", 6)
    if district_fk is not None:
        db_pincode.district_fk = resolve_district_fk(district_fk, db)
    db.commit()
    db.refresh(db_pincode)
    return serialize_pincode(db_pincode, db)

@app.delete("/pincode/{pincode_id}")
def delete_pincode(pincode_id: int, db: Session = Depends(get_db)):
    db_pincode = db.query(database_models.pincode).filter(database_models.pincode.id == pincode_id).first()
    if not db_pincode:
        return {"message": "Pincode not found!"}
    db.delete(db_pincode)
    db.commit()
    return {"message": "Pincode deleted"}