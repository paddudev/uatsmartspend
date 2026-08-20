import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

db_url = os.environ["DATABASE_URL"]
engine = create_engine(db_url)
session = sessionmaker(autocommit=False, autoflush=False, bind=engine)