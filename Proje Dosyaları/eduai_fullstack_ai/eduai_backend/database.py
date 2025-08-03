"""
Database module for EduAI backend.

This module uses the built‑in ``sqlite3`` module to manage a simple SQL database
for demonstration purposes. In a production environment you would likely
replace this with a fully featured database like PostgreSQL and use an ORM
such as SQLAlchemy or SQLModel. However, the challenge environment does not
allow the installation of third‑party dependencies, so this implementation
sticks to the standard library. The schema mirrors the simplified data model
described in the project specification.
"""

import os
import sqlite3
from contextlib import contextmanager
from typing import Iterator


DB_PATH = os.path.join(os.path.dirname(__file__), "eduai.db")


def init_db() -> None:
    """Initialize database and create tables if they do not exist."""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        # Enable foreign keys
        cursor.execute("PRAGMA foreign_keys = ON;")
        # Create users table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL
            );
            """
        )
        # Exam types table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS exam_types (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL UNIQUE
            );
            """
        )
        # User exams (many‑to‑many association)
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS user_exams (
                user_id INTEGER NOT NULL,
                exam_id INTEGER NOT NULL,
                PRIMARY KEY (user_id, exam_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (exam_id) REFERENCES exam_types(id) ON DELETE CASCADE
            );
            """
        )
        # User progress table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS user_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                topic TEXT NOT NULL,
                status TEXT NOT NULL,
                score REAL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            """
        )
        # AI interactions table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS ai_interactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                interaction_type TEXT NOT NULL,
                content TEXT,
                result TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            """
        )
        # Weekly plans table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS weekly_plans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                week_start TEXT NOT NULL,
                subjects TEXT NOT NULL,
                tests TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            """
        )
        conn.commit()


@contextmanager
def get_db() -> Iterator[sqlite3.Connection]:
    """
    Context manager for database connections. Each API request should
    obtain its own connection to ensure thread safety. The connection
    returns rows as dictionaries for convenience.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def seed_exam_types() -> None:
    """Insert default exam types if they do not already exist."""
    default_exams = [
        (1, "TYT"),
        (2, "AYT"),
        (3, "YKS"),
        (4, "ALES"),
        (5, "KPSS"),
    ]
    with get_db() as conn:
        cursor = conn.cursor()
        for exam_id, name in default_exams:
            cursor.execute(
                "INSERT OR IGNORE INTO exam_types (id, name) VALUES (?, ?);",
                (exam_id, name),
            )
        conn.commit()
