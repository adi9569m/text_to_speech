import pytest
from backend.models.database import SessionLocal
from backend.models.user import User
from backend.models.history import AudioHistory


@pytest.fixture(autouse=True, scope="session")
def clean_test_artifacts():
    yield
    db = SessionLocal()
    try:
        test_users = (
            db.query(User)
            .filter(
                (User.username.like("user_%"))
                | (User.username.like("login_%"))
                | (User.username.like("named_%"))
                | (User.username.like("alpha_%"))
                | (User.username.like("beta_%"))
                | (User.username.like("dup_%"))
                | (User.username.like("user1_%"))
                | (User.username.like("user2_%"))
            )
            .all()
        )
        user_ids = [u.id for u in test_users]
        if user_ids:
            db.query(AudioHistory).filter(AudioHistory.user_id.in_(user_ids)).delete(
                synchronize_session=False
            )
            db.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
            db.commit()
    finally:
        db.close()
