import ipaddress

from fastapi import Depends, FastAPI, HTTPException, Query
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

def serialize_user(db_user: database_models.User, db: Session):
    usergroup_description = None
    if db_user.usergroup_fk:
        db_usergroup = db.query(database_models.usergroup).filter(database_models.usergroup.id == db_user.usergroup_fk).first()
        usergroup_description = db_usergroup.description if db_usergroup else None

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
    }

@app.get("/")
def greet():
    return "Welcome, SmartSpend!"

@app.get("/commonmaster/")
def read_items(db: Session = Depends(get_db)):
    db_commonmaster = db.query(database_models.commonmaster).all()
    return db_commonmaster

@app.get("/categorymaster/")
def read_items(db: Session = Depends(get_db)):
    db_categorymaster = db.query(database_models.categorymaster).all()
    return db_categorymaster

@app.get("/productsandservices/")
def read_items(db: Session = Depends(get_db)):
    db_productsandservices = db.query(database_models.productsandservices).all()
    return db_productsandservices

@app.get("/transactions/{tnx_number}")
def read_items(tnx_number = str, db: Session = Depends(get_db)):
    db_transactions = db.query(database_models.transactions).filter(database_models.transactions.id == tnx_number).first()
    if db_transactions:
        return db_transactions
    return {"message": "Transaction not found!"}

@app.post("/commonmaster/")
def create_commonmaster(name: str, description: str = None, tag: str = None, userid_fk: int = None, db: Session = Depends(get_db)):
    db_commonmaster = database_models.commonmaster(name=name, description=description, tag=tag, userid_fk=userid_fk)
    db.add(db_commonmaster)
    db.commit()
    db.refresh(db_commonmaster)
    return db_commonmaster

@app.post("/categorymaster/")
def create_categorymaster(name: str, commonmaster_fk: int, tag: str = None, userid_fk: int = None, db: Session = Depends(get_db)):
    db_categorymaster = database_models.categorymaster(name=name, commonmaster_fk=commonmaster_fk, tag=tag, userid_fk=userid_fk)
    db.add(db_categorymaster)
    db.commit()
    db.refresh(db_categorymaster)
    return db_categorymaster

@app.post("/productsandservices/")
def create_productsandservices(name: str, categorymaster_fk: int, description: str = None, userid_fk: int = None, db: Session = Depends(get_db)):
    db_productsandservices = database_models.productsandservices(name=name, categorymaster_fk=categorymaster_fk, description=description,userid_fk=userid_fk)
    db.add(db_productsandservices)
    db.commit()
    db.refresh(db_productsandservices)
    return db_productsandservices

@app.post("/transactions/")
def create_transactions(amount: float, products_services_fk: int, transaction_date: str, userid_fk: int, note: str = None, db: Session = Depends(get_db)):
    db_transactions = database_models.transactions(amount=amount, products_services_fk=products_services_fk, transaction_date=transaction_date, userid_fk=userid_fk, note=note)
    db.add(db_transactions)
    db.commit()
    db.refresh(db_transactions)
    return db_transactions

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
    network_access: str = database_models.NetworkAccess.OPEN.value,
    ip_addresses: list[str] | None = Query(default=None),
    usergroup_fk: int | None = None,
    is_active: int = 1,
    db: Session = Depends(get_db),
):
    network_access, ip_addresses = resolve_network_access(network_access, ip_addresses)
    db_user = database_models.User(
        username=username,
        email=email,
        full_name=full_name,
        hashed_password=pwd_context.hash(password),
        is_active=is_active,
        network_access=network_access,
        ip_addresses=ip_addresses,
        usergroup_fk=usergroup_fk,
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
    if usergroup_fk is not None:
        db_user.usergroup_fk = usergroup_fk
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