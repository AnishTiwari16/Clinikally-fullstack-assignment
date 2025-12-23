from dotenv import load_dotenv
from psycopg2 import pool
import os
load_dotenv()


DB_MIN_CONNECTIONS = os.getenv("DB_MIN_CONNECTIONS")
DB_MAX_CONNECTIONS = os.getenv("DB_MAX_CONNECTIONS")
DATABASE_NAME= os.getenv("DATABASE_NAME")
DB_USER_NAME= os.getenv("DB_USER_NAME")
DB_PASSWORD= os.getenv("DB_PASSWORD")
DB_HOST_NAME= os.getenv("DB_HOST_NAME")
DB_PORT= os.getenv("DB_PORT")


db_host = DB_HOST_NAME 
db_pool = pool.SimpleConnectionPool(
            minconn=DB_MIN_CONNECTIONS,
            maxconn=DB_MAX_CONNECTIONS,
            database=DATABASE_NAME,
            user=DB_USER_NAME,
            password=DB_PASSWORD,
            host= db_host,
            port=DB_PORT
    )