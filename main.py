from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware  
from database import session,engine 
import database_models
from sqlalchemy.orm import Session

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

@app.get("/users/")
def read_users(db: Session = Depends(get_db)):
    return db.query(database_models.User).all()

@app.get("/users/{user_id}")
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(database_models.User).filter(database_models.User.id == user_id).first()
    if db_user:
        return db_user
    return {"message": "User not found!"}

@app.post("/users/")
def create_user(username: str, email: str, full_name: str, hashed_password: str, is_active: int = 1, db: Session = Depends(get_db)):
    db_user = database_models.User(username=username, email=email, full_name=full_name, hashed_password=hashed_password, is_active=is_active)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.put("/users/{user_id}")
def update_user(user_id: int, username: str = None, email: str = None, full_name: str = None, hashed_password: str = None, is_active: int = None, db: Session = Depends(get_db)):
    db_user = db.query(database_models.User).filter(database_models.User.id == user_id).first()
    if not db_user:
        return {"message": "User not found!"}
    if username is not None:
        db_user.username = username
    if email is not None:
        db_user.email = email
    if full_name is not None:
        db_user.full_name = full_name
    if hashed_password is not None:
        db_user.hashed_password = hashed_password
    if is_active is not None:
        db_user.is_active = is_active
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/usergroup/")
def read_usergroups(db: Session = Depends(get_db)):
    return db.query(database_models.usergroup).all()

@app.get("/usergroup/{usergroup_id}")
def read_usergroup(usergroup_id: int, db: Session = Depends(get_db)):
    db_usergroup = db.query(database_models.usergroup).filter(database_models.usergroup.id == usergroup_id).first()
    if db_usergroup:
        return db_usergroup
    return {"message": "User group not found!"}

@app.post("/usergroup/")
def create_usergroup(name: str, userid_fk: int, capabilitymaster_fk: dict, description: str = None, tag: str = None, db: Session = Depends(get_db)):
    db_usergroup = database_models.usergroup(name=name, description=description, tag=tag, userid_fk=userid_fk, capabilitymaster_fk=capabilitymaster_fk)
    db.add(db_usergroup)
    db.commit()
    db.refresh(db_usergroup)
    return db_usergroup

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
        db_usergroup.capabilitymaster_fk = capabilitymaster_fk
    db.commit()
    db.refresh(db_usergroup)
    return db_usergroup

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