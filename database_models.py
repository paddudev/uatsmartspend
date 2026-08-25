import enum

from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

Base = declarative_base()

class Capability(enum.Enum):
    READ = "read"
    CREATE = "create"
    MODIFY = "modify"
    UNMASK_PII = "unmask_pii"
    SOFT_DELETE = "soft_delete"

class capabilitymaster(Base):
    __tablename__ = "capabilitymaster"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String)
    tag = Column(String)
    
class NetworkAccess(enum.Enum):
    OPEN = "open"
    LIMITED = "limited"

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(100))
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[int] = mapped_column(default=1)
    network_access: Mapped[str] = mapped_column(String(20), nullable=False, default=NetworkAccess.OPEN.value, server_default=NetworkAccess.OPEN.value)
    ip_addresses: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    usergroup_fk: Mapped[int] = mapped_column(ForeignKey("usergroup.id"), nullable=False)

    groups: Mapped[list[usergroup]] = relationship(back_populates="user", cascade="all, delete-orphan", foreign_keys="usergroup.userid_fk")

class usergroup(Base):
    __tablename__ = "usergroup"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(200))
    tag: Mapped[str] = mapped_column(String(50))
    userid_fk: Mapped[int] = mapped_column(ForeignKey("users.id") , nullable=False)
    capabilitymaster_fk: Mapped[dict] = mapped_column(JSONB, nullable=False)

    user: Mapped["User"] = relationship(back_populates="groups", foreign_keys=[userid_fk])
    
class commonmaster(Base):
    __tablename__ = "commonmaster"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String)
    tag = Column(String)
    userid_fk = Column(Integer, nullable=False)

class categorymaster(Base):
    __tablename__ = "categorymaster"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique = True, nullable=False, index=True)
    commonmaster_fk = Column(Integer, nullable=False)
    tag = Column(String)
    userid_fk = Column(Integer, nullable=False)

class productsandservices(Base):
    __tablename__ = "productsandservices"
    id= Column(Integer, primary_key=True, index=True)
    name = Column(String, unique = True, index=True, nullable=False)
    description = Column(String)
    categorymaster_fk = Column(Integer, nullable=False)
    userid_fk = Column(Integer, nullable=False)

class transactions(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    products_services_fk = Column(Integer, nullable=False)
    transaction_date = Column(String, nullable=False)
    userid_fk = Column(Integer, nullable=False)
    note = Column(String)
    

